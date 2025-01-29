const GITHUB_REPO = 'your-github-username/leetcode-solutions';

async function uploadToGitHub(problemTitle, code) {
  try {
    // Get GitHub Token
    const { github_token } = await chrome.storage.local.get('github_token');
    if (!github_token) {
      alert('Please authenticate with GitHub first.');
      return;
    }

    const filename = `solutions/${problemTitle}.txt`;
    const commitMessage = `Added solution for ${problemTitle}`;

    // Get SHA if file exists (GitHub API requires SHA for overwriting)
    let sha = null;
    const fileResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        headers: { Authorization: `Bearer ${github_token}` },
      }
    );

    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha;
    }

    // Upload to GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${github_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: btoa(code), // Encode code in Base64
          sha, // Required for overwriting an existing file
        }),
      }
    );

    if (response.ok) {
      alert(`✅ Successfully uploaded ${problemTitle} to GitHub!`);
    } else {
      console.error('GitHub Upload Failed:', await response.json());
    }
  } catch (error) {
    console.error('Error uploading to GitHub:', error);
  }
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'UPLOAD_CODE') {
    uploadToGitHub(message.problemTitle, message.code);
  }
});
