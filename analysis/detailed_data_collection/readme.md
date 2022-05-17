#YouTube Video Id Processing

Video Ids collected using the extension described [here](../../readme.md) are stored in a BigQuery table.

##Extracting Video Ids
The Google Cloud Function (GCF) extract_video_ids ([code](./page_processing/extract_video_ids)) queries the BigQuery
table and publishes the video Ids to a Google Pub/Sub topic (`video-ids`).

One instance of this GCF is triggered by a HTTP request which accepts the following JSON indicating the number of video
Ids to extract.

`{"num_rows": 150}`

The HTTP request is submitted every minute using Google Cloud Scheduler.  The current setting is 150 messages per minute.

##Processing a Video Id
The GCF video_id_processing ([code](./page_processing/video_id_processing)) is triggered by the Pub/Sub topic
`video-ids` used by the extract_video_ids GCF.  This GCF uses a proxy service to load the YouTube page for the specific
video Id, parses the page information, downloads the thumbnail and the transcript.  Due to the number of video Ids being
processed per minute along with concurrency limitations on the proxy services the maximum number of GCF instances is
set to 60.

# YouTube Channel URL Processing
##Extracting Channel URL
The GCF get_video_id_and_channel_url ([code](./canonical_url_collection/get_video_id_and_channel_url)) queries the
BigQuery table containing the parsed metadata to retrieve the channel URL.  That URL, along with the video_id, is
published to Pub/Sub topic (`process_channel_url`).
One instance of this GCF is triggered by a HTTP request which accepts the following JSON indicating the number of
channel URLs to process.

`{"num_rows": 150}`
##Processing Channel URL
The GCF process_channel_url ([code](./canonical_url_collection/process_channel_url)) is triggered by the Pub/Sub topic
`process_channel_url` used by get_video_id_and_channel_url.  This GCF uses a proxy service to load the YouTube channel
page for the channel URL and parses the page information to obtain the canonical URL.  Due to the number of channel URLs
being processed per minute along with concurrency limitations on the proxy services the maximum number of GCF instances
is set to 60.

