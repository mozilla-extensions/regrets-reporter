import { browser } from 'webextension-polyfill-ts';

export const extensionFeedbackUrl = 'https://qsurvey.mozilla.com/s3/regrets-reporter-product-feedback';
export const abuseReportingPlatformUrl = 'https://support.google.com/youtube/answer/2802027';
export const surveyUrl = 'https://mozillafoundation.typeform.com/ytusersurvey';
export const reminderSurveyUrl = 'https://mozillafoundation.typeform.com/to/b1PiAfWP';
export const privacyNoticeUrl = 'https://foundation.mozilla.org/en/campaigns/regretsreporter-privacy-notice/';
export const experimentGroupsUrl = 'https://github.com/mozilla-extensions/regrets-reporter/blob/main/experimentinfo.md';
export const onboardingUrl = browser.runtime.getURL('get-started/index.html');
