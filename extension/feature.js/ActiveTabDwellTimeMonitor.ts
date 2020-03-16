/**
 * Monitors active dwell time of all opened/activated tabs
 */
export class ActiveTabDwellTimeMonitor {
  private tabActiveDwellTimes = {};
  private interval;

  public run() {
    // checks what is the current tabId every interval and attributes the interval length of dwell time to that tab
    const intervalMs = 250;

    this.interval = setInterval(async () => {
      // First check non-private tabs without specifying currentWindow: true to avoid bug https://bugzilla.mozilla.org/show_bug.cgi?id=1560025
      const activeNonPrivateTabs = await browser.tabs.query({
        active: true,
      });
      if (activeNonPrivateTabs.length === 0) {
        return;
      }
      const activeNonPrivateTabsInTheCurrentWindow = await browser.tabs.query({
        currentWindow: true,
        active: true,
      });
      activeNonPrivateTabsInTheCurrentWindow.map(tab => {
        if (this.tabActiveDwellTimes[tab.id] === undefined) {
          this.tabActiveDwellTimes[tab.id] = intervalMs;
        } else {
          this.tabActiveDwellTimes[tab.id] += intervalMs;
        }
      });
    }, intervalMs);
  }

  public getTabActiveDwellTime(tabId) {
    return this.tabActiveDwellTimes[tabId];
  }

  public cleanup() {
    clearInterval(this.interval);
  }
}
