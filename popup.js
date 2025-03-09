document.addEventListener('DOMContentLoaded', function() {
    const domainList = document.getElementById('domainList');
    const infoElement = document.getElementById('info');
    const copyAllButton = document.getElementById('copyAll');
    const rescanButton = document.getElementById('rescan');
  
    browser.storage.local.get(['unregisterdDomains', 'lastChecked', 'pageUrl']).then((data) => {
      if (data.unregisterdDomains && data.unregisterdDomains.length > 0) {
        displayDomains(data.unregisterdDomains);
        updateInfo(data.unregisterdDomains.length, data.lastChecked, data.pageUrl);
      } else {
        domainList.innerHTML = '<div class="no-domains">No unregisterd domains found on this page.</div>';
        updateInfo(0, data.lastChecked, data.pageUrl);
      }
    }).catch((error) => {
      console.error('Error loading data from storage:', error);
    });
  
    function displayDomains(domains) {
      domainList.innerHTML = '';
      domains.forEach(domain => {
        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';
        domainItem.textContent = domain;
        domainList.appendChild(domainItem);
      });
    }
  
    function updateInfo(count, lastChecked, pageUrl) {
      let infoText = `Found ${count} unregisterd domain${count !== 1 ? 's' : ''}`;
  
      if (lastChecked) {
        const date = new Date(lastChecked);
        infoText += ` (Last checked: ${date.toLocaleTimeString()})`;
      }
  
      if (pageUrl) {
        const url = new URL(pageUrl);
        infoText += `<br>Page: ${url.hostname}${url.pathname}`;
      }
  
      infoElement.innerHTML = infoText;
    }
  
    copyAllButton.addEventListener('click', function() {
      browser.storage.local.get(['unregisterdDomains']).then((data) => {
        if (data.unregisterdDomains && data.unregisterdDomains.length > 0) {
          const domainsText = data.unregisterdDomains.join('\n');
          navigator.clipboard.writeText(domainsText).then(function() {
            copyAllButton.textContent = 'Copied!';
            setTimeout(() => {
              copyAllButton.textContent = 'Copy All Domains';
            }, 2000);
          });
        }
      }).catch((error) => {
        console.error('Error retrieving domains:', error);
      });
    });
  
    rescanButton.addEventListener('click', function() {
      browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {action: "rescan"});
        domainList.innerHTML = '<div class="no-domains">Rescanning page for unregisterd domains...</div>';
        rescanButton.disabled = true;
        rescanButton.textContent = 'Scanning...';
  
        setTimeout(() => {
          rescanButton.disabled = false;
          rescanButton.textContent = 'Rescan Page';
        }, 3000);
      }).catch((error) => {
        console.error('Error querying tabs:', error);
      });
    });
  });
  