import * as React from 'react';
import Checkbox from '../common/photon-components-web/photon-components/Checkbox';
import Button from '../common/photon-components-web/photon-components/Button';
import '../common/tailwind.css';
import '../common/photon-components-web/index.css';
import '../common/photon-components-web/attributes/index.css';
import './index.css';
import { installationId, useErrorReportingToggle } from '../common/common';
import { getBackgroundScript, useAsync } from '../common/helpers';
import { useCallback, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { extensionFeedbackUrl } from '../common/links';

const enableDebugPage = process.env.ENABLE_DEBUG_PAGE === 'true';
const debugPageUrl = browser.runtime.getURL('debug/index.html');

export function Main() {
	const [enableErrorReporting, setEnableErrorReporting] = useErrorReportingToggle();
	const installationIdValue = installationId.use();
	const { value: bg } = useAsync(getBackgroundScript, true);
	const toggleErrorReporting = useCallback(
		async (e) => {
			const enabled = (e.target as any).checked;
			bg.toggleErrorReporting(enabled);
			setEnableErrorReporting(enabled);
		},
		[bg],
	);
	const [dataDeletionRequested, setDataDeletionRequested] = useState(false);

	const requestDataDeletion = useCallback(async () => {
		bg.sendDataDeletionRequest();
		setDataDeletionRequested(true);
	}, [bg]);

	const onExport = useCallback(() => {
		const data = JSON.stringify(bg?.events || []);

		const url = URL.createObjectURL(
			new Blob([data], {
				type: 'application/json',
			}),
		);
		browser.tabs.create({ url });
	}, [bg]);
	const state = {} as any;
	return (
		<>
			<div className="text-xl font-semibold">Error Reporting</div>
			<div className="my-4">
				<label className="flex items-center">
					<span className="checkbox__label__text flex items-center">
						<Checkbox
							className="w-8 h-8 mr-2"
							label=""
							value="enable_error_reporting"
							checked={enableErrorReporting}
							onChange={toggleErrorReporting}
						/>
						<span className="ml-1">Allow RegretsReporter to send information about encountered errors to Mozilla</span>
					</span>
				</label>
			</div>
			<div className="text-xl font-semibold mt-12">Collected Data</div>
			<div className="my-4 flex justify-between items-center">
				<span className="">See what data RegretsReporter has collected so far</span>
				<Button
					onClick={onExport}
					className="btn btn-grey ml-4 text-center outline-none"
					target="_blank"
					rel="noreferrer"
				>
					Inspect Collected Data
				</Button>
			</div>
			<div className="my-4 flex justify-between items-center">
				{(dataDeletionRequested && (
					<span className="text-center font-semibold">
						Telemetry has been disabled and data deletion has been requested.
					</span>
				)) || (
					<>
						<span className="">
							Disable telemetry and request that all your RegretsReporter data gets deleted from Mozilla's servers
						</span>
						<Button onClick={requestDataDeletion} className="btn btn-grey ml-4">
							Send Data Deletion Request
						</Button>
					</>
				)}
			</div>
			{enableDebugPage && (
				<div className="my-4">
					<a href={debugPageUrl} rel="noreferrer noopener" target="_blank" className="text-red underline">
						View debug page.
					</a>
				</div>
			)}
			<div className="text-xl font-semibold mt-12">Feedback</div>
			<div className="my-4">
				Do you have feedback about the RegretsReporter? We would love to hear it.{' '}
				<a href={extensionFeedbackUrl} rel="noreferrer noopener" target="_blank" className="text-red underline">
					Send us feedback
				</a>
				.
			</div>
			<div className="text-xl font-semibold mt-12">Additional information</div>
			<div className="my-4">
				Extension version: <code>{process.env.EXTENSION_VERSION}</code>
			</div>
			<div className="my-4">
				Extension Installation ID: <code>{installationIdValue}</code>
			</div>
			<div className="my-4">
				Error Reporting ID: <code>{installationIdValue}</code>
			</div>
		</>
	);
}
