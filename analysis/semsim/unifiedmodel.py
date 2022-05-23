from transformers import AutoTokenizer, AutoModelForSequenceClassification
import datasets
import pytorch_lightning as pl
import torchmetrics
import torch.nn as nn
import torch
import multiprocessing


class RRUMDatasetArrow():
    tokenizer = AutoTokenizer.from_pretrained(
        'cross-encoder/stsb-roberta-base')
    scalar_features = ['channel_sim']
    _image_features = ['regret_thumbnail',
                       'recommendation_thumbnail']  # not used atm

    def __init__(self, pandas_data, with_transcript, label_col="label", max_length=128, encode_on_the_fly=False, processing_batch_size=1000, processing_num_proc=None):
        self.label_col = label_col
        self.max_length = max_length
        self.processing_batch_size = processing_batch_size
        self.processing_num_proc = multiprocessing.cpu_count(
        ) if not processing_num_proc else processing_num_proc

        self.text_types = ['title', 'description'] + \
            (['transcript'] if with_transcript else [])
        self._text_features = [
            'regret_title', 'recommendation_title', 'regret_description',
            'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if with_transcript else [])

        df = pandas_data.loc[:, self._text_features + self.scalar_features + (
            [self.label_col] if self.label_col else [])]
        self.dataset = datasets.Dataset.from_pandas(df)
        if '__index_level_0__' in self.dataset.column_names:
            self.dataset = self.dataset.remove_columns('__index_level_0__')

        self._preprocess()
        if encode_on_the_fly:
            self.dataset.set_transform(self._encode_on_the_fly)
        else:
            self.dataset = self._encode(self.dataset)

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, index):
        return self.dataset[index]

    def _preprocess(self):
        self.dataset = self.dataset.map(self._truncate_and_strip_text, batched=True,
                                        batch_size=self.processing_batch_size)

    def _truncate_and_strip_text(self, example):
        # tokenizer will truncate to max_length tokens anyway so to save RAM let's truncate to max_length words already beforehand
        # one word is usually one or more tokens so should be safe to truncate this way without losing information
        for feat in self._text_features:
            if isinstance(example[feat], list):
                example[feat] = [
                    ' '.join(text.split()[:self.max_length]).strip() for text in example[feat]]
            elif isinstance(example[feat], str):
                example[feat] = ' '.join(example[feat].split()[
                                         :self.max_length]).strip()
            else:
                raise ValueError(
                    f'Type of example is {type(example[feat])} when list or string is allowed')
        return example

    def _encode(self, dataset):
        encoded_dataset = None
        for text_type in self.text_types:
            encoded_text_type = dataset.map(lambda regret, recommendation: self.tokenizer(regret, recommendation, padding="max_length", truncation=True, max_length=self.max_length), batched=True,
                                            batch_size=self.processing_batch_size, num_proc=self.processing_num_proc, input_columns=[f'regret_{text_type}', f'recommendation_{text_type}'], remove_columns=dataset.column_names)
            encoded_text_type = encoded_text_type.rename_columns(
                {col: f'{text_type}_{col}' for col in encoded_text_type.column_names})  # e.g. input_ids -> title_input_ids so we have separate input_ids for each text_type
            if encoded_dataset:
                encoded_dataset = datasets.concatenate_datasets(
                    [encoded_dataset, encoded_text_type], axis=1)
            else:
                encoded_dataset = encoded_text_type

        # copy scalar features and label from original dataset to the encoded dataset
        for scalar_feat in self.scalar_features:
            encoded_dataset = encoded_dataset.add_column(
                name=scalar_feat, column=dataset[scalar_feat])
        if self.label_col:
            encoded_dataset = encoded_dataset.add_column(
                name=self.label_col, column=dataset[self.label_col])
        encoded_dataset.set_format(
            type='torch', columns=encoded_dataset.column_names)
        return encoded_dataset

    def _encode_on_the_fly(self, batch):
        for text_type in self.text_types:
            encoded_text_type = dict(self.tokenizer(
                batch[f'regret_{text_type}'], batch[f'recommendation_{text_type}'], padding="max_length", truncation=True, max_length=self.max_length, return_tensors="pt"))
            for encoded_key in encoded_text_type.copy():
                encoded_text_type[f"{text_type}_{encoded_key}"] = encoded_text_type.pop(
                    encoded_key)  # e.g. input_ids -> title_input_ids so we have separate input_ids for each text_type
            del batch[f'regret_{text_type}']
            del batch[f'recommendation_{text_type}']
            batch.update(encoded_text_type)
        for scalar_feat in self.scalar_features:
            batch[scalar_feat] = torch.as_tensor(batch[scalar_feat])
        if self.label_col:
            batch[self.label_col] = torch.as_tensor(batch[self.label_col])
        return batch


