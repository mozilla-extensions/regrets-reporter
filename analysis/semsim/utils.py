import gcld3
import pandas as pd
from sklearn.model_selection import train_test_split
from analysis.semsim import unifiedmodel
from torch.utils.data import DataLoader
import pytorch_lightning as pl
import torch
from sklearn.metrics import roc_auc_score
import numpy as np
from scipy.special import expit

# Remove all pairs from data that have languages other than that specified.
def filter_lang(data, with_transcript, lang):
    detector = gcld3.NNetLanguageIdentifier(
        min_num_bytes=0, max_num_bytes=1000)
    processed_data = data.copy(deep=True)
    for part in ['regret_title', 'recommendation_title', 'regret_description', 'recommendation_description'] + (['regret_transcript', 'recommendation_transcript'] if with_transcript else []):
        processed_data = processed_data[
            (processed_data[part].str.len() < 10) |
            [detector.FindLanguage(text=x).language ==
             lang for x in processed_data[part]]
        ]
    return processed_data


def run_experiment(data, with_transcript, sample_negative, epochs, batch_size, lr, freeze_policy, cross_encoder_model_name_or_path='cross-encoder/stsb-roberta-base'):
    exp_data = data.copy(deep=True)
    if not with_transcript:
        exp_data = exp_data[exp_data.regret_transcript.isnull(
        ) | exp_data.recommendation_transcript.isnull()]
        exp_data.drop(
            ['regret_transcript', 'recommendation_transcript'], axis=1, inplace=True)

    exp_data = exp_data.dropna()

    if sample_negative:
        exp_data = pd.concat([exp_data.query("label==1"), exp_data.query(
            "label==0").sample(len(exp_data.query("label==1")))])
    rest_data, test_data = train_test_split(
        exp_data, test_size=0.25, stratify=exp_data.label)
    train_data, val_data = train_test_split(
        rest_data, test_size=0.33, stratify=rest_data.label)
    del exp_data

    train_dataset = unifiedmodel.RRUMDatasetArrow(
        train_data, with_transcript=with_transcript, cross_encoder_model_name_or_path=cross_encoder_model_name_or_path)
    val_dataset = unifiedmodel.RRUMDatasetArrow(
        val_data, with_transcript=with_transcript, cross_encoder_model_name_or_path=cross_encoder_model_name_or_path)

    train_loader = DataLoader(train_dataset.dataset, shuffle=True,
                              batch_size=batch_size, num_workers=0, pin_memory=False)
    val_loader = DataLoader(val_dataset.dataset, shuffle=False,
                            batch_size=batch_size, num_workers=0, pin_memory=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = unifiedmodel.RRUM(
        text_types=train_dataset.text_types,
        scalar_features=train_dataset.scalar_features,
        label_col=train_dataset.label_col,
        optimizer_config=(lambda x: torch.optim.Adam(x.parameters(), lr=lr)),
        cross_encoder_model_name_or_path=cross_encoder_model_name_or_path,
        device=device,
        freeze_policy=freeze_policy,
        pos_weight=None
    ).to(device)

    trainer = pl.Trainer(max_epochs=epochs, gpus=1, precision=16,
                         num_sanity_val_steps=0, log_every_n_steps=5)

    trainer.fit(model, train_loader, val_loader)

    test_dataset = unifiedmodel.RRUMDatasetArrow(
        test_data, with_transcript, label_col=None)
    test_loader = DataLoader(test_dataset.dataset, shuffle=False,
                             batch_size=50, num_workers=0, pin_memory=False)
    predictor = pl.Trainer(gpus=1)
    predictions_all_batches = predictor.predict(model, dataloaders=test_loader)
    predictions = [expit(x) for x in np.hstack(
        [l.squeeze().numpy() for l in predictions_all_batches])]
    return roc_auc_score(np.array(test_data.label), predictions)
