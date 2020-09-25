<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [RegretsReporter: Testing Instructions](#regretsreporter-testing-instructions)
  - [High-level testing instructions](#high-level-testing-instructions)
  - [UX](#ux)
  - [Specific test cases to cover in the test plan](#specific-test-cases-to-cover-in-the-test-plan)
    - [The extension does not collect and data in Private Browsing mode](#the-extension-does-not-collect-and-data-in-private-browsing-mode)
  - [YouTube usage stats reflect YouTube usage](#youtube-usage-stats-reflect-youtube-usage)
  - [General YouTube functionality should not be affected](#general-youtube-functionality-should-not-be-affected)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# RegretsReporter: Testing Instructions

## High-level testing instructions

- Follow the instructions on [https://foundation.mozilla.org/regrets-reporter/]() to understand what the extension is about and to install the extension.
- Verify that usage / expected functionality is explained in the installation instructions or on the onboarding page that pops up after installation.
- At a very minimum, it should be possible to:
  - Send regret reports after visiting YouTube watch/video pages.
  - Have one’s YouTube usage stats submitted roughly every 24 hours.
  - Inspect one’s collected data
    - In Firefox: right-click the RegretsReporter toolbar icon, choose “Manage Extension”, select the Preferences pane and click “Inspect Collected Data”
    - In Chrome: right-click the RegretsReporter toolbar icon, choose “Options” and click “Inspect Collected Data”.
  - Send a data deletion request
    - In Firefox: right-click the RegretsReporter toolbar icon, choose “Manage Extension”, select the Preferences pane and click “Send Data Deletion Request”.
    - In Chrome: right-click the RegretsReporter toolbar icon, choose “Options” and click “Send Data Deletion Request”.

## UX

Feel free to report obviously incorrect bits of implemented UX and unexpected glitches etc.

## Specific test cases to cover in the test plan

### The extension does not collect and data in Private Browsing mode

- Install the extension.
- Verify that no data is collected in Private Browsing mode.

## YouTube usage stats reflect YouTube usage

- Install the extension in a clean profile.
- Go to `about:devtools-toolbox?type=extension&id=regrets-reporter%40mozillafoundation.org` and choose the `Console` tab to open the add-on's Console.
- Run the following:

```
    await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
    await youTubeUsageStatistics.onNavigationBatchesByUuidProcessed(
      openWpmPacketHandler.navigationBatchPreprocessor
        .navigationBatchesByNavigationUuid,
    );
    await youTubeUsageStatistics.summarizeUpdate();
```

- Verify that all usage stats are zeroed.
- Browse around YouTube in a certain way (in some test cases, also restart the browser one or many times).
  - Eg play a YouTube video on a watch page, or just visit a watch page without playing the video etc.
- Run the above commands again and verify that the usage stats reflect the recent YouTube browsing history.

Note: Usage stats are updated once a minute, in conjunction with the navigation batch processing. This means that up to a minute of usage stats that occur before browser restart/shutdown will never make it to the persisted usage statistics.

If there are any issues found here, please follow these instructions and attach the following for proper debugging context:

- Run `youTubeUsageStatistics` in the Console.
- Right click on "Object" and choose "Copy object”.
- Paste into the bug report.

## General YouTube functionality should not be affected

This extension does not intentionally modify YouTube functionality in any way. Any breakage should be reported as bugs/issues.

At least verify the following functionality is intact with the extension installed:

- Visit YouTube.com
- Log in
- List history, subscriptions etc (without page reloads / &pbjreload=102 issues)
- Watch videos
- Subscribe and unsubscribe to channels from video watch pages

Note that issues are much more likely on Chrome due to the lack an WebExtension API for reading response data ([for more details, see this open Chrome bug from 2015](https://bugs.chromium.org/p/chromium/issues/detail?id=487422)), requiring our extension to implement a page-script-level workaround.
