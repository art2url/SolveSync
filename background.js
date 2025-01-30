chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPLOAD_CODE') {
    chrome.storage.local.get('github_token', ({ github_token }) => {
      if (!github_token) {
        chrome.runtime.sendMessage({
          status: 'GitHub Authentication Required',
        });
        return;
      }

      const { problemTitle, code } = message;
      const repo = 'LeetCode-Solutions'; // Your GitHub repo name
      const path = `leetcode/${problemTitle}.js`;
      const commitMessage = `Added solution for ${problemTitle}`;

      fetch(
        `https://api.github.com/repos/YOUR_GITHUB_USERNAME/${repo}/contents/${path}`,
        {
          method: 'GET',
          headers: { Authorization: `token ${github_token}` },
        }
      )
        .then((response) => response.json())
        .then((fileData) => {
          const content = btoa(code);
          const payload = {
            message: commitMessage,
            content,
            branch: 'main',
          };

          if (fileData.sha) {
            payload.sha = fileData.sha;
          }

          return fetch(
            `https://api.github.com/repos/YOUR_GITHUB_USERNAME/${repo}/contents/${path}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `token ${github_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            }
          );
        })
        .then((res) => res.json())
        .then((data) => console.log('File uploaded:', data))
        .catch((error) => console.error('Upload failed:', error));
    });
  }
});
