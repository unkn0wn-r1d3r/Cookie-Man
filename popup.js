document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('themeToggleButton');
    const resultsDiv = document.getElementById('results');
    let darkMode = false;
  
    // Handle theme toggle
    themeToggleButton.addEventListener('click', () => {
      darkMode = !darkMode;
      document.body.classList.toggle('dark-mode', darkMode);
    });
  
    // Function to handle sending messages and updating results
    function handleButtonClick(action, extraData = {}) {
      resultsDiv.innerHTML = 'Loading...';
      chrome.runtime.sendMessage({ action: action, ...extraData }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          resultsDiv.innerHTML = `An error occurred: ${chrome.runtime.lastError.message}`;
          return;
        }
        if (response) {
          resultsDiv.innerHTML = formatResponse(action, response);
        } else {
          resultsDiv.innerHTML = 'No data found or error occurred.';
        }
      });
    }
  
    // Format the response for display
    function formatResponse(action, response) {
      if (response.error) {
        return `<p style="color: red;">Error: ${response.error}</p>`;
      }
  
      switch (action) {
        case 'getCookies':
          return response.cookies.map(cookie => {
            const isSessionCookie = cookie.name.toLowerCase().includes('session') || cookie.name.toLowerCase().includes('token');
            const className = isSessionCookie ? 'session' : '';
            return `<div class="cookie-item ${className}">${cookie.name}=${cookie.value}</div>`;
          }).join('');
        case 'exportCookieNames':
        case 'exportCookies':
          return 'Download started. Check your downloads folder.';
        case 'getPayloads':
          return `<pre>${JSON.stringify(response.payload, null, 2)}</pre>`;
        case 'getDomains':
          return response.domains.map(domain => `<div class="cookie-item">${domain}</div>`).join('');
        case 'compareSessions':
          return response.changes.map(change => `<div class="cookie-item">${change.name}: Before - ${change.before}, After - ${change.after}</div>`).join('');
        default:
          return 'Unknown action';
      }
    }
  
    // Edit cookie button handler
    document.getElementById('editCookieButton').addEventListener('click', () => {
      const url = prompt('Enter the URL of the site (e.g., http://example.com):');
      const name = prompt('Enter the cookie name to edit:');
      const value = prompt('Enter the new value for the cookie:');
      
      if (url && name && value) {
        handleButtonClick('editCookie', { cookieDetails: { url: url, name: name, value: value } });
      } else {
        resultsDiv.innerHTML = 'All fields are required.';
      }
    });
  
    // Other button event listeners
    document.getElementById('cookiesButton').addEventListener('click', () => handleButtonClick('getCookies'));
    document.getElementById('exportCookieNamesButton').addEventListener('click', () => handleButtonClick('exportCookieNames'));
    document.getElementById('exportCookiesButton').addEventListener('click', () => handleButtonClick('exportCookies'));
    document.getElementById('payloadsButton').addEventListener('click', () => handleButtonClick('getPayloads'));
    document.getElementById('domainsButton').addEventListener('click', () => handleButtonClick('getDomains'));
    document.getElementById('sessionCompareButton').addEventListener('click', () => handleButtonClick('compareSessions', { url: 'http://example.com' }));
  });
  