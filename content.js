// Inject a script to interact with the LeetCode editor
const extractCode = () => {
  const codeElement = document.querySelector('.CodeMirror-code');
  if (!codeElement) return null;

  return [...codeElement.querySelectorAll('.CodeMirror-line')]
    .map((line) => line.textContent)
    .join('\n');
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractCode') {
    const code = extractCode();
    const title = document.querySelector('.css-v3d350').textContent.trim();
    sendResponse({ code, title });
  }
});
