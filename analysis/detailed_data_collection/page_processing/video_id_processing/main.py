import base64
import json
from json import JSONDecodeError
from random import randint
import requests
import numpy as np
from bs4 import BeautifulSoup
import time
import datetime
from datetime import timezone
from google.cloud import pubsub_v1

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api import TranscriptsDisabled, NoTranscriptFound, TooManyRequests
import xml.etree.ElementTree as et

import logging
import traceback

PROJECT_ID = "regrets-reporter-dev"
VIDEO_DATA_TOPIC = "video-data"
ERROR_VIDEO_ID_TOPIC = "error-video-id"
logging.basicConfig(encoding='utf-8', level=logging.INFO, format='%(asctime)s %(levelname)s %(funcName)s(%(lineno)d) %(message)s')

PROXY_1 = "proxy_1"
PROXY_2 = "proxy_2"
proxy_1 = {
    "http": "",
    "https": "",
}
proxy_2 = {
              "http": "",
              "https": ""
}
PROXIES = {PROXY_1: proxy_1, PROXY_2: proxy_2}

video_ids_file = open("do_not_get_thumbnail.txt", "r")
DO_NOT_GET_THUMBNAIL_VIDEO_IDS = video_ids_file.read().split("\n")
video_ids_file.close()


class PageParseError(Exception):
    pass


class ThrottlingError(Exception):
    pass


def parse_youtube_metadata_response(response, video_id, dict_result):
    json_response = json.loads(response.text.split('ytInitialData =')[1].split(';</script><script nonce=')[0])
    dict_result["unavailable"] = False

    # Title
    try:
        title = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0][
            'videoPrimaryInfoRenderer']['title']['runs'][0]['text']
    except KeyError:
        title = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1][
            'videoPrimaryInfoRenderer']['title']['runs'][0]['text']

    dict_result["title"] = title

    # view count
    try:
        view_count = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0][
            'videoPrimaryInfoRenderer']['viewCount']['videoViewCountRenderer']['viewCount']['simpleText']
        dict_result["view_count"] = int(view_count.replace(',', '').replace('.', '').split()[0])
    except KeyError:
        try:
            view_count = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1][
                'videoPrimaryInfoRenderer']['viewCount']['videoViewCountRenderer']['viewCount']['simpleText']
            dict_result["view_count"] = int(view_count.replace(',', '').replace('.', '').split()[0])
        except KeyError:
            dict_result["view_count"] = None

    # Like count
    try:
        like_count = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0][
            'videoPrimaryInfoRenderer']['videoActions']['menuRenderer']['topLevelButtons'][0]['toggleButtonRenderer'][
            'defaultText']['accessibility']['accessibilityData']['label']
        dict_result["like_count"] = int(like_count.replace(',', '').replace('.', '').split()[0])
    except ValueError:
        dict_result["like_count"] = None
    except KeyError:
        try:
            like_count = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1][
                'videoPrimaryInfoRenderer']['videoActions']['menuRenderer']['topLevelButtons'][0]['toggleButtonRenderer'][
                'defaultText']['accessibility']['accessibilityData']['label']
            dict_result["like_count"] = int(like_count.replace(',', '').replace('.', '').split()[0])
        except (KeyError, ValueError):
            logging.info(f"Video ID: {video_id} Unable to parse like_count, setting to 0")
            dict_result["like_count"] = None

    # Description
    description = []
    try:
        description = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1][
            'videoSecondaryInfoRenderer']['description']['runs']
    except KeyError:
        try:
            description = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][2][
                'videoSecondaryInfoRenderer']['description']['runs']
        except KeyError:
            pass

    full_description = ''
    for iterr in description:
        text = iterr['text']
        full_description = full_description + text

    dict_result["description"] = full_description

    # Channel name and link
    try:
        channel = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1][
            'videoSecondaryInfoRenderer']['owner']['videoOwnerRenderer']['title']['runs'][0]['text']
        channel_url = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1][
            'videoSecondaryInfoRenderer']['owner']['videoOwnerRenderer']['title']['runs'][0]['navigationEndpoint'][
            'browseEndpoint']['canonicalBaseUrl']
    except KeyError:
        channel = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][2][
            'videoSecondaryInfoRenderer']['owner']['videoOwnerRenderer']['title']['runs'][0]['text']
        channel_url = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents'][2][
            'videoSecondaryInfoRenderer']['owner']['videoOwnerRenderer']['title']['runs'][0]['navigationEndpoint'][
            'browseEndpoint']['canonicalBaseUrl']

    dict_result["channel"] = channel
    dict_result["channel_url"] = channel_url

    # Tags
    tags = []
    all_contents = json_response['contents']['twoColumnWatchNextResults']['results']['results']['contents']
    for contents in all_contents:
        if 'videoPrimaryInfoRenderer' in contents:
            node = contents['videoPrimaryInfoRenderer']
            if 'superTitleLink' in node:
                tags_dict = node['superTitleLink']['runs']
                for item in tags_dict:
                    tag = item['text']
                    if tag != ' ':
                        tags.append(tag)

    dict_result["tags"] = tags

    # Language
    try:
        language = json_response['topbar']['desktopTopbarRenderer']['searchbox']['fusionSearchboxRenderer']['config'][
            'webSearchboxConfig']['requestLanguage']
    except:
        language = np.nan
    dict_result["language"] = language

    return dict_result


