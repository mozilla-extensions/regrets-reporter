import pandas as pd
from sklearn.model_selection import train_test_split
from analysis.semsim import unifiedmodel
from torch.utils.data import DataLoader
import pytorch_lightning as pl
import torch
from sklearn.metrics import roc_auc_score
import numpy as np
from scipy.special import expit


def run_training(data, label_map, balance_label_counts, with_transcript, epochs, batch_size, lr, freeze_policy, cross_encoder_model_name_or_path):
    exp_data = data.copy(deep=True)
    if not with_transcript:
        exp_data = exp_data[exp_data.regret_transcript.isnull(
        ) | exp_data.recommendation_transcript.isnull()]
        exp_data.drop(
            ['regret_transcript', 'recommendation_transcript'], axis=1, inplace=True)

    exp_data = exp_data.dropna()

    train_data, test_data = train_test_split(
        exp_data, test_size=0.25, stratify=exp_data.label)
    del exp_data

    train_dataset = unifiedmodel.RRUMDatasetArrow(
        train_data, label_map=label_map, balance_label_counts=balance_label_counts, with_transcript=with_transcript, do_train_test_split=True, cross_encoder_model_name_or_path=cross_encoder_model_name_or_path, processing_num_proc=1)

    train_loader = DataLoader(train_dataset.train_dataset, shuffle=True,
                              batch_size=batch_size, num_workers=0, pin_memory=False)
    val_loader = DataLoader(train_dataset.test_dataset, shuffle=False,
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

    checkpoint_callback = pl.callbacks.ModelCheckpoint(
        save_top_k=1,
        monitor="validation_auc_ep",
        mode="max",
        filename='{epoch}-{validation_auc_ep:.3f}'
    )

    lr_monitor = pl.callbacks.LearningRateMonitor()

    trainer = pl.Trainer(max_epochs=epochs, devices="auto", accelerator="auto", precision=16,
                         num_sanity_val_steps=0, log_every_n_steps=5, callbacks=[checkpoint_callback, lr_monitor])

    trainer.fit(model, train_loader, val_loader)

    test_dataset = unifiedmodel.RRUMDatasetArrow(
        test_data, with_transcript=with_transcript, label_col=None, cross_encoder_model_name_or_path=cross_encoder_model_name_or_path, processing_num_proc=1)
    test_loader = DataLoader(test_dataset.test_dataset, shuffle=False,
                             batch_size=128, num_workers=0, pin_memory=False)
    predictor = pl.Trainer(devices="auto", accelerator="auto", precision=16)
    predictions_all_batches = predictor.predict(model, dataloaders=test_loader)
    predictions = [expit(x) for x in np.hstack(
        [l.squeeze().numpy() for l in predictions_all_batches])]
    return roc_auc_score(np.array(test_data.label), predictions)
