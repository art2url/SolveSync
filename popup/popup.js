document.getElementById('github-auth').addEventListener('click', () => {
  chrome.identity.launchWebAuthFlow(
    {
      url: `https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&scope=repo`,
      interactive: true,
    },
    (redirectUrl) => {
      const urlParams = new URLSearchParams(new URL(redirectUrl).search);
      const code = urlParams.get('code');

      fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'YOUR_GITHUB_CLIENT_ID',
          client_secret: 'YOUR_GITHUB_CLIENT_SECRET',
          code,
        }),
      })
        .then((res) => res.text())
        .then((params) => {
          const accessToken = new URLSearchParams(params).get('access_token');
          chrome.storage.local.set({ github_token: accessToken }, () => {
            document.getElementById('status').innerText = 'Authenticated!';
          });
        });
    }
  );
});
