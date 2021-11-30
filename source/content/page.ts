/** This file get bundled for injection. So only type imports are allowed here */
import type { Data, ProcessedVideoData } from '../common/dataTypes';
import type {
	NativeFeedbackSentEvent,
	VideoBatchRecordedEvent,
	VideoViewedEvent,
	PagePingEvent,
} from '../common/messages';

export enum VideoThumbnailType {
	SidebarRecommendation = 'SidebarRecommendation',
	HomePageRecommendation = 'HomePageRecommendation',
	Other = 'OtherRecommendation',
}

export enum FeedbackType {
	Dislike = 'dislike',
	NotInterested = 'not_interested',
	NoRecommend = 'dont_recommend',
	RemoveFromHistory = 'remove_from_history',
}

export enum EventType {
	RegretVideo = 'RegretVideo',
	AuthRecorded = 'AuthRecorded',
	SendVideoFeedback = 'SendVideoFeedback',
	VideoBatchRecorded = 'VideoBatchRecorded',
	RegretDetailsSubmitted = 'RegretDetailsSubmitted',
	VideoViewed = 'VideoViewed',
	NativeFeedbackSent = 'NativeFeedbackSent',
	VideoRegretted = 'VideoRegretted',
}

const feedbackTypeByIcon = {
	'yt-icons:not_interested': FeedbackType.NotInterested,
	'yt-icons:remove-circle-outline': FeedbackType.NoRecommend,
	'yt-icons:close': FeedbackType.RemoveFromHistory,
};

enum PageLocation {
	Home,
	Explore,
	Watch,
	History,
	Other,
}

const loggingOn = process.env.ENABLE_PAGE_LOGS === 'true';

const seenVideos = new Set();
let lastViewedVideo: string | null = null;
let pageClickListenerInjected = false;

function postMessage(message: any) {
	window.postMessage(message, window.location.origin);
}

function log(...args) {
	if (loggingOn) {
		console.log('[page]', ...args);
	}
}

/** Extracts video data from YT metadata found in DOM */
function processVideo(r: Data): ProcessedVideoData | null {
	const id = r.videoId;
	if (seenVideos.has(id)) {
		return null;
	} else {
		seenVideos.add(id);
	}

	const title = r.title.simpleText || (r.title as any).runs[0].text;
	const length = r.lengthText?.simpleText;
	const views = r.shortViewCountText.simpleText;
	const channelDetails = r.longBylineText.runs[0];
	const seenAt = new Date();
	const channel = {
		title: channelDetails.text,
		url: channelDetails.navigationEndpoint.browseEndpoint.canonicalBaseUrl,
	};

	const notInterestedAction = r.menu.menuRenderer.items.find(
		(m) => m?.menuServiceItemRenderer.icon.iconType === 'NOT_INTERESTED',
	);

	const dontRecommendAction = r.menu.menuRenderer.items.find(
		(m) => m?.menuServiceItemRenderer.icon.iconType === 'REMOVE',
	);

	const tokens = {
		notInterested: notInterestedAction?.menuServiceItemRenderer.serviceEndpoint.feedbackEndpoint.feedbackToken,
		dontRecommend: dontRecommendAction?.menuServiceItemRenderer.serviceEndpoint.feedbackEndpoint.feedbackToken,
	};
	return { id, title, length, views, channel, tokens, seenAt };
}

function parseVideosOnPage() {
	const mainVideo = parseMainVideoData();
	if (mainVideo) {
		postMessage({ type: EventType.VideoViewed, data: mainVideo } as VideoViewedEvent);
	}

	{
		const domNodes = Array.from(document.getElementsByTagName('ytd-rich-item-renderer'));
		const data = domNodes
			.map((d) => (d as any).__data.data.content.videoRenderer as Data)
			.filter((d) => !!d)
			.map(processVideo)
			.filter((v) => v !== null);
		log('scrapping new "explore" videoIndex', data);
		if (data.length > 0) {
			postMessage({
				type: EventType.VideoBatchRecorded,
				batchType: VideoThumbnailType.HomePageRecommendation,
				data,
			} as VideoBatchRecordedEvent);
		}
	}

	{
		const domNodes = Array.from(document.getElementsByTagName('ytd-compact-video-renderer'));
		const data = domNodes
			.map((d) => (d as any).__data.data as Data)
			.filter((d) => !!d)
			.map(processVideo)
			.filter((v) => v !== null);
		log('scrapping new related videoIndex', data);
		if (data.length > 0) {
			postMessage({
				type: EventType.VideoBatchRecorded,
				batchType: VideoThumbnailType.SidebarRecommendation,
				data,
			} as VideoBatchRecordedEvent);
		}
	}

	{
		const domNodes = Array.from(document.getElementsByTagName('ytd-video-renderer'));
		const data = domNodes
			.map((d) => (d as any).__data.data as Data)
			.filter((d) => !!d)
			.map(processVideo)
			.filter((v) => v !== null);
		log('scrapping misc videoIndex', data);
		if (data.length > 0) {
			postMessage({
				type: EventType.VideoBatchRecorded,
				batchType: VideoThumbnailType.Other,
				data,
			} as VideoBatchRecordedEvent);
		}
	}
}

/** Listen for messages from content script */
function listenForMessages() {
	window.addEventListener('message', (e: MessageEvent<PagePingEvent>) => {
		const isSameOrigin = e.origin === window.location.origin;
		const isPollEvent = e.data.type === 'ping';
		if (!isSameOrigin || !isPollEvent) {
			return;
		}
		onPollEvent(e.data);
	});
}

