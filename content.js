document.addEventListener("DOMContentLoaded", () => {
    collectDomains();
  });
  
  collectDomains();
  
  function collectDomains() {
    try {
      let links = [...document.querySelectorAll("a")].map(a => a.href).filter(href => href && href.startsWith('http'));
      let uniqueDomains = [...new Set(links.map(link => {
        try {
          return new URL(link).hostname;
        } catch (e) {
          console.error("Invalid URL:", link);
          return null;
        }
      }))].filter(Boolean);
  
      chrome.runtime.sendMessage({ domains: uniqueDomains });
    } catch (e) {
      console.error("Error collecting domains:", e);
    }
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "rescan") {
      collectDomains();
    } else if (message.unregisterdDomains) {
      console.log("Found unregisterd domains:", message.unregisterdDomains);
    }
  });
  