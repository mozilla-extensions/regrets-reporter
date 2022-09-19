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
- `cross_encoder_model_name_or_path` string for transformer (cross-encoder) model name available in Hugging Face. In the end, we used `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1`.
- `optimizer_config` function for configuring model training optimizer and LR scheduling, by default `None` so predefined AdamW optimizer with LR warmup and linear decay scheduling is used. Allows you to experiment with different PyTorch optimizers and learning rate schedules. A simple example of using Adam without LR scheduling: `(lambda x: torch.optim.Adam(x.parameters(), lr=5e-5))`.
- `freeze_policy` function for configuring the freezing of pretrained transformer (cross-encoder) layers for model training, by default `None` so no freezing. A simple example of freezing every layer except the last classification layer of cross-encoder: `(lambda x: 'classifier' not in x)`.
- `pos_weight` int for setting the weight of positive label examples in PyTorch's `BCEWithLogitsLoss` loss function, by default `None` so no weight. Read more about it from PyTorch's [documentation](https://pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html).

### Semantic similarity model V2 code

Code for the semantic similarity model V2 and its data loading can be found from `unifiedmodel_v2.py` file. The file contains two classes: `RRUMDatasetV2` for data loading and `RRUMV2` for the model.

The V2 model includes three major architectural changes compared to the original V1 model:
1. Cross-encoder transformers have been replaced by just a transformer with a pooling layer. The new transformer takes two texts as an input (like the V1 model's cross-encoders) and outputs a pooled embedding. Basically, it's the same cross-encoder as in V1 model but its last classification layer has been remove so we get the pooled embedding as an output to be used further at our unified model V2.
2. The last linear layer has been replaced by a MLP (multilayer perceptron). Thanks to the change number 1, transformers now output embeddings which include a lot more information than just a single scalar value (as in V1 cross-encoder's output) so it made sense to feed those embeddings through a MLP instead of just a single linear layer.
3. There is an option to include YouTube channel embeddings as a feature in the V2 model. Channel embeddings must be pre-computed with some method and included in the training dataset so they are not learned on the fly during the unified model training. For example, we have trained a channel embedding model with Node2Vec method since we had channel co-recommendations network graph data. With unified model V2, you can use channel embeddings, or keep using V1's channel similarity scalar, or use both together, or use neither of them at all.

#### RRUMDatasetV2 class

Key changes to the V1's `RRUMDataset` class are:
- `cross_encoder_model_name_or_path` input parameter has been renamed to `model_name_or_path` as we don't really use cross-encoders anymore
- New input parameter `use_scalar_features` boolean to choose whether you want to include scalar features in your dataset, by default `True`
- New input parameter `use_channel_embeddings` boolean to choose whether you want to include channel embedding features in your dataset, by default `False`

#### RRUMV2 class

Key changes to the V1's `RRUM` class are:
- `cross_encoder_model_name_or_path` input parameter has been renamed to `model_name_or_path` as we don't really use cross-encoders anymore
- New input parameter `channel_embeddings` list for defining used channel embedding features in the model. At our case, `channel_embeddings` is already defined as variable inside `RRUMDatasetV2` class and can be set for `RRUMV2` from there.
- New input parameter `channel_embedding_dim` int to set the channel embedding dimension used in, for example, linear layers initialization, by default `None`. GIven dimension must actually match with channel embedding dimension in training data.

### Model training code

An example code for the training of the semantic similarity model can be found from `training.py` file. The code uses PyTorch Lightning's `Trainer` which you can read more about [here](https://pytorch-lightning.readthedocs.io/en/stable/common/trainer.html).

### Model predicting code

An example code for predicting with trained semantic similarity model can be found from `prediction.py` file. The code uses PyTorch Lightning's `Trainer` and its `predict` method which you can read more about [here](https://pytorch-lightning.readthedocs.io/en/stable/common/trainer.html). **Note**: prediction codes in that file are tailored for the RegretsReporter project and for example contain code for saving predictions to Google BigQuery but can still be applicable to other uses too.

### BigQuery data fetching code

RegretsReporter project specific code for fetching model training and prediction data from Google BigQuery can be found from `data.py` file.

## Input data format for the model

Generally, input data is pairs of features from two YouTube videos. At RegretsReporter project, those pairs use prefixes "regret" and "recommendation". A regret means a video user regretted seeing (don't want to see similar videos anymore) and recommendation means a video YouTube recommended to the user after the regret.

As explained earlier, model's input data loading and preprocessing is handled with the `RRUMDataset` class. The input data for the `RRUMDataset` is expected to have following feature columns:
- `regret_title` string for the title of the regret video
- `recommendation_title` string for the title of the recommendation video
- `regret_description` string for the description of the regret video
- `recommendation_description` string for the description of the recommendation video
- `regret_transcript` string for the transcript of the regret video
- `recommendation_transcript` string for the transcript of the recommendation video
- `channel_sim` int for regret and recommendation channel equality (boolean)

You can modify the `RRUMDataset` class code to work with different data formats and features.

`RRUMDataset` class will process the data into correct format for the `RRUM` model so it's adviced to use it. If you want to pass data directly to the `RRUM` model it expects each example to be a dict of PyTorch Tensor features. You can define used text features with the `RRUM` class's `text_types` parameter which should be a list of main text feature names, for example `['title', 'description', 'transcript']` as we had pairs of those features. Text features need to be tokenized which is automatically done at the `RRUMDataset`. Tokenized text features are expected to have following format of key names in the dict: text type name as prefix followed by underscore and tokenizer's output names, for example for the `title` feature the tokenized version should have `title_input_ids` and `title_attention_mask` keys since most tokenizers output `input_ids` and `attention_mask`. You can define used scalar features with the `RRUM` class's `scalar_features` parameter which should be a list of scalar feature names, for example `['channel_sim']` as we had only channel equality as a scalar feature. If you have labels for the training phase of the model, you can define used label key name in the dict with the `RRUM` class's `label_col` parameter.
As an example, an input dict for the `RRUM` model could look like this:
```python
{'title_input_ids': tensor([[     0,   1529,  43833,  ...,      1,      1,      1],
         [     0,   1342,  47515,  ...,      1,      1,      1],
         [     0,    581,    911,  ...,      1,      1,      1],
         ...,
         [     0,  88902,     12,  ...,      1,      1,      1],
         [     0,    335,  96222,  ...,      1,      1,      1],
         [     0, 196458,      9,  ...,      1,      1,      1]]),
 'title_attention_mask': tensor([[1, 1, 1,  ..., 0, 0, 0],
         [1, 1, 1,  ..., 0, 0, 0],
         [1, 1, 1,  ..., 0, 0, 0],
         ...,
         [1, 1, 1,  ..., 0, 0, 0],
         [1, 1, 1,  ..., 0, 0, 0],
         [1, 1, 1,  ..., 0, 0, 0]]),
 'description_input_ids': tensor([[     0,  20625,   6863,  ...,   2692,     12,      2],
         [     0,   2646,  10091,  ...,     70,    509,      2],
         [     0, 127402, 159392,  ...,     12,   1621,      2],
         ...,
         [     0,  98065,    613,  ...,      5,    118,      2],
         [     0,    468,    618,  ...,   1574,      5,      2],
         [     0,  93807,    397,  ...,     10,   4127,      2]]),
 'description_attention_mask': tensor([[1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1],
         ...,
         [1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1]]),
 'transcript_input_ids': tensor([[     0,    378, 158257,  ...,  56530,    341,      2],
         [     0,   1650,     83,  ...,     28,    378,      2],
         [     0,    136,  24145,  ...,  56904,  10160,      2],
         ...,
         [     0,  53389,    378,  ...,      8, 151050,      2],
         [     0,  12960,     88,  ...,   3478,  72856,      2],
         [     0,   1439, 130365,  ...,    594,  14408,      2]]),
 'transcript_attention_mask': tensor([[1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1],
         ...,
         [1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1],
         [1, 1, 1,  ..., 1, 1, 1]]),
 'channel_sim': tensor([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
         0, 0, 1, 0, 0, 1, 1, 0]),
 'label': tensor([0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0,
         1, 0, 1, 1, 0, 1, 1, 0])
}
```

