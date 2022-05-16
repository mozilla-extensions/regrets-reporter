from transformers import AutoTokenizer
import datasets


class RRUMDatasetArrow():
    tokenizer = AutoTokenizer.from_pretrained(
        'cross-encoder/stsb-roberta-base')
    _text_types = ['title', 'description', 'transcript']
    _text_features = [
        'regret_title', 'recommendation_title', 'regret_thumbnail', 'recommendation_thumbnail', 'regret_description',
        'recommendation_description', 'regret_transcript', 'recommendation_transcript'
    ]
    _scalar_features = ['channel_sim']

    def __init__(self, pandas_data, with_transcript):
        if ~with_transcript:
            RRUMDatasetArrow._text_types = RRUMDatasetArrow._text_types[0:2]
            RRUMDatasetArrow._text_features = RRUMDatasetArrow._text_features[0:6]
        df = pandas_data.loc[:, RRUMDatasetArrow._text_features +
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
            RRUMDatasetArrow._text_features)
        self.encoded_dataset.set_format(
            type='torch', columns=self.encoded_dataset.column_names)

    def _tokenize(self, example):
        features_full = dict()
        for example_key in RRUMDatasetArrow._text_types:
            features = dict(RRUMDatasetArrow.tokenizer(example[f'regret_{example_key}'].strip(
            ), example[f'recommendation_{example_key}'].strip(), padding="max_length", truncation=True, max_length=128))
            for feat_key in features.copy():
                features[f"{example_key}_{feat_key}"] = features.pop(feat_key)
            features_full.update(features)
        return features_full


class RRUMPredictDatasetArrow():
    tokenizer = AutoTokenizer.from_pretrained(
        'cross-encoder/stsb-roberta-base')
    _text_types = ['title', 'description', 'transcript']
    _text_features = [
        'regret_title', 'recommendation_title', 'regret_thumbnail', 'recommendation_thumbnail', 'regret_description',
        'recommendation_description', 'regret_transcript', 'recommendation_transcript'
    ]
    _scalar_features = ['channel_sim']

    def __init__(self, pandas_data, with_transcript):
        if ~with_transcript:
            RRUMDatasetArrow._text_types = RRUMDatasetArrow._text_types[0:2]
            RRUMDatasetArrow._text_features = RRUMDatasetArrow._text_features[0:6]
        df = pandas_data.loc[:, RRUMPredictDatasetArrow._text_features +
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
            RRUMPredictDatasetArrow._text_features)
        self.encoded_dataset.set_format(
            type='torch', columns=self.encoded_dataset.column_names)

    def _tokenize(self, example):
        features_full = dict()
        for example_key in RRUMPredictDatasetArrow._text_types:
            features = dict(RRUMPredictDatasetArrow.tokenizer(example[f'regret_{example_key}'].strip(
            ), example[f'recommendation_{example_key}'].strip(), padding="max_length", truncation=True, max_length=128))
            for feat_key in features.copy():
                features[f"{example_key}_{feat_key}"] = features.pop(feat_key)
            features_full.update(features)
        return features_full
