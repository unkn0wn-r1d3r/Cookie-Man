let beforeLoginCookies = [];
let capturedDomains = new Set();

// Handle incoming messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in background:', request);
  
    if (request.action === "getCookies") {
      chrome.cookies.getAll({ url: request.url }, (cookies) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting cookies:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        console.log('Cookies retrieved:', cookies);
        sendResponse({ cookies: cookies });
      });
      return true;
    }

  if (request.action === "exportCookies") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      const cookieData = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("\n");
      console.log('Exporting Cookies:', cookieData);
      downloadTextFile("cookies.txt", cookieData);
    });
    return true;
  }

  if (request.action === "exportCookieNames") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      const cookieNames = cookies.map(cookie => cookie.name).join("\n");
      console.log('Exporting Cookie Names:', cookieNames);
      downloadTextFile("cookie_names.txt", cookieNames);
    });
    return true;
  }

  if (request.action === "editCookie") {
    const { url, name, value } = request.cookieDetails;
    console.log('Editing Cookie:', request.cookieDetails);
    chrome.cookies.set({ url: url, name: name, value: value }, (cookie) => {
      if (chrome.runtime.lastError) {
        console.error('Error editing cookie:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ status: 'Cookie edited successfully' });
    });
    return true; // Indicates async response
  }

  if (request.action === "getPayloads") {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (details.requestBody) {
          // Extract payload data if available
          const payload = details.requestBody.raw ? details.requestBody.raw[0].bytes : null;
          console.log('Payload captured:', payload);
          sendResponse({ payload: payload });
        }
      },
      { urls: ["<all_urls>"] },
      ["requestBody"]
    );
    return true;
  }

  if (request.action === "getDomains") {
    sendResponse({ domains: Array.from(capturedDomains) });
    capturedDomains.clear(); // Clear after sending response to avoid duplicate data
    return true;
  }

  if (request.action === "compareSessions") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      const afterLoginCookies = cookies;
      const changes = [];

      afterLoginCookies.forEach((cookie) => {
        const beforeCookie = beforeLoginCookies.find(c => c.name === cookie.name);
        if (!beforeCookie || beforeCookie.value !== cookie.value) {
          changes.push({
            name: cookie.name,
            before: beforeCookie ? beforeCookie.value : 'Not present',
            after: cookie.value
          });
        }
      });

      console.log('Session Comparison Changes:', changes);
      sendResponse({ changes: changes });
    });
    return true;
  }

  if (request.action === "captureBeforeLogin") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      beforeLoginCookies = cookies;
      console.log('Captured Before Login Cookies:', beforeLoginCookies);
      sendResponse({ status: 'Before login cookies captured' });
    });
    return true;
  }
});

// Listen for web requests and capture domains
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    capturedDomains.add(url.hostname);
  },
  { urls: ["<all_urls>"] }
);

function downloadTextFile(filename, content) {
  const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);

  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: true
  });
}
