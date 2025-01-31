// Listen for the OAuth flow
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OAUTH_RESULT') {
    // Save GitHub token and username to local storage
    const { github_token, github_username } = message.data;

    chrome.storage.local.set(
      {
        github_token: github_token,
        github_username: github_username,
      },
      function () {
        console.log('GitHub authentication data saved to local storage.');
      }
    );
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPLOAD_CODE') {
    // Retrieve the GitHub token and username from local storage
    chrome.storage.local.get(
      ['github_token', 'github_username'],
      async (data) => {
        if (!data.github_token || !data.github_username) {
          console.error('GitHub authentication required');
          return;
        }

        const filePath = `leetcode/${message.problemTitle}.js`;
        const githubApiUrl = `https://api.github.com/repos/${data.github_username}/SolveSync/contents/${filePath}`;

        const requestData = {
          message: `Add solution for ${message.problemTitle}`,
          content: btoa(message.code), // base64 encode the code
        };

        // Upload the solution to GitHub
        fetch(githubApiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `token ${data.github_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
          .then((res) => res.json())
          .then((data) => console.log('Uploaded:', data))
          .catch((err) => console.error('Upload Error:', err));
      }
    );
  }
});