def check_valid_video_page(response):
    try:
        try:
            initital_json_response = json.loads(
                response.text.split('ytInitialPlayerResponse =')[1].split(';</script>')[0].strip())
        except JSONDecodeError:
            try:
                initital_json_response = json.loads(
                    response.text.split('ytInitialPlayerResponse =')[1].split(';var meta = document.createElement(\'meta\')')[0])
            except JSONDecodeError:
                initital_json_response = json.loads(response.text.split('ytInitialPlayerResponse =')[1].split(';var head = ')[0])

        try:
            main_reason = initital_json_response['playabilityStatus']['errorScreen']['playerErrorMessageRenderer']['reason']['simpleText']
        except KeyError:
            main_reason = initital_json_response['playabilityStatus']['errorScreen']['playerLegacyDesktopYpcOfferRenderer']['itemTitle']

        try:
            subreason = initital_json_response['playabilityStatus']['errorScreen']['playerErrorMessageRenderer']['subreason']['simpleText']
        except KeyError:
            try:
                runs = initital_json_response['playabilityStatus']['errorScreen']['playerErrorMessageRenderer']['subreason']['runs']
                subreason = ''
                for run in runs:
                    subreason += run['text']
            except KeyError:
                try:
                    subreason = initital_json_response['playabilityStatus']['errorScreen']['playerLegacyDesktopYpcOfferRenderer']['offerDescription']
                except KeyError as ke:
                    if main_reason:
                        subreason = None
                    else:
                        raise ke
    except KeyError as ke:
        main_reason = None
        subreason = None

    return main_reason, subreason


def is_upgrade_browser_page(html):
    soup = BeautifulSoup(html, "html.parser")
    if 'Please update your browser' in soup.text:
        return True
    return False


def request_with_retry_timeout(url, headers=None, proxy_name=None, timeout=20, max_retry=3):
    """This is the wrapper function for request post method."""
    retry = 0
    error = False
    max_sleep_timeout = 2
    sleep_timeout = 1
    response = None
    while retry < max_retry:
        try:
            logging.info(f"Video ID: {url} sending http request: {retry}")
            response = requests.get(url, headers=headers, proxies=PROXIES.get(proxy_name), timeout=timeout,  verify=False)
            if response.status_code == 200:
                error = False
                if is_upgrade_browser_page(response.text):
                    # If the page returned OK verify that it isn't a "upgrade user-agent page"
                    logging.info(f"Video ID: {url} Upgrade user-agent page")
                    error = True
            else:
                error = True
        except requests.Timeout as te:
            # back off and retry
            logging.info(f"Video ID: {url} Request timeout error:  {te}")
            error = True
        except requests.ConnectionError as ce:
            logging.info(f"Video ID: {url} Request connection error {ce}")
            error = True
        except Exception as e:
            logging.info(f"Video ID: {url} {e}")
        else:
            if response.status_code != 200:
                logging.info(f"Video ID: {url} Response Code: {response.status_code} Response reason: {response.reason}.")

        if error:
            retry += 1
            sleep_timeout = randint(sleep_timeout, max_sleep_timeout)
            logging.info(f"Video ID: {url} Request sleeping for {sleep_timeout} seconds")
            time.sleep(sleep_timeout)
            max_sleep_timeout += 5
        else:
            break
    return response, retry, error


