const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;

async function authenticateWithGitHub() {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=public_repo`;

  try {
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authURL,
      interactive: true,
    });

    if (responseUrl) {
      const urlParams = new URLSearchParams(new URL(responseUrl).search);
      const authCode = urlParams.get('code');
      console.log('GitHub Auth Code:', authCode);
    }
  } catch (error) {
    console.error('GitHub OAuth failed:', error);
  }
}

// Run when the extension is clicked
chrome.action.onClicked.addListener(() => {
  authenticateWithGitHub();
});
