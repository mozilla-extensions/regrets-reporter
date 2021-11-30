import { useCallback, useEffect, useState } from 'react';
import { BackgroundScript } from '../background/background';
import { browser } from 'webextension-polyfill-ts';

export const useAsync = <T, E = string>(asyncFunction: () => Promise<T>, immediate = true) => {
	const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [value, setValue] = useState<T | null>(null);
	const [error, setError] = useState<E | null>(null);

	// The execute function wraps asyncFunction and
	// handles setting state for pending, value, and error.
	// useCallback ensures the below useEffect is not called
	// on every render, but only if asyncFunction changes.
	const execute = useCallback(() => {
		setStatus('pending');
		setValue(null);
		setError(null);

		return asyncFunction()
			.then((response: any) => {
				setValue(response);
				setStatus('success');
			})
			.catch((error: any) => {
				setError(error);
				setStatus('error');
			});
	}, [asyncFunction]);

	// Call execute if we want to fire it right away.
	// Otherwise execute can be called later, such as
	// in an onClick handler.
	useEffect(() => {
		if (immediate) {
			execute();
		}
	}, [execute, immediate]);

	return { execute, status, value, error };
};

export async function getBackgroundScript(): Promise<BackgroundScript> {
	const bgPage = (await browser.runtime.getBackgroundPage()) as any;
	return bgPage.window.bg;
}

declare let content: {
	fetch: typeof fetch;
	XMLHttpRequest: typeof XMLHttpRequest;
};
export const universalFetch: typeof window.fetch = function (...args) {
	const isFirefox = browser.runtime.getURL('').startsWith('moz-extension://');
	if (isFirefox) {
		// firefox should use content.fetch to avoid CORS issues
		return content.fetch(...args);
	}
	return window.fetch(...args);
};
