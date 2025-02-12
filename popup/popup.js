document.addEventListener('DOMContentLoaded', function () {
  // Function to update UI based on stored login credentials.
  function updateLoginStatus() {
    chrome.storage.local.get(
      ['github_token', 'github_username'],
      function (data) {
        const statusText = document.getElementById(
          'github-username',
          'status-text'
        );
        const statusIcon = document.getElementById('status-icon');
        const loginButton = document.getElementById('github-login');
        const clearDataButton = document.getElementById('clear-data');
        const mascotEl = document.getElementById('mascot');

        if (data.github_token && data.github_username) {
          statusText.innerText = data.github_username;
          statusIcon.classList.add('connected');
          statusIcon.classList.remove('disconnected');
          statusText.classList.add('connected');
          statusText.classList.remove('disconnected');
          loginButton.style.display = 'none';
          clearDataButton.style.display = 'inline-block';
          mascotEl.classList.remove('offline');
          mascotEl.classList.add('online');
        } else {
          statusText.innerText = `You’re not logged in`;
          statusIcon.classList.add('disconnected');
          statusIcon.classList.remove('connected');
          statusText.classList.add('disconnected');
          statusText.classList.remove('connected');
          mascotEl.classList.remove('online');
          mascotEl.classList.add('offline');
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
            // OAuth flow succeeded
          } else {
            // OAuth flow error
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
          updateLoginStatus();
        }
      );
    });
  }

  // --- SETTINGS SECTION ---
  // Pre-populate settings inputs with stored values when the popup loads.
  chrome.storage.local.get(['repo', 'branch'], function (data) {
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
    confirmation.style.color = isError ? 'RGB(235,87,87)' : 'RGB(39,174,96)';
    confirmation.style.display = 'block';
    setTimeout(() => {
      confirmation.style.display = 'none';
    }, 10000);
  }

  // Get references for settings input elements.
  const repoInput = document.getElementById('repo');
  const branchInput = document.getElementById('branch');

  // Auto-save: store the current value into chrome.storage as the user types.
  if (repoInput) {
    repoInput.addEventListener('click', function () {
      repoInput.classList.remove('alert');
    });
    repoInput.addEventListener('input', function () {
      repoInput.classList.remove('alert');
      const repo = repoInput.value.trim();
      chrome.storage.local.set({ repo: repo });
    });
  }
  if (branchInput) {
    branchInput.addEventListener('click', function () {
      branchInput.classList.remove('alert');
    });
    branchInput.addEventListener('input', function () {
      branchInput.classList.remove('alert');
      const branch = branchInput.value.trim();
      chrome.storage.local.set({ branch: branch });
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
        branchInput.classList.add('alert');
        repoInput.classList.add('alert');
        showConfirmation('Both fields are required', true);
        return;
      }

      // Confirmation.
      showConfirmation('Settings saved successfully!');
    });
  }

  // Handler for "Settings" button to toggle the settings form.
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', function () {
      toggleSettingsForm();
      settingsButton.classList.toggle('activated');
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
