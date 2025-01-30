function getCodeFromEditor() {
  const editor = document.querySelector('.monaco-editor');
  return editor ? editor.innerText : null;
}

function getProblemTitle() {
  const titleElement = document.querySelector('h1.text-label-1');
  return titleElement
    ? titleElement.innerText.replace(/\s+/g, '-')
    : 'unknown-problem';
}

document.addEventListener('click', async (event) => {
  if (event.target.innerText.includes('Submit')) {
    setTimeout(() => {
      const code = getCodeFromEditor();
      const problemTitle = getProblemTitle();

      if (code) {
        chrome.runtime.sendMessage({
          action: 'UPLOAD_CODE',
          problemTitle,
          code,
        });
      }
    }, 5000);
  }
});
