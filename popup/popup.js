document.addEventListener('DOMContentLoaded', async function () {
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      chrome.tabs.create({ url: authUrl });
    });

  // Fetch the access token if redirected from GitHub
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  if (urlParams.has('access_token')) {
    const accessToken = urlParams.get('access_token');
    const githubUsername = urlParams.get('github_username');

    if (accessToken && githubUsername) {
      // Store in Chrome storage
      chrome.storage.local.set(
        { github_token: accessToken, github_username: githubUsername },
        () => {
          console.log('GitHub token stored successfully');
          document.getElementById('github-username').innerText = githubUsername;
        }
      );
    }
  }

  // Check if the user is already logged in
  chrome.storage.local.get(['github_token', 'github_username'], (data) => {
    if (data.github_username) {
      document.getElementById('github-username').innerText =
        data.github_username;
    }
  });
});
