document.addEventListener('DOMContentLoaded', async function () {
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      chrome.tabs.create({ url: authUrl });
    });

  // Function to update UI based on login status
  function updateUI(username) {
    const usernameElement = document.getElementById('github-username');
    const statusIcon = document.getElementById('status-icon');

    if (username) {
      usernameElement.innerText = `Logged in as: ${username}`;
      statusIcon.classList.remove('disconnected');
      statusIcon.classList.add('connected');
    } else {
      usernameElement.innerText = `Not Logged In`;
      statusIcon.classList.remove('connected');
      statusIcon.classList.add('disconnected');
    }
  }

  // Check if the user is already logged in
  chrome.storage.local.get(['github_token', 'github_username'], (data) => {
    updateUI(data.github_username || null);
  });
});
