from transformers import AutoTokenizer, AutoModelForSequenceClassification
import datasets
import pytorch_lightning as pl
import torchmetrics
import torch.nn as nn
import torch


class RRUMDatasetArrow():
    tokenizer = AutoTokenizer.from_pretrained(
        'cross-encoder/stsb-roberta-base')
    _scalar_features = ['channel_sim']

    def __init__(self, pandas_data, with_transcript):
        self._text_types = ['title', 'description'] + \
            (['transcript'] if with_transcript else [])
        self._text_features = [
            'regret_title', 'recommendation_title', 'regret_thumbnail', 'recommendation_thumbnail', 'regret_description',
            'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if with_transcript else [])
        df = pandas_data.loc[:, self._text_features +
                             RRUMDatasetArrow._scalar_features + ['label']]
        self.dataset = datasets.Dataset.from_pandas(df)
        if '__index_level_0__' in self.dataset.column_names:
            self.dataset = self.dataset.remove_columns('__index_level_0__')
        self._encode()

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, index):
        return self.encoded_dataset[index]

    def _encode(self):
        self.encoded_dataset = self.dataset.map(self._tokenize, batched=False)
        self.encoded_dataset = self.encoded_dataset.remove_columns(
            self._text_features)
        self.encoded_dataset.set_format(
            type='torch', columns=self.encoded_dataset.column_names)

    def _tokenize(self, example):
        features_full = dict()
        for example_key in self._text_types:
            features = dict(RRUMDatasetArrow.tokenizer(example[f'regret_{example_key}'].strip(
            ), example[f'recommendation_{example_key}'].strip(), padding="max_length", truncation=True, max_length=128))
            for feat_key in features.copy():
                features[f"{example_key}_{feat_key}"] = features.pop(feat_key)
            features_full.update(features)
        return features_full


class RRUMPredictDatasetArrow():
    tokenizer = AutoTokenizer.from_pretrained(
        'cross-encoder/stsb-roberta-base')
    _scalar_features = ['channel_sim']

    def __init__(self, pandas_data, with_transcript):
        self._text_types = ['title', 'description'] + \
            (['transcript'] if with_transcript else [])
        self._text_features = [
            'regret_title', 'recommendation_title', 'regret_thumbnail', 'recommendation_thumbnail', 'regret_description',
            'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if with_transcript else [])
        df = pandas_data.loc[:, self._text_features +
                             RRUMPredictDatasetArrow._scalar_features]
        self.dataset = datasets.Dataset.from_pandas(df)
        if '__index_level_0__' in self.dataset.column_names:
            self.dataset = self.dataset.remove_columns('__index_level_0__')
        self._encode()

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, index):
        return self.encoded_dataset[index]

    def _encode(self):
        self.encoded_dataset = self.dataset.map(self._tokenize, batched=False)
        self.encoded_dataset = self.encoded_dataset.remove_columns(
            self._text_features)
        self.encoded_dataset.set_format(
            type='torch', columns=self.encoded_dataset.column_names)

    def _tokenize(self, example):
        features_full = dict()
        for example_key in self._text_types:
            features = dict(RRUMPredictDatasetArrow.tokenizer(example[f'regret_{example_key}'].strip(
            ), example[f'recommendation_{example_key}'].strip(), padding="max_length", truncation=True, max_length=128))
            for feat_key in features.copy():
                features[f"{example_key}_{feat_key}"] = features.pop(feat_key)
            features_full.update(features)
        return features_full


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
