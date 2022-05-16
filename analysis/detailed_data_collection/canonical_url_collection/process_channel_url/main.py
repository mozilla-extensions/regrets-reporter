import base64
import requests
import json
import time
from google.cloud import bigquery
from google.cloud import pubsub_v1
from bs4 import BeautifulSoup
from random import randint


PROJECT_ID = "regrets-reporter-dev"
CHANNEL_DATA_TOPIC = "canonical-url-data"

PROXY = {
    "http": "",
    "https": "",
}


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
            response = requests.get(url, headers=headers, proxies=PROXY, timeout=timeout,  verify=False)

            if response.status_code == 200:
                error = False
                if is_upgrade_browser_page(response.text):
                    # If the page returned OK verify that it isn't a "upgrade user-agent page"
                    error = True
            elif response.status_code != 429:
                # just let is exit if we get 429, do not retry.
                error = True
        except requests.Timeout as te:
            # back off and retry
            print(f"Video ID: {url} Request timeout error:  {te}")
            error = True
        except requests.ConnectionError as ce:
            print(f"Video ID: {url} Request connection error {ce}")
            error = True
        except Exception as e:
            print(f"Video ID: {url} {e}")
        else:
            if response.status_code == 429:
                print("Received response.status_code: 429")

        if error:
            retry += 1
            sleep_timeout = randint(sleep_timeout, max_sleep_timeout)
            print(f"Video ID: {url} Sleeping for {sleep_timeout} seconds")
            time.sleep(sleep_timeout)
            max_sleep_timeout += 5
        else:
            break
    return response, retry, error


def parse_youtube_channel_response(response):
    json_response = json.loads(response.text.split('ytInitialData =')[1].split(';</script>')[0])
    try:
        canonical_channel_url = json_response['header']['c4TabbedHeaderRenderer']['navigationEndpoint']['browseEndpoint']['canonicalBaseUrl']
    except KeyError:
        canonical_channel_url = None
    return canonical_channel_url


def check_canonical_channel_url(channel_url: str):
    channel_url_collected = f'''
    SELECT
    canonical_channel_url
    FROM
    `regrets-reporter-dev.regrets_reporter_analysis.canonical_channels`
    WHERE
    channel_url=
    '''
    bq_client = bigquery.Client()
    rows = bq_client.query(channel_url_collected + "'" + channel_url + "'")
    df = rows.to_dataframe()
    if not df.empty:
        return rows.to_dataframe()['canonical_channel_url'].tolist()[0]
    else:
        return None


def get_canonical_url_from_yt(channel_url: str):
    headers = {"Accept-Language": 'en'}
    url = f'https://www.youtube.com{channel_url}'
    response, retry_count, error_page_received = request_with_retry_timeout(url=url, headers=headers)
    canonical_channel_url = None
    if response.status_code != 200:
        print(f"Received resp code: {response.status_code}")
    else:
        if response and not error_page_received:
            canonical_channel_url = parse_youtube_channel_response(response)

    return canonical_channel_url


def publish_canonical_channel(result):
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, CHANNEL_DATA_TOPIC)
    json_result = json.dumps(result, ensure_ascii=False)
    encoded_json = json_result.encode()
    future = publisher.publish(topic_path, data=encoded_json)


def process_video_id_and_channel_url(event, context):
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    msg = json.loads(pubsub_message)
    video_id = msg['video_id']
    channel_url = msg['channel_url']

    if channel_url:
        canonical_channel_url = get_canonical_url_from_yt(channel_url)
        result = {"video_id": video_id, "channel_url": channel_url, "canonical_channel_url": canonical_channel_url}
        print(f"Processed: {result} ")
        publish_canonical_channel(result)
