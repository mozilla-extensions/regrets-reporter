from transformers import AutoTokenizer, AutoModelForSequenceClassification
from google.cloud.bigquery_storage_v1.reader import ReadRowsIterable
import datasets
import pandas as pd
import pyarrow
import pytorch_lightning as pl
import torchmetrics
import torch.nn as nn
import torch
import types
import multiprocessing
from .text_cleaning import clean_text_funcs


class RRUMDatasetArrow():
    scalar_features = ['channel_sim']
    _image_features = ['regret_thumbnail',
                       'recommendation_thumbnail']  # not used atm

    def __init__(self, data, with_transcript, cross_encoder_model_name_or_path, label_col="label", label_map=None, balance_label_counts=False, max_length=128, do_train_test_split=False, test_size=0.25, seed=42, keep_video_ids_for_predictions=False, encode_on_the_fly=False, clean_text=False, processing_batch_size=1000, processing_num_proc=None):
        self._with_transcript = with_transcript
        self.tokenizer = AutoTokenizer.from_pretrained(
            cross_encoder_model_name_or_path)
        self.label_col = label_col
        self.label_map = label_map
        self.balance_label_counts = balance_label_counts
        self.max_length = max_length
        self.seed = seed
        self.keep_video_ids_for_predictions = keep_video_ids_for_predictions
        self.clean_text = clean_text
        self.processing_batch_size = processing_batch_size
        self.processing_num_proc = multiprocessing.cpu_count(
        ) if not processing_num_proc else processing_num_proc

        self.text_types = ['title', 'description'] + \
            (['transcript'] if self._with_transcript else [])
        self._text_features = [
            'regret_title', 'recommendation_title', 'regret_description',
            'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if self._with_transcript else [])

        # LOAD DATA INTO DATASET
        self.streaming_dataset = False
        if isinstance(data, pd.DataFrame):
            self.dataset = datasets.Dataset.from_pandas(data)
        elif isinstance(data, ReadRowsIterable) or isinstance(data, types.GeneratorType):
            examples_iterable = datasets.iterable_dataset.ExamplesIterable(
                self._streaming_generate_examples, {"iterable": data})
            self.dataset = datasets.IterableDataset(examples_iterable)
            self._stream_dataset_example = next(iter(self.dataset))
            self._stream_dataset_column_names = list(
                self._stream_dataset_example.keys())
            self.streaming_dataset = True
        elif isinstance(data, pyarrow.Table):
            self.dataset = datasets.Dataset(data)
        else:
            raise ValueError(
                f'Type of data is {type(data)} when pd.DataFrame, pyarrow.Table, google.cloud.bigquery_storage_v1.reader.ReadRowsIterable or generator of pyarrow.RecordBatch is allowed')

        # PREPROCESS DATASET
        self._preprocess()

        # ENCODE DATASET
        self.train_dataset = None
        self.test_dataset = None
        if self.streaming_dataset:
            # IterableDataset doesn't have train_test_split method
            if self.label_col:
                self.train_dataset = self._encode_streaming(self.dataset)
                print('Streaming dataset available in .train_dataset')
            else:
                self.test_dataset = self._encode_streaming(self.dataset)
                print(
                    'Streaming dataset available in .test_dataset because label_col=None')
        else:
            # dataset into train_dataset and/or test_dataset
            if do_train_test_split:
                ds = self.dataset.train_test_split(
                    test_size=test_size, shuffle=True, seed=self.seed, stratify_by_column=self.label_col)
                self.train_dataset = ds['train']
                self.test_dataset = ds['test']
                print(
                    f'Dataset was splitted into train and test with test_size={test_size}')
            else:
                if self.label_col:
                    self.train_dataset = self.dataset
                else:
                    self.test_dataset = self.dataset

            if encode_on_the_fly:
                if self.train_dataset:
                    self.train_dataset.set_transform(self._encode_on_the_fly)
                    print('On-the-fly encoded dataset available in .train_dataset')
                if self.test_dataset:
                    self.test_dataset.set_transform(self._encode_on_the_fly)
                    print('On-the-fly encoded dataset available in .test_dataset')
            else:
                if self.train_dataset:
                    self.train_dataset = self._encode(self.train_dataset)
                    print('Pre-encoded dataset available in .train_dataset')
                if self.test_dataset:
                    self.test_dataset = self._encode(self.test_dataset)
                    print('Pre-encoded dataset available in .test_dataset')

    def __len__(self):
        if self.streaming_dataset:
            raise ValueError(
                f'Streaming dataset does not support len() method')
        return len(self.dataset)

    def __getitem__(self, index):
        if self.streaming_dataset:
            return next(iter(self.dataset))
        return self.dataset[index]

    def _streaming_generate_examples(self, iterable):
        id_ = 0
        # TODO: make sure GeneratorType is pyarrow.RecordBatch
        if isinstance(iterable, types.GeneratorType):
            for examples in iterable:
                for ex in examples.to_pylist():
                    yield id_, ex
                    id_ += 1
        elif isinstance(iterable, ReadRowsIterable):
            for ex in iterable:
                yield id_, {key: ex[key].as_py() for key in ex}
                id_ += 1

    def _preprocess(self):
        if self._with_transcript:
            self.dataset = self.dataset.filter(
                lambda example: example['regret_transcript'] is not None and example['recommendation_transcript'] is not None)
        else:
            self.dataset = self.dataset.filter(
                lambda example: example['regret_transcript'] is None or example['recommendation_transcript'] is None)
        if self.label_col:
            if self.streaming_dataset:
                if self.label_col in self._stream_dataset_column_names and isinstance(self._stream_dataset_example[self.label_col], str):
                    if not self.label_map:
                        raise ValueError(
                            f'"label_map" dict was not provided and is needed to encode string labels for streaming datasets')
                    # cast_column method had issues with streaming dataset
                    self.dataset = self.dataset.map(
                        self._streaming_rename_labels)
            else:
                if self.dataset.features[self.label_col].dtype == 'string':
                    if not self.label_map:
                        self.label_map = {k: v for v, k in enumerate(
                            self.dataset.unique(self.label_col))}
                    self.dataset = self.dataset.filter(
                        lambda example: example[self.label_col] in self.label_map.keys())
                    self.dataset = self.dataset.cast_column(self.label_col, datasets.ClassLabel(
                        num_classes=len(self.label_map), names=list(self.label_map.keys())))

        self.dataset = self.dataset.filter(lambda example: not any(x in [None, ""] for x in [
                                           example[key] for key in self._text_features + self.scalar_features + ([self.label_col] if self.label_col else [])]))  # dropna

        if self.balance_label_counts and self.label_col and not self.streaming_dataset:
            label_datasets = {}
            for label in list(self.label_map.values()):
                label_dataset = self.dataset.filter(
                    lambda example: example[self.label_col] == label)
                label_datasets[len(label_dataset)] = label_dataset
            min_label_count = min(label_datasets)
            sampled_datasets = [dataset.train_test_split(train_size=min_label_count, shuffle=True, seed=self.seed)[
                'train'] if len(dataset) != min_label_count else dataset for dataset in label_datasets.values()]
            self.dataset = datasets.concatenate_datasets(sampled_datasets)

        if self.clean_text:
            self.dataset = self.dataset.map(self._clean_text, batched=not self.streaming_dataset,
                                            batch_size=self.processing_batch_size)
        self.dataset = self.dataset.map(self._truncate_and_strip_text, batched=not self.streaming_dataset,
                                        batch_size=self.processing_batch_size)

    def _streaming_rename_labels(self, example):
        # rename labels according to label_map if not already correct labels
        if isinstance(example[self.label_col], list):
            example[self.label_col] = [self.label_map.get(
                ex, None) for ex in example[self.label_col] if ex not in self.label_map.values()]
        elif isinstance(example[self.label_col], str) and example[self.label_col] not in self.label_map.values():
            example[self.label_col] = self.label_map.get(
                example[self.label_col], None)
        else:
            raise ValueError(
                f'Type of example label is {type(example[self.label_col])} when list or string is allowed')
        return example

    def _clean_text(self, example):
        for feat in self._text_features:
            example[feat] = clean_text_funcs(example[feat])[0] if isinstance(
                example[feat], str) else clean_text_funcs(example[feat])
        return example

    def _truncate_and_strip_text(self, example):
        # tokenizer will truncate to max_length tokens anyway so to save RAM let's truncate to max_length words already beforehand
        # one word is usually one or more tokens so should be safe to truncate this way without losing information
        for feat in self._text_features:
            if isinstance(example[feat], list):
                example[feat] = [
                    ' '.join(text.split()[:self.max_length]).strip() for text in example[feat] if text]
            elif isinstance(example[feat], str):
                example[feat] = ' '.join(example[feat].split()[
                                         :self.max_length]).strip()
            elif example[feat] is None:
                return None
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
        if self.keep_video_ids_for_predictions:
            for id in ['regret_id', "recommendation_id"]:
                encoded_dataset = encoded_dataset.add_column(
                    name=id, column=dataset[id])

        encoded_dataset.set_format(
            type='torch', columns=encoded_dataset.column_names)
        return encoded_dataset

    def _encode_streaming(self, dataset):
        encoded_dataset = dataset.map(self._encode_on_the_fly, batched=True,
                                      batch_size=self.processing_batch_size, remove_columns=list(set(self._stream_dataset_column_names)-set(self.scalar_features + (
                                          [self.label_col] if self.label_col else []) + (['regret_id', "recommendation_id"] if self.keep_video_ids_for_predictions else []))))  # IterableDataset doesn't have column_names attribute as normal Dataset
        encoded_dataset = encoded_dataset.with_format("torch")
        return encoded_dataset

    def _encode_on_the_fly(self, batch):
        for text_type in self.text_types:
            encoded_text_type = dict(self.tokenizer(
                batch[f'regret_{text_type}'], batch[f'recommendation_{text_type}'], padding="max_length", truncation=True, max_length=self.max_length, return_tensors="pt"))
            for encoded_key in encoded_text_type.copy():
                encoded_text_type[f"{text_type}_{encoded_key}"] = encoded_text_type.pop(encoded_key) if not self.streaming_dataset else encoded_text_type.pop(
                    encoded_key).squeeze(0)  # e.g. input_ids -> title_input_ids so we have separate input_ids for each text_type
            del batch[f'regret_{text_type}']
            del batch[f'recommendation_{text_type}']
            batch.update(encoded_text_type)
        for scalar_feat in self.scalar_features:
            batch[scalar_feat] = torch.as_tensor(
                batch[scalar_feat]) if not self.streaming_dataset else torch.as_tensor(batch[scalar_feat]).squeeze(0)
        if self.label_col:
            batch[self.label_col] = torch.as_tensor(
                batch[self.label_col]) if not self.streaming_dataset else torch.as_tensor(batch[self.label_col]).squeeze(0)
        return batch


class RRUM(pl.LightningModule):
    def __init__(self, text_types, scalar_features, label_col, optimizer_config, cross_encoder_model_name_or_path, freeze_policy=None, pos_weight=None):
        super().__init__()
        self.save_hyperparameters()
        self.text_types = text_types
        self.scalar_features = scalar_features
        self.label_col = label_col
        self.optimizer_config = optimizer_config
        self.cross_encoder_model_name_or_path = cross_encoder_model_name_or_path
        self.cross_encoders = nn.ModuleDict({})
        for t in self.text_types:
            self.cross_encoders[t] = AutoModelForSequenceClassification.from_pretrained(
                self.cross_encoder_model_name_or_path)
        if freeze_policy is not None:
            for xe in self.cross_encoders.values():
                for name, param in xe.named_parameters():
                    if freeze_policy(name):
                        param.requires_grad = False
        cross_encoder_out_features = list(self.cross_encoders.values())[0](
            torch.randint(1, 2, (1, 2))).logits.size(dim=1)
        self.lin1 = nn.Linear(len(self.cross_encoders) * cross_encoder_out_features +
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
        cross_logits = {}
        for f in self.text_types:
            inputs = {key.split(f'{f}_')[1]: x[key]
                      for key in x if f in key}  # e.g. title_input_ids -> input_ids since we have separate input_ids for each text_type
            cross_logits[f] = self.cross_encoders[f](**inputs).logits
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
        self.log('validation_auc', self.auc_metric)
        self.log('val_loss', loss, prog_bar=True)

    def validation_epoch_end(self, outputs):
        self.log('validation_accuracy_ep', self.ac_metric)
        self.log('validation_precision_ep', self.pr_metric)
        self.log('validation_recall_ep', self.re_metric)
        self.log('validation_auc_ep', self.auc_metric)
