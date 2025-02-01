// Extract query parameters (access_token and github_username) from the URL
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const githubUsername = urlParams.get('github_username');

if (accessToken && githubUsername) {
  // Store the access token and username in chrome.storage.local
  chrome.storage.local.set(
    {
      github_token: accessToken,
      github_username: githubUsername,
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error('Failed to save to storage:', chrome.runtime.lastError);
      } else {
        console.log('GitHub authentication data saved to local storage.');
        // Optionally, redirect the user to another page in your extension
        window.location.href = 'popup.html';
      }
    }
  );
} else {
  console.error('OAuth failed: No access token or username received');
}
