const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;

async function authenticateWithGitHub() {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=repo`;

  try {
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authURL,
      interactive: true,
    });

    if (responseUrl) {
      const urlParams = new URLSearchParams(new URL(responseUrl).search);
      const code = urlParams.get('code');

      if (code) {
        console.log('GitHub Auth Code:', code);
        // Send this `code` to your backend for an access token
      }
    }
  } catch (error) {
    console.error('GitHub OAuth failed:', error);
  }
}

// Call the function when needed (e.g., on a button click)
authenticateWithGitHub();