def load_metadata_from_page(video_id, proxy_name, dict_result):
    headers = {"Accept-Language": 'en'}

    start_time = time.time()
    url = f'http://www.youtube.com/watch?v={video_id}' if proxy_name == PROXY_2 else f'https://www.youtube.com/watch?v={video_id}'

    response, retry_count, error_page_received = request_with_retry_timeout(url=url, headers=headers, proxy_name=proxy_name)

    # Did not receive a response or receive upgrade user-agent repeatedly then stop processing.
    if response is None or error_page_received:
        reason = ""
        if response is not None:
            reason = f"Response Code: {response.status_code} Response reason: {response.reason}.  "

        reason = reason + " Either connection timeout, connection error or upgrade user-agent."
        logging.error(f"Video ID: {video_id}  Unable to get response for Video ID: {video_id} after {retry_count} "
                      f"request attempts. {reason}  Skipping.  ")
        raise PageParseError
    elif response.status_code == 429:
        # We need to throttle a little so don't retry the 429, just halt processing and let the video id get picked up later for processing.
        dict_result['proxy_service'] = proxy_name
        dict_result['last_http_response_code'] = response.status_code
        # Want to track the number of attempts, not retries which is why 1 is added to the retry value
        # When using a proxy service billed by requests, the number of requests needs to be monitored, not the retries.
        dict_result['num_http_request_attempts'] = retry_count + 1
        raise ThrottlingError

    end_time = time.time()
    if response.status_code != 200:
        logging.info(f"Video ID: {video_id}  Response Code: {response.status_code} Response reason: {response.reason} Calculated content length: {len(response.content)} Request duration: {end_time - start_time}")

    reason, subreason = check_valid_video_page(response)

    if reason is not None:
        dict_result['unavailable_reason'] = reason
        dict_result['unavailable_subreason'] = subreason
        dict_result["unavailable"] = True
    else:
        dict_result["unavailable"] = False

    if not dict_result["unavailable"]:
        try:
            dict_result = parse_youtube_metadata_response(response, video_id, dict_result)
        except Exception as exc:
            logging.error(f"Video ID: {video_id} Exception occurred: {type(exc)}, {exc}")
            logging.error(f"Video ID: {video_id} {traceback.format_exc()}")

    dict_result['proxy_service'] = proxy_name
    dict_result['last_http_response_code'] = response.status_code
    # Want to track the number of attempts, not retries which is why 1 is added to the retry value
    # When using a proxy service billed by requests, the number of requests needs to be monitored, not the retries.
    dict_result['num_http_request_attempts'] = retry_count + 1


def load_youtube_transcript(video_id, dict_result):
    languages_list = ['af', 'sq', 'am', 'ar', 'hy', 'az', 'bn', 'eu', 'be', 'bs', 'bg', 'my', 'ca', 'co', 'hr', 'cs',
                      'da', 'nl', 'en', 'eo', 'et', 'fil', 'fi', 'fr', 'gl', 'ka', 'de', 'el', 'gu', 'ht', 'ha', 'haw',
                      'iw', 'hi', 'hmn', 'hu', 'is', 'ig', 'id', 'ga', 'it', 'ja', 'jv', 'kn', 'kk', 'km', 'rw', 'ko',
                      'ku', 'ky', 'lo', 'la', 'lv', 'lt', 'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mn', 'ne',
                      'no', 'ny', 'or', 'ps', 'fa', 'pl', 'pt', 'pa', 'ro', 'ru', 'sm', 'gd', 'sr', 'sn', 'sd', 'si',
                      'sk', 'sl', 'so', 'st', 'es', 'su', 'sw', 'sv', 'tg', 'ta', 'tt', 'te', 'th', 'tr', 'tk', 'uk',
                      'ur', 'ug', 'uz', 'vi', 'cy', 'fy', 'xh', 'yi', 'yo', 'zu', 'zh-Hans', 'zh-Hant']
    try:
        transcripts_list = YouTubeTranscriptApi.get_transcript(video_id, languages=languages_list)

        transcript = ''

        for l in transcripts_list:
            transcript += (f" {l['text']}")
        # TODO GLE check case where multiple transcripts available
        max_transcript_len = 35000
        if len(transcript) > max_transcript_len:
			transcript = transcript[:max_transcript_len]
        dict_result["transcript"] = transcript

    except (TranscriptsDisabled):
        # logging.error(f"Cannot get transcript for {video_id} Reason: TranscriptsDisabled")
        dict_result["transcript"] = None
    except (NoTranscriptFound):
        # logging.error(f"Cannot get transcript for {video_id} Reason: NoTranscriptFound")
        dict_result["transcript"] = None
    except (JSONDecodeError):
        logging.error(f"Cannot get transcript for {video_id} Reason: JSONDecodeError")
        dict_result["transcript"] = None
    except (et.ParseError):
        logging.error(f"Cannot get transcript for {video_id} Reason: xml.etree.ElementTree.ParseError")
        dict_result["transcript"] = None