function parseMainVideoData(): ProcessedVideoData | void {
	const node = document.getElementsByTagName('ytd-watch-flexy')[0] as any;
	if (!node) {
		return;
	}
	const r = node.__data;

	const id = r.videoId;
	log('scrapping currently viewed video', id);
	if (r.hidden === true || !r.videoId) {
		log('no active video being viewed');
		return;
	}
	if (lastViewedVideo === r.videoId) {
		log("video didn't change");
		return null;
	} else {
		lastViewedVideo = r.videoId;
	}

	const videoDetails = r.playerData.videoDetails;
	const { shortDescription: description, lengthSeconds: length, viewCount: views, title, author } = videoDetails as any;
	const seenAt = new Date();
	const channel = {
		title: author,
		url: '?',
	};

	const tokens = {
		notInterested: undefined,
		dontRecommend: undefined,
	};
	return { id, title, length, views, channel, tokens, seenAt, description };
}

/** Check if click event is on an untoggled "Dislike" button item */
function isDislikeButtonClick(eventPath: EventTarget[]): boolean {
	const data = eventPath.find(
		(v: any) => v.tagName === 'YTD-TOGGLE-BUTTON-RENDERER' && v.__data.buttonIcon === 'yt-icons:dislike',
	) as any;
	const isToggled = !!data?.__data?.data?.isToggled;
	return isToggled;
}

/** Check if click event is a YT "not-interested", "don't recommend", "remove from history" */
function getFeedbackActionType(eventPath: EventTarget[]): FeedbackType | null {
	const data = eventPath.map((v: any) => v?.__data).find((v: any) => v?.data?.serviceEndpoint) as any;
	if (!data) {
		return;
	}
	const icon = data.icon || data.buttonIcon;
	if (!(icon in feedbackTypeByIcon)) {
		return;
	}
	const feedbackType = feedbackTypeByIcon[data.icon || data.buttonIcon];
	return feedbackType;
}

/** Check if event is a click on a YT context menu opener. Can have false-positives. */
function isContextMenuClick(eventPath: EventTarget[]) {
	const element = eventPath[0] as any;
	return element?.__data?.icon === 'yt-icons:more_vert';
}

function getContextMenuClickVideo(eventPath: EventTarget[]): string | undefined {
	const gridElement = eventPath.find(
		(e: any) => e.tagName === 'YTD-COMPACT-VIDEO-RENDERER' || e.tagName === 'YTD-RICH-GRID-MEDIA',
	) as any;
	if (!gridElement) {
		log('context menu without parent grid element, skipping');
	}
	const videoId = gridElement?.__data?.data?.videoId;
	return videoId;
}

function getButtonClickVideo(eventPath: EventTarget[]): string | undefined {
	const gridElement = eventPath.find((e: any) => e.tagName === 'YTD-VIDEO-RENDERER') as any;
	if (!gridElement) {
		log('button click without parent grid element, skipping');
	}
	const videoId = gridElement?.__data?.data?.videoId;
	return videoId;
}

function getPageLocation(): PageLocation {
	const { pathname } = window.location;
	switch (pathname) {
		case '/':
			return PageLocation.Home;
		case '/feed/explore':
			return PageLocation.Explore;
		case '/feed/history':
			return PageLocation.History;
		case '/watch':
			return PageLocation.Watch;
		default:
			return PageLocation.Other;
	}
}

/** Get currently played video id */
const getMainVideoId = () => document.getElementsByTagName('ytd-watch-flexy')[0].getAttribute('video-id');

function injectPageClickListener() {
	/** We store the relevant video id for context menu clicks to determine to which video a context action relates */
	let videoIdContext;
	const handlePageClick = function (e) {
		const location = getPageLocation();
		const eventPath = e.composedPath();
		const contextMenuClick = isContextMenuClick(eventPath);
		const dislikeMenuClick = isDislikeButtonClick(eventPath);
		log('dislikeMenuClick=', dislikeMenuClick);
		if (dislikeMenuClick) {
			const videoId = getMainVideoId();
			postMessage({
				type: EventType.NativeFeedbackSent,
				videoId,
				feedbackType: FeedbackType.Dislike,
			} as NativeFeedbackSentEvent);
			return;
		}
		log('contextMenuClick=', contextMenuClick);
		if (contextMenuClick) {
			videoIdContext = getContextMenuClickVideo(eventPath);
			log(videoIdContext);
			return;
		}
		const feedbackType = getFeedbackActionType(eventPath);
		if (!feedbackType) return;

		let videoId = videoIdContext;
		if (location === PageLocation.History) {
			videoId = getButtonClickVideo(eventPath);
		}
		postMessage({ type: EventType.NativeFeedbackSent, videoId, feedbackType } as NativeFeedbackSentEvent);
	};
	document.addEventListener('click', handlePageClick, false);
}

function onPollEvent({ onboardingCompleted, dataCollectionEnabled }: PagePingEvent) {
	if (onboardingCompleted && dataCollectionEnabled && !pageClickListenerInjected) {
		injectPageClickListener();
		pageClickListenerInjected = true;
	}

	if (onboardingCompleted && dataCollectionEnabled) {
		parseVideosOnPage();
	}
}

export default function () {
	log('inject scrapping script');
	listenForMessages();
}
