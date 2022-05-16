from google.cloud import bigquery
from google.cloud import pubsub_v1
import json


def get_unprocessed_video_ids(num_rows: str):
	unprocessed_video_ids = f'''
	SELECT
	video_id,
	channel_url
	FROM
	`regrets-reporter-dev.regrets_reporter_analysis.yt_api_data_v9_filled_deduped`
	WHERE
	video_id not in (select video_id from `regrets-reporter-dev.regrets_reporter_analysis.canonical_channels`)
	and video_id in (select video_id from `regrets-reporter-dev.regrets_reporter_analysis.yt_api_data_v9_filled_deduped`)
	and channel_url is not null
	limit
	'''
	bq_client = bigquery.Client()
	rows = bq_client.query(unprocessed_video_ids + str(num_rows))
	return list(rows.to_dataframe().to_records(index=False))


def get_video_id_and_channel_url(request):
	request_json = request.get_json()
	print(f"Received json: {request_json}")
	if request_json and 'num_rows' in request_json:
		publisher = pubsub_v1.PublisherClient()
		project_id = "regrets-reporter-dev"

		topic_name_proxy_1 = "video-ids"
		topic_path_proxy_1 = publisher.topic_path(project_id, topic_name_proxy_1)
		topic_name_prpxy_2 = "video-ids-proxy-2"
		topic_path_proxy_2 = publisher.topic_path(project_id, topic_name_prpxy_2)
		proxy_topics = [topic_path_proxy_1, topic_path_proxy_2]

		num_rows = request_json['num_rows']
		print(f"retrieving {num_rows} video_ids and channel_urls")

		video_ids_channel = get_unprocessed_video_ids(num_rows=num_rows)
		for index, (video_id, channel_url) in enumerate(video_ids_channel):
			msg = {'video_id': video_id, 'channel_url': channel_url}
			json_text = json.dumps(msg, ensure_ascii=False)
			future = publisher.publish(proxy_topics[index % 2], data=json_text.encode())

		return {"num video_ids_channel": len(video_ids_channel)}, 200
