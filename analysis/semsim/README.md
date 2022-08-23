# RegretsReporter semantic similarity model of YouTube videos

This `semsim` directory of the repository contains Python code for the semantic similarity model and its data loading, example scripts for training and predicting with the model, and code to fetch training and prediction data from Google BigQuery. For general public, the code for the semantic similary model is the most interesting part since other scripts can be depended on Mozilla's RegretsReport project internals and for example their BigQuery instance.

You can read more details about the background and the architecture of the model from Mozilla's [blog post](https://foundation.mozilla.org/en/blog/the-regretsreporter-user-controls-study-machine-learning-to-measure-semantic-similarity-of-youtube-videos/).

## Python requirements

Requirements can be found from `requirements.txt` file and installed by running `pip install -r requirements.txt`.

## Directory structure

### Semantic similarity model code

Code for the semantic similarity model and its data loading can be found from `unifiedmodel.py` file. The file contains two classes: `RRUMDataset` for data loading and `RRUM` for the model. The `RR` stands for `RegretsReporter` and `UM` for `UnifiedModel`.

#### RRUMDataset class

The `RRUMDataset` class accepts data for model training or predicting as input in the format of Pandas DataFrame, PyArrow Table, iterable BigQuery ReadRowsIterable or iterable PyArrow RecordBatch. Data loading and processing is based on Hugging Face `datasets` library which you can read more about [here](https://huggingface.co/docs/datasets/index). You can configure the dataset with following input parameters of the class:
- `with_transcript` boolean whether you want to include only rows with video transcripts or rows without transcripts. Used to train different models for both cases
- `cross_encoder_model_name_or_path` string for text tokenization model name available in Hugging Face. In the end, we used `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1`.
- `label_col` string for the label column name in your data, by default `label`. Set to `None` if you don't have label column, i.e. you are predicting not training the model.
- `label_map` dict map for encoding string labels into integers, by default `None`. If it's `None` and your labels are strings, they are automatically encoded.
- `balance_label_counts` boolean whether you want to sample dataset so that each label has same amount of rows, by default `False`.
- `max_length` int for setting text tokenization max length, by default `128`.
- `do_train_test_split` boolean whether you want to split your data into separate train and test splits, by default `False`.
- `test_size` float for setting the test split size as percentage, by default `0.25`.
- `seed` int for setting a random generator seed for train test splitting, by default `42`.
- `keep_video_ids_for_predictions` boolean whether you want preserve video ids in your dataset, by default `False`. Used mainly at prediction phase when predictions are stored in BigQuery along with their video ids.
- `encode_on_the_fly` boolean whether you want to encode (tokenize) the dataset on the fly during training or prediction, by default `False`. Will slow down the training/prediction but can potentially help with memory issues.
- `clean_text` boolean whether you want to clean your text data, by default `False`. Text cleaning will for example remove URLs and other unnecessary noise from text using functions in `text_cleaning.py` file. Can improve the model but will slow down data preprocessing and prediction considerably.
- `processing_batch_size` int for batch size in `datasets` library's processing methods, by default `1000`.
- `processing_num_proc` int for setting number of processes in `datasets` library's processing methods, by default `1`. If set to `None` the number will be set to your CPU core amount. 

#### RRUM class

The `RRUM` class holds our modeling code and is actually a PyTorch Lightning `LightningModule` since we use PyTorch and PyTorch Lightning as our modeling frameworks. You can read mode about PyTorch Lightning [here](https://pytorch-lightning.readthedocs.io/en/stable/). You can configure the model with following input parameters of the class:
- `text_types` list for defining used text types (e.g. 'title', 'description' and 'transcript') in the model. Each text type will get their own transformer model for encoding text embeddings. At our case, `text_types` is already defined as variable inside `RRUMDataset` class and can be set for `RRUM` from there.
- `scalar_features` list for defining used scalar features (e.g. channel similarity boolean scalar) in the model. At our case, `scalar_features` is already defined as variable inside `RRUMDataset` class and can be set for `RRUM` from there.
- `label_col` string for the label column name in your data. At our case, `label_col` is already defined as variable inside `RRUMDataset` class and can be set for `RRUM` from there. Only needed for model training, for predicting can be set to `None`.
- `optimizer_config` function for configuring model training optimizer. Allows you to experiment with different PyTorch optimizers and learning rate schedules. A simple example of using Adam without LR scheduling: `(lambda x: torch.optim.Adam(x.parameters(), lr=5e-5))`.
- `cross_encoder_model_name_or_path` string for transformer (cross-encoder) model name available in Hugging Face. In the end, we used `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1`.
- `freeze_policy` function for configuring the freezing of pretrained transformer (cross-encoder) layers for model training, by default `None` so no freezing. A simple example of freezing every layer except the last classification layer of cross-encoder: `(lambda x: 'classifier' not in x)`.
- `pos_weight` int for setting the weight of positive label examples in PyTorch's `BCEWithLogitsLoss` loss function, by default `None` so no weight. Read more about it from PyTorch's [documentation](https://pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html).

### Model training code

An example code for the training of the semantic similarity model can be found from `training.py` file. The code uses PyTorch Lightning's `Trainer` which you can read more about [here](https://pytorch-lightning.readthedocs.io/en/stable/common/trainer.html).

### Model predicting code

An example code for predicting with trained semantic similarity model can be found from `prediction.py` file. The code uses PyTorch Lightning's `Trainer` and its `predict` method which you can read more about [here](https://pytorch-lightning.readthedocs.io/en/stable/common/trainer.html). **Note**: prediction codes in that file are tailored for the RegretsReporter project and for example contain code for saving predictions to Google BigQuery but can still be applicable to other uses too.

### BigQuery data fetching code

RegretsReporter project specific code for fetching model training and prediction data from Google BigQuery can be found from `data.py` file.