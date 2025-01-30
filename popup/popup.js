document.addEventListener('DOMContentLoaded', async function () {
  const clientId = 'Ov23lik3RKBt8FYYNzaV'; // Your GitHub Client ID
  const redirectUri = 'https://solvesync-backend.onrender.com/auth/github'; // Server URL
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${redirectUri}`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      chrome.tabs.create({ url: authUrl });
    });

  // Check if the user is already logged in
  chrome.storage.local.get(['github_token', 'github_username'], (data) => {
    if (data.github_username) {
      document.getElementById('github-username').innerText =
        data.github_username;
    }
  });

  // Listen for messages from background.js to store the token
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'STORE_GITHUB_TOKEN') {
      chrome.storage.local.set(
        {
          github_token: message.token,
          github_username: message.username,
        },
        () => {
          document.getElementById('github-username').innerText =
            message.username;
          console.log('GitHub authentication successful!');
        }
      );
    }
  });
});