class RRUM(pl.LightningModule):
    def __init__(self, text_types, scalar_features, label_col, optimizer_config, device, freeze_policy=None, pos_weight=None):
        super().__init__()
        self.text_types = text_types
        self.scalar_features = scalar_features
        self.label_col = label_col
        self.optimizer_config = optimizer_config
        self.cross_encoders = nn.ModuleDict({})
        for t in self.text_types:
            self.cross_encoders[t] = AutoModelForSequenceClassification.from_pretrained(
                'cross-encoder/stsb-roberta-base').to(device)
        if freeze_policy is not None:
            for xe in self.cross_encoders.values():
                for name, param in xe.named_parameters():
                    if freeze_policy(name):
                        param.requires_grad = False

        self.lin1 = nn.Linear(len(self.text_types) +
                              len(self.scalar_features), 1)
        self.ac_metric = torchmetrics.Accuracy()
        self.pr_metric = torchmetrics.Precision()
        self.re_metric = torchmetrics.Recall()
        self.auc_metric = torchmetrics.AUROC()

        if pos_weight:
            self.loss = nn.BCEWithLogitsLoss(
                pos_weight=torch.Tensor([pos_weight]))
        else:
            self.loss = nn.BCEWithLogitsLoss()

    def forward(self, x):
        # for some reason the prediction call wraps the inputs in a length-1 list
        if isinstance(x, list):
            if (len(x) != 1):
                print("BAD!!!")
            x = x[0]
        cross_logits = {}
        for f in self.text_types:
            cross_logits[f] = self.cross_encoders[f](
                input_ids=x[f"{f}_input_ids"], attention_mask=x[f"{f}_attention_mask"]).logits
        x = torch.cat([*cross_logits.values()] +
                      [x[scalar][:, None] for scalar in self.scalar_features],
                      1
                      )
        del cross_logits

        x = self.lin1(x)
        return x

    def configure_optimizers(self):
        return self.optimizer_config(self)

    def training_step(self, train_batch, batch_idx):
        y = train_batch[self.label_col].unsqueeze(1).float()
        logits = self(train_batch)
        loss = self.loss(logits, y)
        self.log('train_loss', loss)
        return loss

    def validation_step(self, val_batch, batch_idx):
        y = val_batch[self.label_col].unsqueeze(1).float()
        logits = self(val_batch)
        loss = self.loss(logits, y)
        self.ac_metric(logits, y.int())
        self.pr_metric(logits, y.int())
        self.re_metric(logits, y.int())
        self.auc_metric(logits, y.int())
        self.log('validation_accuracy', self.ac_metric)
        self.log('validation_precision', self.pr_metric)
        self.log('validation_recall', self.re_metric)
        self.log('auc', self.auc_metric)
        self.log('val_loss', loss, prog_bar=True)

    def validation_epoch_end(self, outputs):
        self.log('validation_accuracy_ep', self.ac_metric)
        self.log('validation_precision_ep', self.pr_metric)
        self.log('validation_recall_ep', self.re_metric)
        self.log('validation auc', self.auc_metric)
