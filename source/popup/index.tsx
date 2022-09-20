import * as React from 'react';
import '../common/tailwind.css';
import { experimentGroupsUrl, onboardingUrl, reminderSurveyUrl, studyResultsUrl, surveyUrl } from '../common/links';
import { allSurveysCompleted, installationId, installReason, surveyReminderDate } from '../common/common';
import { localStorageKeys, useExtensionState } from '../common/storage';
import { useCallback, useState } from 'react';
import { getBackgroundScript } from '../common/helpers';

export function Main() {
	const installReasonValue = installReason.use();
	const [onboardingCompleted] = useExtensionState(localStorageKeys.onboardingCompleted, false);
	const [experimentOptedIn] = useExtensionState(localStorageKeys.experimentOptedIn, false);

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

	const onSurveyResultClick = useCallback(async () => {
		const bg = await getBackgroundScript();
		await bg.onStudyResultsClick();
		window.open(studyResultsUrl, '_blank');
	}, []);

	if (experimentOptedIn) {
		return (
			<div className="m-3 text-sm">
				Thanks for your participation!
				<br />
				We have now analysed the data and our findings are available{' '}
				<a onClick={onSurveyResultClick} className="underline text-red-70 cursor-pointer" rel="noreferrer">
					here
				</a>
				.
			</div>
		);
	} else {
		return (
			<div className="m-3 text-sm">
				<p>
					We understand that you chose not to opt in to our experiment and no data has been collected from this
					installation.
				</p>
				<p>
					We have now analysed the data that was contributed and our findings are available{' '}
					<a onClick={onSurveyResultClick} className="underline text-red-70 cursor-pointer" rel="noreferrer">
						here
					</a>
					.
				</p>
			</div>
		);
	}

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
				<br />
				<br />
				Learn more about how to use RegretsReporter{' '}
				<a href={`${onboardingUrl}#active-user`} target="_blank" rel="noreferrer" className="underline text-red-70">
					here
				</a>
				.
			</div>
		);
	}
}
