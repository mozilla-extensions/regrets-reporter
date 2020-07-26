export const getChromiumBrowserInfo = () => {
  const chromeVersionAndBuildId = /Chrome\/([0-9.]+)/.exec(
    navigator.userAgent,
  )[1];
  const buildID = chromeVersionAndBuildId
    .split(".")
    .slice(2, 4)
    .join(".");
  const version = chromeVersionAndBuildId
    .split(".")
    .slice(0, 2)
    .join(".");
  return {
    buildID,
    vendor: "Google",
    version,
    name: "Chrome",
  };
};
