document.addEventListener('DOMContentLoaded', function () {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      chrome.tabs.create({ url: githubAuthUrl });
    });
});
