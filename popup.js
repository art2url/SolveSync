document.getElementById('save').addEventListener('click', async () => {
  const repo = document.getElementById('repo').value.trim();
  const token = document.getElementById('token').value.trim();

  if (!repo || !token) {
    alert('Please fill in both fields.');
    return;
  }

  chrome.storage.local.set({ repo, token }, () => {
    alert('GitHub details saved! Now open a LeetCode problem.');
  });
});
