import { browser, Runtime } from 'webextension-polyfill-ts';
import { v4 as uuid } from 'uuid';
import { EventType, SendVideoFeedbackEvent } from './messages';
import { localStorageKeys, StorageValue } from './storage';
import { useEffect, useState } from 'react';
import OnInstalledReason = Runtime.OnInstalledReason;
import { useAsync } from './helpers';

/** Youtube feedback type sent */
export enum FeedbackType {
	Dislike = 'dislike',
	NotInterested = 'not_interested',
	NoRecommend = 'dont_recommend',
	RemoveFromHistory = 'remove_from_history',
}

export enum FeedbackUiVariant {
	/** Feedback UX variant with an intermediate "Tell us more" step */
	TellUsMore = 'tell_use_more_variant',
	/** Feedback UX variant showing a modal immediately on regret click */
	ForcedModal = 'forced_modal_variant',
}

/** User experiment arm */
export enum ExperimentArm {
	DislikeAction = 'dislike',
	NotInterestedAction = 'not_interested',
	NoRecommendAction = 'dont_recommend',
	RemoveFromHistory = 'remove_from_history',
	/** Control-with-UX (shows the button but it doesn’t do anything) */
	NoAction = 'control_with_ux',
	/** UX-control (doesn’t show the button, data collection enabled) */
	NoInject = 'ux_control',
	/** Opt-out (shows the button, sending dislikes on click, disables data collection).
	 * Important: value must always come last in this enum! */
	OptOut = 'opt_out',
}

function getRandomInt(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function dispatchEventToTab(tabId: number, message: SendVideoFeedbackEvent) {
	await browser.tabs.sendMessage(tabId, message);
}

export async function dispatchSendFeedbackEvent({
	videoId,
	feedbackTokenNotInterested,
	feedbackTokenNoRecommend,
	tabId,
}: {
	tabId: number;
	videoId: string;
	feedbackTokenNotInterested?: string;
	feedbackTokenNoRecommend?: string;
}) {
	let feedbackType: FeedbackType = FeedbackType.Dislike;
	let feedbackToken;
	if (feedbackTokenNoRecommend) {
		feedbackType = FeedbackType.NoRecommend;
		feedbackToken = feedbackTokenNoRecommend;
	} else if (feedbackTokenNotInterested) {
		feedbackType = FeedbackType.NotInterested;
		feedbackToken = feedbackTokenNotInterested;
	}
	await dispatchEventToTab(tabId, {
		videoId,
		feedbackToken,
		feedbackType,
		type: EventType.SendVideoFeedback,
	} as SendVideoFeedbackEvent);
	alert('Feedback sent to YT tab');
}

export const installationId = new StorageValue<string>(localStorageKeys.installationId, uuid);

/** Assigns users to the opt-out experiment arm by default, return existing arm if set */
export const experimentArm = new StorageValue<ExperimentArm>(localStorageKeys.experimentArm, () => {
	const arms = Object.values(ExperimentArm);
	// Get random experiment arm, omitting the last arm (the opt-out arm)
	const armIndex = getRandomInt(0, arms.length - 2);
	const armCode = arms[armIndex];
	return armCode as ExperimentArm;
});

/** Assigns users to a random feedback UI variant cohort, return existing cohort if set */
export const feedbackUiVariant = new StorageValue<FeedbackUiVariant>(localStorageKeys.feedbackUiVariant, () => {
	const variants = Object.values(FeedbackUiVariant);
	const variantIndex = getRandomInt(0, variants.length - 1);
	const variantCode = variants[variantIndex];
	return variantCode as FeedbackUiVariant;
});

/** Last extension installation trigger: install, update or browser_update */
export const installReason = new StorageValue<OnInstalledReason>(localStorageKeys.installedAsUpdate, () => 'install');

export const surveyReminderDate = new StorageValue<number | null>(localStorageKeys.surveyReminderDate, () => null);

export const allSurveysCompleted = new StorageValue<boolean>(localStorageKeys.allSurveysCompleted, () => false);

export const onboardingCompleted = new StorageValue<boolean>(localStorageKeys.onboardingCompleted, () => false);

export const errorReportingEnabled = new StorageValue<boolean>(localStorageKeys.errorReportingEnabled, () => false);

/** Number of times to show the onboarding reminder popup for users who didn't complete onboarding */
export const onboardingReminderCount = new StorageValue<number>(localStorageKeys.onboardingReminderCount, () => 2);

/** Set of all unique video ids played */
export const videosPlayedSet = new StorageValue<Record<string, true>>(localStorageKeys.videosPlayedSet, () => ({}));

export function useErrorReportingToggle(): [boolean, (v: boolean) => void] {
	const enabled = errorReportingEnabled.use();
	const [toggleOn, setToggleOn] = useState(false);
	useEffect(() => setToggleOn(!!enabled), [enabled]);
	return [toggleOn, setToggleOn];
}
