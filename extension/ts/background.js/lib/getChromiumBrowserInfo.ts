export const getChromiumBrowserInfo = () => {
  const chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
  return {
    buildID: "",
    vendor: "Google",
    version: chromeVersion,
    name: "Chrome",
  };
};
