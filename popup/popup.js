document.addEventListener('DOMContentLoaded', function () {
  // Function to update the UI based on login status
  function updateLoginStatus() {
    console.log('Updating login status...');

    chrome.storage.local.get(
      ['github_token', 'github_username'],
      function (data) {
        console.log('Retrieved data from storage:', data);

        const statusText = document.getElementById('github-username');
        const statusIcon = document.getElementById('status-icon');
        const loginButton = document.getElementById('github-login'); // Declare loginButton inside this scope
        const clearDataButton = document.getElementById('clear-data');

        if (data.github_token && data.github_username) {
          statusText.innerText = data.github_username;
          statusIcon.classList.add('connected');
          statusIcon.classList.remove('disconnected');
          loginButton.style.display = 'none'; // Hide "Login with GitHub"
          clearDataButton.style.display = 'inline-block'; // Show "Clear Data"
        } else {
          statusText.innerText = 'Not Logged In';
          statusIcon.classList.add('disconnected');
          statusIcon.classList.remove('connected');
          loginButton.style.display = 'inline-block'; // Show "Login with GitHub"
          clearDataButton.style.display = 'none'; // Hide "Clear Data"
        }
      }
    );
  }

  // Initial check for stored data on popup load
  updateLoginStatus();

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (
      areaName === 'local' &&
      (changes.github_token || changes.github_username)
    ) {
      updateLoginStatus();
    }
  });

  // GitHub login button click handler
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      console.log('Login with GitHub button clicked');

      // Disable the login button to avoid multiple clicks
      const loginButton = document.getElementById('github-login');
      loginButton.innerText = 'Logging in...'; // Update button text
      loginButton.disabled = true; // Disable the login button

      // Start OAuth flow
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        function (redirectUrl) {
          console.log('OAuth flow completed. Redirect URL:', redirectUrl);

          if (chrome.runtime.lastError || !redirectUrl) {
            console.error('OAuth failed:', chrome.runtime.lastError);
            loginButton.innerText = 'Login with GitHub'; // Restore original button text
            loginButton.disabled = false; // Re-enable the login button
            return;
          }

          const urlParams = new URL(redirectUrl).searchParams;
          const code = urlParams.get('code');
          console.log('Authorization code received:', code);

          if (code) {
            console.log('Sending code to backend for token exchange...');
            fetch('https://solvesync-backend.onrender.com/auth/github', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code }),
            })
              .then((response) => response.json())
              .then((data) => {
                console.log('Data received from backend:', data);
                if (data.access_token && data.github_username) {
                  chrome.storage.local.set(
                    {
                      github_token: data.access_token,
                      github_username: data.github_username,
                    },
                    function () {
                      console.log(
                        'GitHub authentication data saved to local storage.'
                      );
                      updateLoginStatus(); // Refresh UI after credentials are saved
                      loginButton.innerText = 'Login with GitHub'; // Restore the original button text
                      loginButton.disabled = false; // Re-enable the login button
                    }
                  );
                }
              })
              .catch((error) => {
                console.error('Error fetching access token:', error);
                loginButton.innerText = 'Login with GitHub'; // Restore the original button text
                loginButton.disabled = false; // Re-enable the login button
              });
          }
        }
      );
    });

  // "Clear Data" button click handler
  document.getElementById('clear-data').addEventListener('click', function () {
    console.log('Clear Data button clicked');
    chrome.storage.local.remove(
      ['github_token', 'github_username'],
      function () {
        console.log('GitHub authentication data cleared from local storage.');
        updateLoginStatus(); // Refresh UI after clearing data
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
        toggleSettingsForm();
      });
    });

  // Event listener for the "Settings" button to show the form
  document
    .getElementById('settings-button')
    .addEventListener('click', function () {
      toggleSettingsForm();
    });
});

// Toggle settings form visibility
function toggleSettingsForm() {
  const settingsBlock = document.getElementById('settings-block');
  const isFormVisible = settingsBlock.style.display === 'block';
  settingsBlock.style.display = isFormVisible ? 'none' : 'block';
}
