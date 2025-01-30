chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPLOAD_CODE') {
    const manifest = chrome.runtime.getManifest();
    const githubUsername = manifest.solveSyncConfig.github_username;
    const repoName = 'SolveSync';
    const filePath = `leetcode/${message.problemTitle}.js`;

    const githubApiUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${filePath}`;

    const requestData = {
      message: `Add solution for ${message.problemTitle}`,
      content: btoa(message.code),
    };

    fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${localStorage.getItem('github_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((data) => console.log('Uploaded:', data))
      .catch((err) => console.error('Upload Error:', err));
  }
});
