import * as React from 'react';
import { useCallback } from 'react';
import 'photon-colors/photon-colors.css';
import '../common/photon-components-web/attributes/index.css';
import '../common/tailwind.css';
import { YourPrivacy } from './inc/YourPrivacy';
import Checkbox from '../common/photon-components-web/photon-components/Checkbox';
import { installationId, useErrorReportingToggle } from '../common/common';
import { getBackgroundScript } from '../common/helpers';
import { experimentGroupsUrl, privacyNoticeUrl, surveyUrl } from '../common/links';
import { localStorageKeys, useExtensionState } from '../common/storage';

export function GetStartedFlow() {
	const [enableErrorReporting, setEnableErrorReporting] = useErrorReportingToggle();
	const [submitted, setSubmitted] = useExtensionState(localStorageKeys.onboardingCompleted, false);
	const [experimentOptedIn, setExperimentOptIn] = useExtensionState(localStorageKeys.experimentOptedIn, false);

	const onSurveyClick = useCallback(async () => {
		const bg = await getBackgroundScript();
		const installationIdValue = await installationId.acquire();
		const personalSurveyUrl = `${surveyUrl}#regretsreporter=${installationIdValue}`;
		await bg.onSurveyClick();
		window.open(personalSurveyUrl, '_blank');
	}, []);

	const onSubmit = useCallback(async () => {
		setSubmitted(true);
		const bg = await getBackgroundScript();
		await bg.onOnboardingCompleted(experimentOptedIn);
		await bg.toggleErrorReporting(enableErrorReporting);
		await bg.updateBadgeIcon();
	}, [experimentOptedIn, enableErrorReporting]);
	return (
		<>
			<div className="img-get-started-bg absolute" />
			<div className="img-circles absolute" />
			<div className="px-16">
				<div className="mx-auto max-w-3xl grid grid-cols-12 gap-5 font-sans text-xl">
					<div className="col-span-1" />
					<div className="col-span-10">
						<div className="flex flex-col text-center text-white">
							<div className="img-mozilla-logo m-auto mt-12.5 leading-none" />
							<div className="font-changa font-light text-2.25xl mt-4 leading-none">RegretsReporter</div>
							<div className="font-changa text-giant mt-16 leading-none">Welcome!</div>
							<div className="font-sans font-light text-left text-xl mt-5 leading-tight">
								<p>
									RegretsReporter will help you take control of your YouTube recommendations. It is also part of
									Mozilla’s crowdsourced research into YouTube’s algorithm to learn more about what people regret being
									recommended and how the algorithm responds to user feedback.
								</p>
								<br />
								<p>
									If you choose to participate in our research, you may be assigned to a “control” (or “placebo”) group
									and the <span className="font-bold">extension may not function</span>. See more information about our
									research{' '}
									<a href={experimentGroupsUrl} target="_blank" className="underline" rel="noreferrer">
										here
									</a>
									. If you do choose to participate, please leave the extension installed even if it does not appear to
									be doing anything.
								</p>
								<br />
								<p>
									Please also be aware that if you participate in our research, the extension will send Mozilla
									information about the number of videos you view, your use of features to control your recommendations,
									and information about the videos that you are recommended. To learn more about what RegretsReporter
									will collect, read our{' '}
									<a href={privacyNoticeUrl} target="_blank" className="underline" rel="noreferrer">
										Privacy Notice
									</a>
									.
								</p>
							</div>
						</div>
						{!submitted ? (
							<div className="flex flex-col items-start text-white mt-6 text-left">
								<Checkbox
									checked={experimentOptedIn}
									label="I would like to participate in Mozilla’s research into YouTube’s algorithmic controls."
									onChange={() => setExperimentOptIn(!experimentOptedIn)}
								/>
								<Checkbox
									checked={enableErrorReporting}
									label="I would like to send extension error reports to Mozilla."
									onChange={() => setEnableErrorReporting(!enableErrorReporting)}
								/>
								<div className="flex flex-row mt-6">
									<button
										onClick={onSubmit}
										className="button bg-blue-50 disabled:bg-blue-30 hover:bg-blue-70 text-white text-sm py-5 px-12 inline-block flex-grow-0"
									>
										Submit
									</button>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center text-white mt-12 text-center">
								<div className="font-changa text-huge font-light">
									{experimentOptedIn ? 'Thanks! You’re in.' : 'Thanks for letting us know.'}
								</div>
								<div className="text-2xl">
									If you have a few minutes, we’d appreciate it very much if you’d{' '}
									<a onClick={onSurveyClick} className="underline cursor-pointer">
										complete our pre-study survey
									</a>
									.
								</div>
							</div>
						)}
						<div className="flex flex-col text-center mt-22.5">
							<div className="font-changa text-huge text-white">Submitting feedback and a YouTube Regret</div>
							<div className="font-sans text-2xl mt-3.25 mb-8.75">
								If you see a video and do not want to receive recommendations similar to it just follow these 3 steps.
							</div>
						</div>
					</div>
					<div className="col-span-1" />
					<div className="col-span-4 text-center">
						<div className="img-step-1 m-auto border border-grey-95" />
						<div className="mt-11 text-center">
							<div className="m-auto rounded-full bg-red h-11 w-11 text-white font-semibold font-sans text-3xl flex items-center justify-center leading-none pt-1">
								1
							</div>
						</div>
						<div className="mt-5.25 font-serif font-light text-2xl font-light leading-tight">
							Hover your cursor over the feedback button on any recommendation or video player. Press button to submit
							feedback.
						</div>
					</div>
					<div className="col-span-4 text-center">
						<div className="img-step-2 m-auto border border-grey-95" />
						<div className="mt-11 text-center">
							<div className="m-auto rounded-full bg-red h-11 w-11 text-white font-semibold font-sans text-3xl flex items-center justify-center leading-none pt-1">
								2
							</div>
						</div>
						<div className="mt-5.25 font-serif font-light text-2xl font-light leading-tight">
							If desired, press the &quot;tell us more&quot; button to provide a comment explaining why you don&apos;t
							want to see more videos like that.
						</div>
					</div>
					<div className="col-span-4 text-center">
						<div className="img-step-3 m-auto border border-grey-95" />
						<div className="mt-11 text-center">
							<div className="m-auto rounded-full bg-red h-11 w-11 text-white font-semibold font-sans text-3xl flex items-center justify-center leading-none pt-1 pl-0.5">
								3
							</div>
						</div>
						<div className="mt-5.25 font-serif font-light text-2xl font-light leading-tight">
							Share extra details about why you regret watching that video.
						</div>
					</div>
					<div className="col-span-2" />
					<div className="col-span-8 font-light">
						<YourPrivacy />
						<section className="mt-7">
							<p>
								For more information, see our{' '}
								<a href={privacyNoticeUrl} target="_blank" className="underline" rel="noreferrer">
									full privacy notice
								</a>
								.
							</p>
						</section>

						<section className="mt-24 mb-33">
							<h2 className="text-huge font-changa font-light">Removing the Extension</h2>
							<p className="mt-4">Users are welcome to opt out at any point by removing the extension:</p>
							<ul className="triangle-bullets">
								<li>
									Right-click on the extension&apos;s toolbar icon and select{' '}
									<span className="font-semibold">
										{window.navigator.userAgent.indexOf('Firefox/') > -1 ? 'Remove Extension' : 'Remove From Chrome...'}
									</span>
									.
								</li>
							</ul>

							<p className="mt-4">
								Removing the extension will stop all ongoing data collection, only your already contributed data will be
								available to our researchers. For more information, please read our{' '}
								<a href={privacyNoticeUrl} target="_blank" className="underline" rel="noreferrer">
									full privacy notice
								</a>
								.
							</p>
						</section>
					</div>
					<div className="col-span-2" />
				</div>
			</div>
		</>
	);
}
