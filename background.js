const GITHUB_CLIENT_ID = 'your_github_client_id';

async function authenticateWithGitHub() {
  try {
    // Step 1: Request Device Code
    const deviceCodeResponse = await fetch(
      'https://github.com/login/device/code',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'repo' }),
      }
    );

    const deviceCodeData = await deviceCodeResponse.json();
    console.log('Device Code Response:', deviceCodeData);

    // Step 2: Ask user to manually authenticate
    alert(
      `Go to ${deviceCodeData.verification_uri} and enter this code: ${deviceCodeData.user_code}`
    );

    // Step 3: Poll GitHub for Access Token
    let accessToken = null;
    while (!accessToken) {
      await new Promise((resolve) =>
        setTimeout(resolve, deviceCodeData.interval * 1000)
      );

      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            device_code: deviceCodeData.device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        }
      );

      const tokenData = await tokenResponse.json();
      console.log('Token Response:', tokenData);

      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
      }
    }

    // Store token in Chrome storage
    chrome.storage.local.set({ github_token: accessToken });

    alert('GitHub Authentication Successful!');
  } catch (error) {
    console.error('GitHub Authentication Failed:', error);
  }
}

// Trigger authentication when extension is clicked
chrome.action.onClicked.addListener(() => {
  authenticateWithGitHub();
});
