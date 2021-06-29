# RegretsReporter Release Process

- Create a new branch with the name: `release-x.y.z`
- If there are smaller additions/features to be included in this release that doesn't need a separate PR each for them, commit those changes to this branch
- Bump the version in `package.json`, using commit message `Bump version to x.y.z`
- Create a PR using the new branch with name `Release x.y.z` ([Example](https://github.com/mozilla-extensions/regrets-reporter/pull/18))
- Enter release notes in the PR's description
- Circle CI will produce extension builds that can be tested and/or uploaded to AMO and CWS
- Fix any smaller issues encountered during testing
- At some point, decide that the release is final and merge the PR (can be done the minute before uploading the new versions to AMO and CWS for instance)
- Create a new release using GitHub's interface, calling it `vx.y.z` (the version number prefixed with `v`)
- Upload the latest release builds to AMO and CWS
