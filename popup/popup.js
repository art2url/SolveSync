document.addEventListener('DOMContentLoaded', function () {
  // Function to update the UI based on login status
  function updateLoginStatus() {
    chrome.storage.local.get(
      ['github_token', 'github_username'],
      function (data) {
        const statusText = document.getElementById('github-username');
        const statusIcon = document.getElementById('status-icon');

        if (data.github_token && data.github_username) {
          // User is logged in
          statusText.innerText = data.github_username;
          statusIcon.classList.add('connected');
          statusIcon.classList.remove('disconnected');
        } else {
          // User is not logged in
          statusText.innerText = 'Not Logged In';
          statusIcon.classList.add('disconnected');
          statusIcon.classList.remove('connected');
        }
      }
    );
  }

  // Initial check for stored data on popup load
  updateLoginStatus();

  // Listen for changes in chrome storage (this is triggered when oauth-callback.html saves data)
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (
      areaName === 'local' &&
      (changes.github_token || changes.github_username)
    ) {
      updateLoginStatus(); // Update the UI when the storage changes
    }
  });

  // GitHub login button click handler
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

          // Extract the access token and GitHub username from the redirect URL
          const urlParams = new URL(redirectUrl).searchParams;
          const accessToken = urlParams.get('access_token');
          const githubUsername = urlParams.get('github_username');

          if (accessToken && githubUsername) {
            // Store the data in chrome.storage.local
            chrome.storage.local.set(
              {
                github_token: accessToken,
                github_username: githubUsername,
              },
              function () {
                if (chrome.runtime.lastError) {
                  console.error(
                    'Failed to save to storage:',
                    chrome.runtime.lastError
                  );
                } else {
                  console.log(
                    'GitHub authentication data saved to local storage.'
                  );

                  // Add a small delay before updating the UI
                  setTimeout(function () {
                    // The storage change event will trigger and update the UI
                  }, 1000); // 1-second delay
                }
              }
            );
          }
        }
      );
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
