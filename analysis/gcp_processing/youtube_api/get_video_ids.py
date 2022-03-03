from google.cloud import bigquery
from google.cloud import pubsub_v1

report_query = f'''
SELECT
metrics.string.video_data_id AS video_id
FROM
`regrets_reporter_ucs_stable.video_data_v1`
WHERE
DATE(submission_timestamp) > "2021-12-2"
AND MOD(FARM_FINGERPRINT(metrics.string.video_data_id), 1000) = 0
    GROUP BY metrics.string.video_data_id
    limit 10
'''

TOPIC_NAME = "video-ids"
BQ_SOURCE = "bq://regrets-reporter-dev.regrets_reporter_ucs_stable.video_data_v1"
PROJECT_ID = "regrets-reporter-dev"


# Download a table
def download_table(bq_table_uri: str):
    bq_client = bigquery.Client()

    # Remove bq:// prefix if present
    prefix = "bq://"
    if bq_table_uri.startswith(prefix):
        bq_table_uri = bq_table_uri[len(prefix) :]

    table = bigquery.TableReference.from_string(bq_table_uri)
    rows = bq_client.query(report_query)
    return rows.to_dataframe()


def get_video_ids(request):
    dataframe = download_table(BQ_SOURCE)

    video_ids = dataframe['video_id'].tolist()
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_NAME)
    # TODO Need to batch publish the video_ids
    for video_id in video_ids:
        future = publisher.publish(topic_path, data=video_id.encode())
    return {"num_video_ids": len(video_ids)}, 200
