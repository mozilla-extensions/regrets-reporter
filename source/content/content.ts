import { browser } from 'webextension-polyfill-ts';
import { EventType, Message, PagePingEvent } from '../common/messages';
import { get } from 'object-path';

import * as ReactDOM from 'react-dom';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pageScript from 'bundle-text:./page.ts';
import { Modal } from './modal';
import * as React from 'react';
import { makeDislikePayload, makeFeedbackPayload } from './payloads';
import {
	experimentArm,
	ExperimentArm,
	FeedbackType,
	feedbackUiVariant,
	onboardingCompleted as onboardingCompletedValue,
} from '../common/common';
import { universalFetch } from '../common/helpers';
import { injectElements } from './button';

const loggingOn = process.env.ENABLE_CONTENT_LOGS === 'true';

export function log(...args) {
	if (loggingOn) {
		console.log('[content]', ...args);
	}
}

let ytApiKey = null;
let ytRequestHeaders = null;

const pollingInterval = 2000;

/** Injects page.ts as a script into the YT page DOM. Needed to allow direct DOM access. */
async function injectScript() {
	const scr = document.createElement('script');
	scr.textContent = `(function () {
		function define(m) {
				console.log("[page loader] page module defined");
				// run default export
				if (typeof m === 'function') {
					const module = m();
					module.default();
				}
		}
		define.amd = true;
		${pageScript}
	})();`;

	(document.head || document.documentElement).appendChild(scr);

	setInterval(async () => {
		const cohort = await experimentArm.acquire();
		const feedbackUiVariantValue = await feedbackUiVariant.acquire();
		const injectButtons = cohort !== ExperimentArm.NoInject;
		const dataCollectionEnabled = cohort !== ExperimentArm.OptOut;
		const onboardingCompleted = await onboardingCompletedValue.acquire();

		const event: PagePingEvent = {
			type: 'ping',
			injectButtons,
			onboardingCompleted,
			dataCollectionEnabled,
			feedbackUiVariant: feedbackUiVariantValue,
		};

		injectElements(event);

		/** Send pings to injected script to parse page videos and inject buttons */
		window.postMessage(event, window.location.origin);
	}, pollingInterval);
}

/** Handles messages from injected page and forwards them to background page */
const onPageMessage = (event: MessageEvent) => {
	const allowedMessageTypes = [EventType.VideoViewed, EventType.VideoBatchRecorded, EventType.NativeFeedbackSent];
	const isAllowedMessage = allowedMessageTypes.includes(event.data.type as EventType);
	const isSameOrigin = event.origin === window.location.origin;
	if (!isSameOrigin || !isAllowedMessage) {
		return;
	}
	log('got page message, data:', event.data);
	const message = event.data as Message;

	if (message.type === EventType.VideoBatchRecorded && message.data.length === 0) {
		return;
	}

	browser.runtime.sendMessage(message);
};

/** Sends dislike through YT API */
async function sendDislike(videoId: string) {
	log(`send dislike ${videoId}`);
	const url = `https://www.youtube.com/youtubei/v1/like/dislike?key=${ytApiKey}`;
	const rawResponse = await universalFetch(url, {
		method: 'POST',
		headers: ytRequestHeaders,
		body: JSON.stringify(makeDislikePayload(videoId)),
	});
	const res = await rawResponse.json();
	log(res);
}

/** Make a request to YT history page and try to find a "remove from history" action token there */
async function getRemoveFromHistoryToken(videoId) {
	log('retrieving history token');
	const initDataRegex = /(?:window\["ytInitialData"\]|ytInitialData)\W?=\W?({.*?});/;
	const result = await universalFetch('https://www.youtube.com/feed/history', {
		credentials: 'include',
		method: 'GET',
		mode: 'cors',
	});
	const body = await result.text();
	try {
		const matchedData = body.match(initDataRegex);
		if (!matchedData[1]) throw new Error('Failed to parse YT initial data');
		const initData = JSON.parse(matchedData[1]);
		const groups: unknown = get(
			initData,
			'contents.twoColumnBrowseResultsRenderer.tabs.0.tabRenderer.content.sectionListRenderer.contents',
		);
		if (!Array.isArray(groups)) {
			throw new Error('Assert failed');
		}

		let matchingVideo;
		for (const item of groups) {
			const videoRenderers = get(item, 'itemSectionRenderer.contents');
			for (const { videoRenderer } of videoRenderers) {
				if (videoRenderer?.videoId && videoId === videoRenderer.videoId) {
					matchingVideo = videoRenderer;
					break;
				}
			}
		}
		if (!matchingVideo) {
			log('video not found in watch history');
			return;
		}
		const feedbackToken = get(
			matchingVideo,
			'menu.menuRenderer.topLevelButtons.0.buttonRenderer.serviceEndpoint.feedbackEndpoint.feedbackToken',
		);

		return feedbackToken;
	} catch (e) {
		log(e);
		throw new Error('Failed to parse YT initial data');
	}
}

/** Sends a "dont recommend", "remove from history" or "not interested" video feedback through the YT API */
async function sendFeedbackRequest(videoId: string, feedbackToken: string) {
	log(`send feedback request for ${videoId}`);
	const url = `https://www.youtube.com/youtubei/v1/feedback?key=${ytApiKey}`;
	const rawResponse = await universalFetch(url, {
		method: 'POST',
		headers: ytRequestHeaders,
		body: JSON.stringify(makeFeedbackPayload(videoId, feedbackToken)),
	});
	const res = await rawResponse.json();
	log(res);
}

/** Handle message from background script */
browser.runtime.onMessage.addListener(async (message: Message) => {
	log('got runtime message:', message);
	if (message.type === EventType.AuthRecorded) {
		log(`auth ${message.keyId}`);
		ytApiKey = message.keyId;
		ytRequestHeaders = message.headers;
	}
	if (message.type === EventType.SendVideoFeedback) {
		switch (message.feedbackType) {
			case FeedbackType.Dislike:
				return sendDislike(message.videoId);
			case FeedbackType.NotInterested:
			case FeedbackType.NoRecommend:
				return sendFeedbackRequest(message.videoId, message.feedbackToken);
			case FeedbackType.RemoveFromHistory:
				const feedbackToken = await getRemoveFromHistoryToken(message.videoId);
				if (!feedbackToken) {
					log('skipping "remove from history" action, no token found');
					return;
				}
				return sendFeedbackRequest(message.videoId, feedbackToken);
		}
	}
});

function appendFeedbackModal() {
	const div = document.createElement('div');
	document.body.append(div);

	ReactDOM.render(React.createElement(Modal), div);
}

/** Initialization */
injectScript();
window.addEventListener('message', onPageMessage);
appendFeedbackModal();

// We inject styles manually because of an open bug in chrome.
// This bug preventing style imports from properly resolving in CSS files injected using manifest.json
function injectStyles(url) {
	const elem = document.createElement('link');
	elem.rel = 'stylesheet';
	elem.setAttribute('href', url);
	document.body.appendChild(elem);
}
injectStyles(browser.runtime.getURL('content/content.css'));
