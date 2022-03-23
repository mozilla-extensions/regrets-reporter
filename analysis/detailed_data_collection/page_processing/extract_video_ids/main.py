from google.cloud import bigquery
from google.cloud import pubsub_v1

report_query = f'''
SELECT
video_id
FROM
`regrets-reporter-dev.regrets_reporter_analysis.priority_vids_small`
WHERE
video_id not in (select video_id from `regrets-reporter-dev.regrets_reporter_analysis.yt_api_data_v8_filled`)
GROUP BY video_id
limit
'''
# AND MOD(FARM_FINGERPRINT(metrics.string.video_data_id), 1000) = 0

topic_name = "video-ids"


# Download a table
def download_table(bq_table_uri: str, num_rows: str):
    bq_client = bigquery.Client()

    # Remove bq:// prefix if present
    prefix = "bq://"
    if bq_table_uri.startswith(prefix):
        bq_table_uri = bq_table_uri[len(prefix) :]

    table = bigquery.TableReference.from_string(bq_table_uri)
    rows = bq_client.query(report_query + str(num_rows))
    return rows.to_dataframe()


def get_video_ids(request):
    request_json = request.get_json()
    print(f"Received json: {request_json}")
    if request_json and 'num_rows' in request_json:
        num_rows = request_json['num_rows']

    print(f"retrieving {num_rows} video_ids")
    BQ_SOURCE = "bq://regrets-reporter-dev.regrets_reporter_ucs_stable.video_data_v1"
    project_id = "regrets-reporter-dev"

    dataframe = download_table(BQ_SOURCE, num_rows)

    video_ids = dataframe['video_id'].tolist()
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_name)
    # TODO Need to batch publish the video_ids
    for video_id in video_ids:
        future = publisher.publish(topic_path, data=video_id.encode())
    return {"num_video_ids": len(video_ids), "video_ids": video_ids}, 200
