document.addEventListener('DOMContentLoaded', async function () {
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      chrome.tabs.create({ url: authUrl });
    });

  // Check if the user has already logged in
  chrome.storage.local.get(['github_token', 'github_username'], (data) => {
    if (data.github_username) {
      document.getElementById('github-username').innerText =
        data.github_username;
    }
  });
});
