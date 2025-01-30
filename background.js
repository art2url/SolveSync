chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPLOAD_CODE') {
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
          content: btoa(message.code),
        };

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
