document.addEventListener('DOMContentLoaded', function () {
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        function (redirectUrl) {
          if (chrome.runtime.lastError || !redirectUrl) {
            console.error('OAuth failed:', chrome.runtime.lastError);
            return;
          }

          // Extract the code from the redirect URL
          const urlParams = new URL(redirectUrl).searchParams;
          const code = urlParams.get('code');
          if (!code) {
            console.error('OAuth failed: No code received');
            return;
          }

          // Fetch the tokens using the code
          fetch('https://solvesync-backend.onrender.com/auth/github', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (!data.access_token || !data.github_username) {
                console.error('Failed to retrieve access token');
                return;
              }

              chrome.storage.local.set(
                {
                  github_token: data.access_token,
                  github_username: data.github_username,
                },
                () => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      'Failed to save to storage:',
                      chrome.runtime.lastError
                    );
                  } else {
                    document.getElementById('github-username').innerText =
                      data.github_username;
                    document
                      .getElementById('status-icon')
                      .classList.add('connected');
                    document
                      .getElementById('status-icon')
                      .classList.remove('disconnected');
                  }
                }
              );
            })
            .catch((error) => {
              console.error('OAuth failed:', error);
            });
        }
      );
    });

  // Initial check for stored login data
  chrome.storage.local.get(['github_token', 'github_username'], (data) => {
    if (data.github_username) {
      document.getElementById('github-username').innerText =
        data.github_username;
      document.getElementById('status-icon').classList.add('connected');
      document.getElementById('status-icon').classList.remove('disconnected');
    } else {
      document.getElementById('github-username').innerText = 'Not Logged In';
      document.getElementById('status-icon').classList.add('disconnected');
      document.getElementById('status-icon').classList.remove('connected');
    }
  });

  // Save repo and branch settings to chrome storage
  document
    .getElementById('settings-save')
    .addEventListener('click', function () {
      const repo = document.getElementById('repo').value;
      const branch = document.getElementById('branch').value;

      chrome.storage.local.set({ repo, branch }, function () {
        alert('Settings Saved!');
        toggleSettingsForm(); // Close form after saving
      });
    });

  // Event listener for the "Settings" button to show the form
  document
    .getElementById('settings-button')
    .addEventListener('click', function () {
      toggleSettingsForm(); // Toggle settings form visibility
    });
});

// Toggle settings form visibility
function toggleSettingsForm() {
  const settingsBlock = document.getElementById('settings-block');
  const isFormVisible = settingsBlock.style.display === 'block';
  settingsBlock.style.display = isFormVisible ? 'none' : 'block';
}
