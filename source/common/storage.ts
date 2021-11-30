import { browser } from 'webextension-polyfill-ts';
import * as React from 'react';
import { useAsync } from './helpers';

/** gets or inserts-and-gets a persistent value for a given key */
export async function acquireInstallationKey(key: string, valueGenerator: () => string): Promise<string> {
	const data = await browser.storage.local.get(key);
	const value = data ? data[key] : undefined;
	if (value) {
		return value;
	}
	const genValue = valueGenerator();
	await browser.storage.local.set({ [key]: genValue });
	return genValue;
}

export function useExtensionState<A>(key: string, defaultValue: A): [A, (val?: A) => void] {
	const [value, setValue] = React.useState<A | null>(null);
	const updateState = React.useCallback(
		(val = defaultValue) => {
			const strVal = JSON.stringify(val);
			browser.storage.local.set({ [key]: strVal }).then(() => {
				setValue(val);
			});
		},
		[setValue, defaultValue],
	);
	browser.storage.local.get(key).then((data) => {
		if (key in data) {
			setValue(JSON.parse(data[key]));
		} else {
			updateState(defaultValue);
		}
	});
	return [value, updateState];
}

export const localStorageKeys = {
	onboardingCompleted: 'onboarding_completed',
	experimentOptedIn: 'experiment_opted_in',
	installationId: 'installation_id',
	experimentArm: 'experiment_arm',
	feedbackUiVariant: 'feedback_ui_variant',
	errorReportingEnabled: 'error_reporting_enabled',
	installedAsUpdate: 'installed_as_update',
	surveyReminderDate: 'survey_reminder_date',
	allSurveysCompleted: 'all_surveys_completed',
	videosPlayedSet: 'videos_played_set',
	onboardingReminderCount: 'onboarding_reminder_count',
};

/** Class representing values stored in extension local storage */
export class StorageValue<Value> {
	constructor(private key: string, private valueGenerator: () => Value) {}

	/** Returns existing value or autogenerates a new one if missing. */
	acquire = async (value?: Value): Promise<Value> => {
		const val = await acquireInstallationKey(this.key, () => JSON.stringify(value ? value : this.valueGenerator()));
		return JSON.parse(val) as Value;
	};
	set = async (value: Value): Promise<Value> => {
		await browser.storage.local.set({ [this.key]: JSON.stringify(value) });
		return value;
	};

	async reset() {
		return this.set(this.valueGenerator());
	}

	/** React hook for usage inside components */
	use(): Value | null {
		const { value, execute } = useAsync(this.acquire, true);
		return value;
	}
}
