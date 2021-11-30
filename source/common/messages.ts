import { browser } from 'webextension-polyfill-ts';
import { ProcessedVideoData } from './dataTypes';
import { FeedbackType, FeedbackUiVariant } from './common';

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

export enum VideoThumbnailType {
	SidebarRecommendation = 'SidebarRecommendation',
	HomePageRecommendation = 'HomePageRecommendation',
	Other = 'OtherRecommendation',
}

export type SendVideoFeedbackEvent = {
	type: EventType.SendVideoFeedback;
	videoId: string;
	feedbackType: FeedbackType;
	feedbackToken?: string;
};

export type AuthRecordedEvent = {
	type: EventType.AuthRecorded;
	keyId: string;
	headers: Record<string, string>;
};

export type VideoViewedEvent = {
	type: EventType.VideoViewed;
	data: ProcessedVideoData;
};

export type VideoBatchRecordedEvent = {
	type: EventType.VideoBatchRecorded;
	batchType: VideoThumbnailType;
	data: ProcessedVideoData[];
};

export type NativeFeedbackSentEvent = {
	type: EventType.NativeFeedbackSent;
	feedbackType: FeedbackType;
	videoId: string;
};

export type RegretVideoEvent = {
	type: EventType.RegretVideo;
	videoId: string;
	triggerOnboarding?: boolean;
};

export type RegretDetailsSubmittedEvent = {
	type: EventType.RegretDetailsSubmitted;
	videoId: string;
	feedbackText: string;
};

export type Message =
	| SendVideoFeedbackEvent
	| AuthRecordedEvent
	| VideoBatchRecordedEvent
	| RegretVideoEvent
	| VideoViewedEvent
	| NativeFeedbackSentEvent
	| RegretDetailsSubmittedEvent;

export type PagePingEvent = {
	type: 'ping';
	injectButtons: boolean;
	onboardingCompleted: boolean;
	dataCollectionEnabled: boolean;
	feedbackUiVariant: FeedbackUiVariant;
};
