import base64
import json
import base64
import requests

from apiclient.discovery import build
from google.cloud import pubsub_v1

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from youtube_transcript_api import TranscriptsDisabled, NoTranscriptFound, TooManyRequests

PROJECT_ID = "regrets-reporter-dev"
VIDEO_DATA_TOPIC = "video-data"
PROCESSED_VIDEO_ID_TOPIC = "processed-video-id"
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"
API_KEY = None


def parse_youtube_metadata_response(response, dict_result):
    dict_result["takedown"] = True

    if len(response['items']) != 0:
        dict_result["takedown"] = False
        if "tags" in response['items'][0]['snippet']:
            dict_result["tags"] = response["items"][0]["snippet"]["tags"]
        if "regionRestriction" in response['items'][0]['contentDetails'] and "blocked" in response['items'][0]['contentDetails']['regionRestriction']:
            dict_result["blocked"] = response['items'][0]['contentDetails']['regionRestriction']['blocked']
        if 'defaultAudioLanguage' in response["items"][0]["snippet"]:
            dict_result["language"] = response["items"][0]["snippet"]['defaultAudioLanguage']
        if 'defaultLanguage' in response["items"][0]["snippet"]:
            dict_result["language"] = response["items"][0]["snippet"]['defaultLanguage']
        if 'channelTitle' in response["items"][0]["snippet"]:
            dict_result["channel"] = response["items"][0]["snippet"]['channelTitle']
        if 'description' in response["items"][0]["snippet"]:
            dict_result["description"] = response["items"][0]["snippet"]['description']
        if 'title' in response["items"][0]["snippet"]:
            dict_result["title"] = response["items"][0]["snippet"]['title']
        if 'statistics' in response['items'][0]:
            if 'likeCount' in response['items'][0]['statistics']:
                dict_result["like_count"] = response['items'][0]['statistics']['likeCount']
            if 'commentCount' in response['items'][0]['statistics']:
                dict_result["comment_count"] = response['items'][0]['statistics']['commentCount']


def load_metadata_from_youtube_api(video_id, dict_result):

    # Establish connection to YouTube API
    # TODO do not want to create this for every message
    youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=API_KEY)

    yt_request = youtube.videos().list(part="snippet,statistics,contentDetails", id=video_id)
    yt_response = yt_request.execute()
    dict_result = parse_youtube_metadata_response(yt_response, dict_result)


def load_youtube_transcript(video_id, dict_result):
    formatter = TextFormatter()
    try:
        transcript = formatter.format_transcript(YouTubeTranscriptApi.get_transcript(video_id))
        print(f"Retrieved transcript: {transcript}")
        dict_result["transcript"] = transcript
    except TranscriptsDisabled:
        print(f"Cannot get transcript for {video_id} Reason: TranscriptsDisabled")
        dict_result["transcript"] = None
    except NoTranscriptFound:
        print(f"Cannot get transcript for {video_id} Reason: NoTranscriptFound")
        dict_result["transcript"] = None
    except JSONDecodeError:
        print(f"Cannot get transcript for {video_id} Reason: JSONDecodeError")
        dict_result["transcript"] = None


def load_thumbnail(video_id, dict_result):
    thumbnail = base64.b64encode(requests.get(f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg").content).decode('utf-8')
    dict_result["thumbnail"] = thumbnail


def load_data_from_youtube(video_id):
    dict_result = {"video_id": video_id}
	load_metadata_from_youtube_api(video_id, dict_result)
	load_youtube_transcript(video_id, dict_result)
	load_thumbnail(video_id, dict_result)
	return dict_result


def publish_video_data(result):
	publisher = pubsub_v1.PublisherClient()
	topic_path = publisher.topic_path(PROJECT_ID, VIDEO_DATA_TOPIC)
	json_result = json.dumps(result)
	future = publisher.publish(topic_path, data=json_result.encode())


def publish_processed_video_id(video_id):
	publisher = pubsub_v1.PublisherClient()
	topic_path = publisher.topic_path(PROJECT_ID, PROCESSED_VIDEO_ID_TOPIC)
	json_result = json.dumps({"video_id": video_id})
	future = publisher.publish(topic_path, data=json_result.encode())


# TODO add exception handling and return 404, 500 to send NACK
def process_video_id(event, context):
	"""Triggered from a message on a Cloud Pub/Sub topic.
    Args:
      event (dict): Event payload.
      context (google.cloud.functions.Context): Metadata for the event.
    """
	video_id = base64.b64decode(event['data']).decode('utf-8')
	dict_result = load_data_from_youtube(video_id)
	publish_video_data(dict_result)
	publish_processed_video_id(video_id)
