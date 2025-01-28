chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['repo', 'token'], async ({ repo, token }) => {
    if (!repo || !token) {
      alert('Please set up your GitHub details in the extension popup.');
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['content.js'],
      },
      () => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'extractCode' },
          async (response) => {
            if (!response || !response.code) {
              alert(
                "No code found! Make sure you're on a LeetCode problem page."
              );
              return;
            }

            const { code, title } = response;
            const filename = `${title.replace(/\s+/g, '_')}.js`;

            // Save the code to GitHub
            const githubApiUrl = `https://api.github.com/repos/${repo}/contents/${filename}`;
            const fileContent = btoa(unescape(encodeURIComponent(code))); // Base64 encoding

            try {
              const res = await fetch(githubApiUrl, {
                method: 'PUT',
                headers: {
                  Authorization: `token ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Add solution for ${title}`,
                  content: fileContent,
                }),
              });

              if (res.ok) {
                alert(`Solution for "${title}" saved to GitHub!`);
              } else {
                alert(
                  'Failed to save solution to GitHub. Check your repo and token.'
                );
              }
            } catch (error) {
              console.error(error);
              alert('An error occurred while saving the solution.');
            }
          }
        );
      }
    );
  });
});
