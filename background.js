chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start_oauth') {
    const redirectUri = chrome.identity.getRedirectURL();
    const clientId = chrome.runtime.getManifest().oauth2.client_id;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=repo`;
    console.log('Background: Launching OAuth flow with URL:', authUrl);

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      function (redirectUrl) {
        if (chrome.runtime.lastError) {
          console.error(
            'Background: OAuth launch error:',
            chrome.runtime.lastError
          );
          sendResponse({ error: chrome.runtime.lastError });
          return;
        }

        console.log(
          'Background: OAuth flow returned redirectUrl:',
          redirectUrl
        );
        if (redirectUrl) {
          try {
            const urlObj = new URL(redirectUrl);
            const code = urlObj.searchParams.get('code');
            if (!code) {
              sendResponse({
                error: 'Authorization code not found in redirect URL.',
              });
              return;
            }
            console.log('Background: Authorization code:', code);

            // Exchange the authorization code for token & username via backend.
            fetch('https://solvesync-backend.onrender.com/auth/github', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code }),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `Backend responded with status ${response.status}`
                  );
                }
                return response.json();
              })
              .then((data) => {
                console.log('Background: Data received from backend:', data);
                if (data.access_token && data.github_username) {
                  // Save credentials to chrome.storage.
                  chrome.storage.local.set(
                    {
                      github_token: data.access_token,
                      github_username: data.github_username,
                    },
                    () => {
                      console.log('Background: Credentials saved to storage.');
                      sendResponse({ success: true, data: data });
                    }
                  );
                } else {
                  sendResponse({
                    error: 'Invalid data received from backend.',
                  });
                }
              })
              .catch((error) => {
                console.error(
                  'Background: Error during token exchange:',
                  error
                );
                sendResponse({ error: error.toString() });
              });
          } catch (err) {
            console.error('Background: Error processing redirectUrl:', err);
            sendResponse({ error: err.toString() });
          }
        } else {
          sendResponse({ error: 'redirectUrl is undefined.' });
        }
      }
    );
    // Indicate that the response will be sent asynchronously.
    return true;
  }
});
