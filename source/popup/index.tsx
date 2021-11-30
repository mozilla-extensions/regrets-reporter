import * as React from 'react';
import '../common/tailwind.css';
import { experimentGroupsUrl, onboardingUrl, reminderSurveyUrl, surveyUrl } from '../common/links';
import { allSurveysCompleted, installationId, installReason, surveyReminderDate } from '../common/common';
import { localStorageKeys, useExtensionState } from '../common/storage';
import { useCallback } from 'react';
import { getBackgroundScript } from '../common/helpers';
export function Main() {
	const installReasonValue = installReason.use();
	const [onboardingCompleted] = useExtensionState(localStorageKeys.onboardingCompleted, false);

	const surveyDate = surveyReminderDate.use();
	const secondSurveyCompleted = allSurveysCompleted.use();
	const showSurveyReminder = !secondSurveyCompleted && surveyDate && +Date.now() >= surveyDate;

	const onReminderSurveyClick = useCallback(async () => {
		const installationIdValue = await installationId.acquire();
		const personalSurveyUrl = `${reminderSurveyUrl}#regretsreporter=${installationIdValue}`;
		const bg = await getBackgroundScript();
		await bg.onReminderSurveyClick();
		window.open(personalSurveyUrl, '_blank');
	}, []);

	if (showSurveyReminder) {
		return (
			<div className="m-3 text-sm">
				<div className="font-bold mb-2">Help us learn more about your experience.</div>
				Are you interested in sharing more about your YouTube experience with Mozilla? Please{' '}
				<a onClick={onReminderSurveyClick} className="underline text-red-70 cursor-pointer" rel="noreferrer">
					click here
				</a>{' '}
				to complete a survey that will help us better understand how you are using YouTube’s user control mechanisms.
				Your responses will help power further Mozilla research into YouTube recommendations.
			</div>
		);
	}
	if (!onboardingCompleted) {
		if (installReasonValue === 'install') {
			return (
				<div className="m-3 text-sm">
					<div className="font-bold mb-2">
						RegretsReporter is active, but you haven't indicated whether you'd like to participate in our research.
					</div>
					Please{' '}
					<a href={onboardingUrl} target="_blank" className="underline text-red-70" rel="noreferrer">
						click here
					</a>{' '}
					to let us know if you'd like to contribute to Mozilla's crowdsourced research into YouTube's algorithms.
				</div>
			);
		}
		return (
			<div className="m-3 text-sm">
				<div className="font-bold mb-2">A new version of RegretsReporter is active.</div>
				Please{' '}
				<a href={onboardingUrl} target="_blank" className="underline text-red-70" rel="noreferrer">
					click here
				</a>{' '}
				for information about new features and to opt-in to our crowdsourced research.
			</div>
		);
	} else {
		return (
			<div className="m-3 text-sm">
				<div className="font-bold mb-2">RegretsReporter is active.</div>
				RegretsReporter helps you take control of your YouTube recommendations and, if you've opted in, contribute to
				Mozilla’s crowdsourced research into YouTube's algorithms.
				<br />
				<br />
				Learn more about our research and frequently asked questions about RegretsReporter{' '}
				<a href={experimentGroupsUrl} target="_blank" rel="noreferrer" className="underline text-red-70">
					here
				</a>
				.
			</div>
		);
	}
}
