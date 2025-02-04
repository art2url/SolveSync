document.addEventListener('DOMContentLoaded', function () {
  // Function to update UI based on stored login credentials.
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
  const loginBtn = document.getElementById('github-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      loginBtn.innerText = 'Logging in...';
      loginBtn.disabled = true;

      // Send message to background to start the OAuth flow.
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
          updateLoginStatus();
          loginBtn.innerText = 'Login with GitHub';
          loginBtn.disabled = false;
        }
      );
    });
  }

  // Handler for "Clear Data" button.
  const clearDataBtn = document.getElementById('clear-data');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', function () {
      chrome.storage.local.remove(
        ['github_token', 'github_username'],
        function () {
          console.log('Popup: Credentials cleared from storage.');
          updateLoginStatus();
        }
      );
    });
  }

  // --- SETTINGS SECTION ---
  // Pre-populate settings inputs with stored values when the popup loads.
  chrome.storage.local.get(['repo', 'branch'], function (data) {
    console.log('Prepopulating settings with:', data);
    if (data.repo) {
      document.getElementById('repo').value = data.repo;
    }
    if (data.branch) {
      document.getElementById('branch').value = data.branch;
    }
  });

  // Utility: show confirmation (or error) message.
  function showConfirmation(message, isError = false) {
    const confirmation = document.getElementById('settings-confirmation');
    if (!confirmation) return;
    confirmation.innerText = message;
    confirmation.style.color = isError ? 'red' : 'green';
    confirmation.style.display = 'block';
    setTimeout(() => {
      confirmation.style.display = 'none';
    }, 3000);
  }

  // Get references for settings input elements.
  const repoInput = document.getElementById('repo');
  const branchInput = document.getElementById('branch');

  // Auto-save: store the current value into chrome.storage as the user types.
  if (repoInput) {
    repoInput.addEventListener('input', function () {
      const repo = repoInput.value.trim();
      chrome.storage.local.set({ repo: repo }, function () {
        console.log('Auto-saved repo:', repo);
      });
    });
  }
  if (branchInput) {
    branchInput.addEventListener('input', function () {
      const branch = branchInput.value.trim();
      chrome.storage.local.set({ branch: branch }, function () {
        console.log('Auto-saved branch:', branch);
      });
    });
  }

  // Handler for "Save Settings" button.
  const settingsSaveButton = document.getElementById('settings-save');
  if (settingsSaveButton) {
    settingsSaveButton.addEventListener('click', function () {
      const repo = repoInput.value.trim();
      const branch = branchInput.value.trim();

      // Validate that both fields are not empty.
      if (!repo || !branch) {
        showConfirmation(
          'Error: Both repository and branch fields are required.',
          true
        );
        return;
      }

      // Validate repository format: must be "username/repository".
      const repoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
      if (!repoRegex.test(repo)) {
        showConfirmation(
          'Error: Repository must be in the format "username/repository".',
          true
        );
        return;
      }

      // Since values are auto-saved, just show confirmation.
      showConfirmation('Settings saved successfully!');
    });
  } else {
    console.error('settings-save button not found in the DOM.');
  }

  // Handler for "Settings" button to toggle the settings form.
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', function () {
      toggleSettingsForm();
    });
  }
});

// Toggle settings form visibility and re-populate inputs on open.
function toggleSettingsForm() {
  const settingsBlock = document.getElementById('settings-block');
  if (settingsBlock.style.display === 'block') {
    settingsBlock.style.display = 'none';
  } else {
    chrome.storage.local.get(['repo', 'branch'], function (data) {
      document.getElementById('repo').value = data.repo || '';
      document.getElementById('branch').value = data.branch || '';
    });
    settingsBlock.style.display = 'block';
  }
}
