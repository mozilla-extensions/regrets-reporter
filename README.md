# Mozilla RegretsReporter

## Repository structure

## The extension - `extension`

The RegretsReporter browser extension, built by the nonprofit Mozilla, lets you flag regrettable recommendations on YouTube.

See [extension/README.md](./extension/README.md) for more details.

## The instrumentation - `instrumentation`

The browser extension uses [a custom fork of the OpenWPM instrumentation](https://github.com/motin/OpenWPM/tree/regrets-reporter/automation/Extension/webext-instrumentation) to keep tabs on what YouTube videos have been watched prior to reporting a regret and to be able to aggregate YouTube usage statistics.
