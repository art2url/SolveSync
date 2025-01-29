function getCodeFromEditor() {
  const editor = document.querySelector('.monaco-editor'); // Get code editor
  if (!editor) return null;

  const code = editor.innerText; // Extract code from editor
  return code;
}

function getProblemTitle() {
  const titleElement = document.querySelector('h1.text-label-1');
  return titleElement
    ? titleElement.innerText.replace(/\s+/g, '-')
    : 'unknown-problem';
}

function listenForSubmission() {
  document.addEventListener('click', async (event) => {
    if (event.target.innerText.includes('Submit')) {
      setTimeout(async () => {
        const code = getCodeFromEditor();
        const problemTitle = getProblemTitle();

        if (code) {
          console.log('Code Submitted:', code);
          chrome.runtime.sendMessage({
            action: 'UPLOAD_CODE',
            problemTitle,
            code,
          });
        }
      }, 5000); // Wait 5 seconds after submission
    }
  });
}

listenForSubmission();
