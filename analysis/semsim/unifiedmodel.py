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
    _scalar_features = ['channel_sim']

    def __init__(self, pandas_data, with_transcript, max_length=128):
        self._text_types = ['title', 'description'] + \
            (['transcript'] if with_transcript else [])
        self._text_features = [
            'regret_title', 'recommendation_title', 'regret_thumbnail', 'recommendation_thumbnail', 'regret_description',
            'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if with_transcript else [])
        text_features_df = pandas_data.loc[:, self._text_features]
        num_features_df = pandas_data.loc[:,
                                          RRUMDatasetArrow._scalar_features + ['label']]
        self.text_features_dataset = datasets.Dataset.from_pandas(
            text_features_df)
        self.num_features_dataset = datasets.Dataset.from_pandas(
            num_features_df)
        if '__index_level_0__' in self.text_features_dataset.column_names:
            self.text_features_dataset = self.text_features_dataset.remove_columns(
                '__index_level_0__')
        if '__index_level_0__' in self.num_features_dataset.column_names:
            self.num_features_dataset = self.num_features_dataset.remove_columns(
                '__index_level_0__')
        self.max_length = max_length
        self.num_cpu = multiprocessing.cpu_count()

        self._preprocess()
        self._encode()

    def __len__(self):
        return len(self.encoded_dataset)

    def __getitem__(self, index):
        return self.encoded_dataset[index]

    def _preprocess(self):
        self.text_features_dataset = self.text_features_dataset.map(
            self._truncate_and_strip_text, batched=True, num_proc=self.num_cpu)

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
        return example

    def _encode(self):
        self.encoded_dataset = None
        for text_type in self._text_types:
            encoded_text_type = self.text_features_dataset.map(lambda regret, recommendation: RRUMDatasetArrow.tokenizer(regret, recommendation, padding="max_length", truncation=True, max_length=self.max_length),
                                                               batched=True, num_proc=self.num_cpu, input_columns=[f'regret_{text_type}', f'recommendation_{text_type}'], remove_columns=self.text_features_dataset.column_names)
            encoded_text_type = encoded_text_type.rename_columns(
                {col: f'{text_type}_{col}' for col in encoded_text_type.column_names})  # e.g. input_ids -> title_input_ids so we have separate input_ids for each text_type
            if self.encoded_dataset:
                self.encoded_dataset = datasets.concatenate_datasets(
                    [self.encoded_dataset, encoded_text_type], axis=1)
            else:
                self.encoded_dataset = encoded_text_type

        self.encoded_dataset = datasets.concatenate_datasets(
            [self.encoded_dataset, self.num_features_dataset], axis=1)  # concatenate final encoded_dataset where text and numerical features are together
        self.encoded_dataset.set_format(
            type='torch', columns=self.encoded_dataset.column_names)


class RRUMPredictDatasetArrow():
    tokenizer = AutoTokenizer.from_pretrained(
        'cross-encoder/stsb-roberta-base')
    _scalar_features = ['channel_sim']

    def __init__(self, pandas_data, with_transcript, max_length=128):
        self._text_types = ['title', 'description'] + \
            (['transcript'] if with_transcript else [])
        self._text_features = [
            'regret_title', 'recommendation_title', 'regret_thumbnail', 'recommendation_thumbnail', 'regret_description',
            'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if with_transcript else [])
        text_features_df = pandas_data.loc[:, self._text_features]
        num_features_df = pandas_data.loc[:,
                                          RRUMPredictDatasetArrow._scalar_features]
        self.text_features_dataset = datasets.Dataset.from_pandas(
            text_features_df)
        self.num_features_dataset = datasets.Dataset.from_pandas(
            num_features_df)
        if '__index_level_0__' in self.text_features_dataset.column_names:
            self.text_features_dataset = self.text_features_dataset.remove_columns(
                '__index_level_0__')
        if '__index_level_0__' in self.num_features_dataset.column_names:
            self.num_features_dataset = self.num_features_dataset.remove_columns(
                '__index_level_0__')
        self.max_length = max_length
        self.num_cpu = multiprocessing.cpu_count()

        self._preprocess()
        self._encode()

    def __len__(self):
        return len(self.encoded_dataset)

    def __getitem__(self, index):
        return self.encoded_dataset[index]

    def _preprocess(self):
        self.text_features_dataset = self.text_features_dataset.map(
            self._truncate_and_strip_text, batched=True, num_proc=self.num_cpu)

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
        return example

    def _encode(self):
        self.encoded_dataset = None
        for text_type in self._text_types:
            encoded_text_type = self.text_features_dataset.map(lambda regret, recommendation: RRUMPredictDatasetArrow.tokenizer(regret, recommendation, padding="max_length", truncation=True, max_length=self.max_length),
                                                               batched=True, num_proc=self.num_cpu, input_columns=[f'regret_{text_type}', f'recommendation_{text_type}'], remove_columns=self.text_features_dataset.column_names)
            encoded_text_type = encoded_text_type.rename_columns(
                {col: f'{text_type}_{col}' for col in encoded_text_type.column_names})  # e.g. input_ids -> title_input_ids so we have separate input_ids for each text_type
            if self.encoded_dataset:
                self.encoded_dataset = datasets.concatenate_datasets(
                    [self.encoded_dataset, encoded_text_type], axis=1)
            else:
                self.encoded_dataset = encoded_text_type

        self.encoded_dataset = datasets.concatenate_datasets(
            [self.encoded_dataset, self.num_features_dataset], axis=1)  # concatenate final encoded_dataset where text and numerical features are together
        self.encoded_dataset.set_format(
            type='torch', columns=self.encoded_dataset.column_names)


class RRUM(pl.LightningModule):
    def __init__(self, with_transcript, optimizer_config, freeze_policy=None, pos_weight=None):
        super().__init__()
        self.optimizer_config = optimizer_config
        self._text_types = ['title', 'description'] + \
            (['transcript'] if with_transcript else [])
        self.cross_encoders = nn.ModuleDict({})
        for t in self._text_types:
            self.cross_encoders[t] = AutoModelForSequenceClassification.from_pretrained(
                'cross-encoder/stsb-roberta-base').to("cuda:0")
        if freeze_policy is not None:
            for xe in self.cross_encoders.values():
                for name, param in xe.named_parameters():
                    if freeze_policy(name):
                        param.requires_grad = False

        self.lin1 = nn.Linear(len(self._text_types) + 1, 1)
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
        for f in self._text_types:
            cross_logits[f] = self.cross_encoders[f](
                input_ids=x[f"{f}_input_ids"], attention_mask=x[f"{f}_attention_mask"]).logits
        scalar = x["channel_sim"]
        x = torch.cat((
            *cross_logits.values(),
            scalar[:, None]),
            1
        )
        del cross_logits, scalar

        x = self.lin1(x)
        return x

    def configure_optimizers(self):
        return self.optimizer_config(self)

    def training_step(self, train_batch, batch_idx):
        y = train_batch["label"].unsqueeze(1).float()
        logits = self(train_batch)
        loss = self.loss(logits, y)
        self.log('train_loss', loss)
        return loss

    def validation_step(self, val_batch, batch_idx):
        y = val_batch["label"].unsqueeze(1).float()
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
