import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { EventType, Message, RegretDetailsSubmittedEvent } from '../common/messages';
import { abuseReportingPlatformUrl, extensionFeedbackUrl } from '../common/links';
import { setButtonToFinalState } from './button';
import { browser } from 'webextension-polyfill-ts';

export let onModalOpen: null | ((videoId: string) => void) = null;
const subscribeToModalOpenEvent = (fn: (videoId: string) => void) => {
	onModalOpen = fn;
};

function useModalState() {
	const [isSubmitted, updateSubmitted] = useState(false);
	const [videoId, updateVideoId] = useState<string | null>(null);
	const [feedbackText, setFeedbackText] = useState<string>('');
	const submit = useCallback(() => {
		const message: RegretDetailsSubmittedEvent = { type: EventType.RegretDetailsSubmitted, videoId, feedbackText };
		browser.runtime.sendMessage(message);
		setButtonToFinalState(videoId);
		updateSubmitted(true);
		setFeedbackText('');
	}, [videoId, feedbackText]);
	return {
		isSubmitted,
		updateSubmitted,
		videoId,
		updateVideoId,
		feedbackText,
		setFeedbackText,
		submit,
	};
}

export function Modal() {
	const [isVisible, updateVisible] = useState(false);
	const { isSubmitted, updateSubmitted, videoId, updateVideoId, feedbackText, setFeedbackText, submit } =
		useModalState();

	const feedbackTextEmpty = feedbackText.length === 0;

	const close = useCallback(() => {
		updateVisible(false);
		updateSubmitted(false);
	}, [videoId]);

	useEffect(() => {
		async function handler(videoId: string) {
			updateVisible(true);
			updateVideoId(videoId);
		}
		subscribeToModalOpenEvent(handler);
	}, []);

	if (!isVisible) {
		return <div />;
	}
	return (
		<div>
			<div className="overlay" />
			<div className="injected-modal">
				<div className="header">
					<div id="icon" />
					<span>Mozilla RegretsReporter</span>
					<div id="close" onClick={close} />
				</div>
				{isSubmitted ? (
					<>
						<div className="panel">
							<div className="label">Thank you for your submission.</div>
							<div className="message">
								If you believe that the content you identified in this submission constitutes abuse under YouTube's
								policies, please report it directly to YouTube via its{' '}
								<a href={abuseReportingPlatformUrl} target="_blank" rel="noreferrer">
									abuse-reporting platform
								</a>
								.
							</div>
						</div>
						<div className="footer">
							Do you have feedback about the RegretsReporter? We would love to hear it.{' '}
							<a href={extensionFeedbackUrl} target="_blank" rel="noreferrer">
								Send us feedback
							</a>
							.
						</div>
					</>
				) : (
					<div className="panel">
						<div className="label">
							Please tell us more about your experience. Why do you want YouTube to stop recommending this content to
							you?
						</div>
						<textarea
							placeholder="Please enter your message."
							value={feedbackText}
							onChange={(e) => {
								setFeedbackText(e.target.value);
							}}
						/>
						<button onClick={submit} disabled={feedbackTextEmpty}>
							Submit feedback
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
