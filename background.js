browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.domains && message.domains.length > 0) {
      checkunregisterdDomains(message.domains, sender.tab.id)
        .then(unregisterdDomains => {
          browser.storage.local.set({ 
            unregisterdDomains: unregisterdDomains,
            lastChecked: new Date().toISOString(),
            pageUrl: sender.tab.url
          });
  
          browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            browser.tabs.sendMessage(tabs[0].id, { unregisterdDomains });
          });
  
          browser.action.setBadgeText({
            text: unregisterdDomains.length.toString(),
            tabId: sender.tab.id
          });
  
          if (unregisterdDomains.length > 0) {
            browser.action.setBadgeBackgroundColor({
              color: "#4caf50",
              tabId: sender.tab.id
            });
          }
        })
        .catch(error => {
          console.error("Error checking domains:", error);
        });
    }
    return true;
  });
  
  async function checkunregisterdDomains(domains, tabId) {
    let unregisterd = [];
    const batchSize = 30;
    const minuteDelay = 60000;
  
    browser.action.setBadgeText({
      text: "0/" + domains.length,
      tabId: tabId
    });
  
    browser.action.setBadgeBackgroundColor({
      color: "#FF9800",
      tabId: tabId
    });
  
    let processedCount = 0;
  
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      const startTime = Date.now();
  
      const promises = batch.map(domain => isDomainAvailable(domain)
        .then(available => {
          if (!available) unregisterd.push(domain);
          processedCount++;
  
          browser.action.setBadgeText({
            text: processedCount + "/" + domains.length,
            tabId: tabId
          });
        })
        .catch(error => {
          console.error(`Error checking domain ${domain}:`, error);
          processedCount++;
  
          browser.action.setBadgeText({
            text: processedCount + "/" + domains.length,
            tabId: tabId
          });
        })
      );
  
      await Promise.all(promises);
  
      if (i + batchSize < domains.length) {
        const elapsedTime = Date.now() - startTime;
        const timeToWait = Math.max(minuteDelay - elapsedTime, 0);
  
        if (timeToWait > 0) {
          browser.action.setBadgeText({
            text: "WAIT",
            tabId: tabId
          });
  
          await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
      }
    }
  
    return unregisterd;
  }
  
  async function isDomainAvailable(domain) {
    const primaryAPI = `https://domain-available-api.arbs09.dev/check?domain=${domain}`;
    const secondaryAPI = `https://domain-available-api.vercel.app/check?domain=${domain}`;
  
    try {
      let response = await fetch(primaryAPI);
      if (!response.ok) {
        throw new Error(`Primary API returned status ${response.status}`);
      }
      let data = await response.json();
      return !data.available;
    } catch (error) {
      console.error(`Primary API failed, trying secondary API for domain ${domain}:`, error);
  
      try {
        let response = await fetch(secondaryAPI);
        if (!response.ok) {
          throw new Error(`Secondary API returned status ${response.status}`);
        }
        let data = await response.json();
        return !data.available;
      } catch (error) {
        console.error(`Secondary API failed for domain ${domain}:`, error);
        return false;
      }
    }
  }
  
  