document.addEventListener('DOMContentLoaded', function () {
  // Extract the parameters from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');
  const githubUsername = urlParams.get('github_username');

  if (accessToken && githubUsername) {
    console.log('Access token:', accessToken);
    console.log('GitHub username:', githubUsername);

    // Save the token and username to local storage
    chrome.storage.local.set(
      {
        github_token: accessToken,
        github_username: githubUsername,
      },
      function () {
        console.log('GitHub authentication data saved to local storage.');
        // Close the window after saving
        window.location.href = 'popup/popup.html';
      }
    );
  } else {
    console.error('No access token or GitHub username received.');
  }
});
