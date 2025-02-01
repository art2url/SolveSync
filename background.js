// Listen for the OAuth result and store in storage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OAUTH_RESULT') {
    console.log('Received OAUTH_RESULT in background.js:', message.data);

    const { github_token, github_username } = message.data;

    chrome.storage.local.set(
      {
        github_token: github_token,
        github_username: github_username,
      },
      function () {
        if (chrome.runtime.lastError) {
          console.error(
            'Error saving to local storage:',
            chrome.runtime.lastError
          );
        } else {
          console.log('GitHub authentication data saved to local storage.');
        }
      }
    );
  }
});

// Handle the upload code action
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPLOAD_CODE') {
    console.log('Received UPLOAD_CODE message:', message);

    // Retrieve the GitHub token and username from local storage
    chrome.storage.local.get(
      ['github_token', 'github_username'],
      async (data) => {
        console.log('Retrieved data from storage in background.js:', data); // Log the data

        if (!data.github_token || !data.github_username) {
          console.error('GitHub authentication required');
          sendResponse({
            success: false,
            error: 'GitHub authentication required',
          });
          return;
        }

        const { problemTitle, code } = message;
        if (!problemTitle || !code) {
          console.error('Problem title or code missing');
          sendResponse({
            success: false,
            error: 'Problem title or code missing',
          });
          return;
        }

        const filePath = `leetcode/${problemTitle}.js`;
        const githubApiUrl = `https://api.github.com/repos/${data.github_username}/SolveSync/contents/${filePath}`;

        const requestData = {
          message: `Add solution for ${problemTitle}`,
          content: btoa(code), // base64 encode the code
        };

        // Log the request data before sending the API request
        console.log(
          'Preparing to upload to GitHub:',
          githubApiUrl,
          requestData
        );

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
          .then((data) => {
            console.log('Uploaded successfully:', data);
            sendResponse({ success: true, data });
          })
          .catch((err) => {
            console.error('Upload Error:', err);
            sendResponse({ success: false, error: err });
          });

        // Indicate that the response will be sent asynchronously
        return true;
      }
    );
  }
});