def load_thumbnail(video_id, proxy_name, dict_result):
    if video_id not in DO_NOT_GET_THUMBNAIL_VIDEO_IDS:
        thumbnail = base64.b64encode(requests.get(f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg").content).decode('utf-8')
        dict_result["thumbnail"] = thumbnail
    # logging.info(f"Video Id: {video_id} thumbnail len: {len(thumbnail)}")


def load_data_from_youtube(video_id, proxy_name):
	dict_result = {"video_id": video_id, "submission_timestamp": str(datetime.datetime.now(timezone.utc))}
	load_metadata_from_page(video_id, proxy_name=proxy_name, dict_result=dict_result)
	load_youtube_transcript(video_id, dict_result=dict_result)
	load_thumbnail(video_id, proxy_name=proxy_name, dict_result=dict_result)
	return dict_result


def truncate_transcript(result_dict, reduction_amount):
    encoded_transcript = result_dict['transcript'].encode()

    length = len(encoded_transcript) - reduction_amount
    logging.info(f"Video Id: {result_dict['video_id']} Only keep first {length} bytes of transcript")
    try:
        another_string = encoded_transcript[:length].decode()
        logging.info(f"Video Id: {result_dict['video_id']} truncated len: {len(another_string)}")
    except UnicodeDecodeError as err:
        another_string = encoded_transcript[:err.start].decode()
        logging.info(f"Video Id: {result_dict['video_id']} truncated2 len: {len(another_string)}")
    return another_string


def prepare_data_for_publish(result):
    result['truncated_transcript'] = False
    max_msg_size = 65535
    json_string = json.dumps(result, ensure_ascii=False)
    encoded_json = json_string.encode()
    encoded_msg_len = len(encoded_json)

    if encoded_msg_len > max_msg_size:
        msg_reduction_amount = encoded_msg_len - max_msg_size
        if result['transcript']:
            new_transcript = truncate_transcript(result, msg_reduction_amount)
            print(f"new_transcript len: {len(new_transcript)} ")
            result["transcript"] = new_transcript
            result['truncated_transcript'] = True


def publish_video_data(result):
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, VIDEO_DATA_TOPIC)
    prepare_data_for_publish(result)
    json_result = json.dumps(result, ensure_ascii=False)
    encoded_json = json_result.encode()
    future = publisher.publish(topic_path, data=encoded_json)


def publish_error_video_id(video_id):
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, ERROR_VIDEO_ID_TOPIC)
    future = publisher.publish(topic_path, data=video_id.encode())


# TODO add exception handling and return 404, 500 to send NACK
def process_video_id(event, context):
    """Triggered from a message on a Cloud Pub/Sub topic.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    msg = json.loads(pubsub_message)
    video_id = msg['video_id']
    proxy_name = msg['proxy_name']

    try:
        dict_result = load_data_from_youtube(video_id, proxy_name=proxy_name)
        print_dict = {key: dict_result[key] for key in dict_result.keys() - {'thumbnail', 'description', 'transcript'}}
        logging.info(f"Video ID: {print_dict['video_id']} Full msg: {print_dict}")
        publish_video_data(dict_result)
    except PageParseError:
        publish_error_video_id(video_id)
        logging.info("Unable to process page")
