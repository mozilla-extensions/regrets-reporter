import torch
import pytorch_lightning as pl
from torch.utils.data import DataLoader
from google.cloud import bigquery
from google.api_core.exceptions import NotFound
from analysis.semsim import unifiedmodel


class RRUMPredictionBQWriter(pl.callbacks.BasePredictionWriter):
    def __init__(self, bq_client, bq_predictions_table, write_interval, model_timestamp, print_row_writes=False):
        super().__init__(write_interval)
        self.bq_client = bq_client
        self.bq_predictions_table = bq_predictions_table
        self.model_timestamp = str(model_timestamp).split('.')[0]
        self.print_row_writes = print_row_writes
        self.total_rows_written = 0
        self._prepare_bq_table()

    def _prepare_bq_table(self):
        # Schema for model prediction results
        SCHEMA = [
            bigquery.SchemaField(
                'regret_id', 'STRING', mode='REQUIRED',
                description='Regret Video ID'),
            bigquery.SchemaField(
                'recommendation_id', 'STRING', mode='REQUIRED',
                description='Recommendation Video ID'),
            bigquery.SchemaField(
                'prediction', 'FLOAT64', mode='REQUIRED',
                description='Predicted probability of similarity'),
            bigquery.SchemaField(
                'model_timestamp', 'TIMESTAMP', mode='REQUIRED',
                description='When model was loaded'),
        ]
        table = bigquery.Table(self.bq_predictions_table, schema=SCHEMA)
        try:
            self.bq_client.get_table(table)
            print(
                f'BQ table {self.bq_predictions_table} exists, no need to create')
        except (NotFound):
            table = self.bq_client.create_table(table)
            print(f'Creating BQ table {self.bq_predictions_table}')

    def write_on_batch_end(
            self, trainer, pl_module, prediction, batch_indices, batch, batch_idx, dataloader_idx):
        prediction = torch.special.expit(prediction).squeeze().tolist()
        prediction_dict = {
            'regret_id': batch['regret_id'],
            'recommendation_id': batch['recommendation_id'],
            'prediction': prediction,
            'model_timestamp': [self.model_timestamp] * len(prediction),
        }
        rows_to_insert = [dict(zip(prediction_dict, t))
                          for t in zip(*prediction_dict.values())]
        errors = self.bq_client.insert_rows_json(
            self.bq_predictions_table, rows_to_insert)
        if errors == []:
            self.total_rows_written += len(prediction)
            if self.print_row_writes:
                print(
                    f'{len(prediction)} rows have been added to BQ Table {self.bq_predictions_table}')
        else:
            print('Encountered errors while inserting rows to BQ: {}'.format(errors))

    def write_on_epoch_end(
            self, trainer, pl_module, predictions, batch_indices):
        pass


class RRUMPredictionStreamingProgressBar(pl.callbacks.TQDMProgressBar):
    # hack to make tqdm show number of predicted batches when we don't know the amount of total batches
    def on_predict_batch_end(self, *_) -> None:
        self.predict_progress_bar.update(1)


def run_prediction(data, label_map, write_preds_to_bq, return_preds, batch_size, trained_model_checkpoint_path, bq_client=None, bq_predictions_table=None, bq_model_timestamp=None):
    pl_callbacks = []
    if write_preds_to_bq:
        if not bq_client or not bq_predictions_table or not bq_model_timestamp:
            raise ValueError(
                f'bq_client, bq_predictions_table and bq_model_timestamp cannot be None as they are needed for writing preds to BigQuery.')
        prediction_writer = RRUMPredictionBQWriter(bq_client=bq_client, bq_predictions_table=bq_predictions_table,
                                                   write_interval='batch', model_timestamp=bq_model_timestamp, print_row_writes=False)
        pl_callbacks.append(prediction_writer)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = unifiedmodel.RRUM.load_from_checkpoint(
        trained_model_checkpoint_path, device=device, optimizer_config=None)

    pred_dataset = unifiedmodel.RRUMDatasetArrow(data, label_map=label_map, with_transcript='transcript' in model.text_types, keep_video_ids_for_predictions=True,
                                                 cross_encoder_model_name_or_path=model.cross_encoder_model_name_or_path, label_col=None, processing_batch_size=batch_size, clean_text=False)
    if pred_dataset.streaming_dataset:
        pl_callbacks.append(RRUMPredictionStreamingProgressBar())

    pred_loader = DataLoader(pred_dataset.test_dataset, shuffle=False,
                             batch_size=batch_size, num_workers=0, pin_memory=False)

    predictor = pl.Trainer(devices="auto", accelerator="auto",
                           precision=16, callbacks=pl_callbacks)
    predictions_all_batches = predictor.predict(
        model, dataloaders=pred_loader, return_predictions=return_preds)
    if write_preds_to_bq:
        print(
            f'Wrote in total {prediction_writer.total_rows_written} prediction rows to BigQuery')
    print('Predictions done')
    return predictions_all_batches
