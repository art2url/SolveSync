document.addEventListener('DOMContentLoaded', function () {
  // Function to update UI based on stored credentials.
  function updateLoginStatus() {
    chrome.storage.local.get(
      ['github_token', 'github_username'],
      function (data) {
        const statusText = document.getElementById('github-username');
        const statusIcon = document.getElementById('status-icon');
        const loginButton = document.getElementById('github-login');
        const clearDataButton = document.getElementById('clear-data');

        if (data.github_token && data.github_username) {
          statusText.innerText = data.github_username;
          statusIcon.classList.add('connected');
          statusIcon.classList.remove('disconnected');
          loginButton.style.display = 'none';
          clearDataButton.style.display = 'inline-block';
        } else {
          statusText.innerText = 'Not Logged In';
          statusIcon.classList.add('disconnected');
          statusIcon.classList.remove('connected');
          loginButton.style.display = 'inline-block';
          clearDataButton.style.display = 'none';
        }
      }
    );
  }

  // Initial UI update on popup load.
  updateLoginStatus();

  // Handler for "Login with GitHub" button.
  document
    .getElementById('github-login')
    .addEventListener('click', function () {
      const loginButton = document.getElementById('github-login');
      loginButton.innerText = 'Logging in...';
      loginButton.disabled = true;

      // Send message to background to start OAuth flow.
      chrome.runtime.sendMessage(
        { action: 'start_oauth' },
        function (response) {
          if (response && response.success) {
            console.log('Popup: OAuth flow succeeded:', response.data);
          } else {
            console.error(
              'Popup: OAuth flow error:',
              response && response.error
            );
          }
          // In any case, update the UI and re-enable the button.
          updateLoginStatus();
          loginButton.innerText = 'Login with GitHub';
          loginButton.disabled = false;
        }
      );
    });

  // Handler for "Clear Data" button.
  document.getElementById('clear-data').addEventListener('click', function () {
    chrome.storage.local.remove(
      ['github_token', 'github_username'],
      function () {
        console.log('Popup: Credentials cleared from storage.');
        updateLoginStatus();
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
