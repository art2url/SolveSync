(function () {
  // Run the script only on problem pages
  if (!window.location.href.startsWith('https://leetcode.com/problems/'))
    return;

  // Utility: Send captured problem data to the background script.
  function sendSolutionData(solutionData) {
    chrome.runtime.sendMessage({ action: 'commit_solution', ...solutionData });
  }

  // List of supported languages.
  const supportedLanguages = [
    'c',
    'c#',
    'c++',
    'cpp',
    'dart',
    'go',
    'haskell',
    'java',
    'javascript',
    'js',
    'julia',
    'kotlin',
    'lua',
    'ms sql server',
    'mysql',
    'objective-c',
    'objectivec',
    'oracle',
    'php',
    'perl',
    'python',
    'python3',
    'r',
    'ruby',
    'rust',
    'scala',
    'shell',
    'bash',
    'swift',
    'typescript',
  ];

  function findProgrammingLanguage() {
    const allElements = document.querySelectorAll('button, div, span');
    for (const element of allElements) {
      const text = element.textContent.trim().toLowerCase();
      if (supportedLanguages.includes(text)) {
        return text;
      }
    }
    return 'unknown';
  }

  // Debounce utility to limit rapid calls.
  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Helper: Convert HTML to formatted text, remove &nbsp; and compress multiple line breaks.
  function convertDescription(html) {
    // Remove &nbsp; entities.
    html = html.replace(/&nbsp;/gi, ' ');
    // Replace <br> with newline.
    html = html.replace(/<br\s*\/?>/gi, '\n');
    // Replace <p> tags with newlines.
    html = html.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n\n');
    // Replace <li> with markdown bullet.
    html = html.replace(/<li[^>]*>/gi, '- ').replace(/<\/li>/gi, '\n');
    // Remove remaining HTML tags.
    html = html.replace(/<[^>]+>/g, '');
    // Compress multiple newlines into a single newline.
    html = html.replace(/\n+/g, '\n');
    return html.trim();
  }

  // Capture static data immediately.
  function captureStaticData() {
    const titleElem = document.querySelector(
      'a.truncate.cursor-text[href^="/problems/"]'
    );
    const problemTitle = titleElem
      ? titleElem.innerText.trim()
      : 'Unknown Problem';

    const difficultyElem = document.querySelector(
      'div[class*="text-difficulty-"]'
    );
    const difficulty = difficultyElem
      ? difficultyElem.innerText.trim()
      : 'Unknown';

    const descriptionElem = document.querySelector(
      'div[data-track-load="description_content"]'
    );
    let description = '';
    if (descriptionElem) {
      description = convertDescription(descriptionElem.innerHTML);
      if (description.length > 0) {
        // Wrap the description in triple backticks.
        description = '```\n' + description + '\n```';
      }
    }

    const language = findProgrammingLanguage();

    return { problemTitle, difficulty, description, language };
  }

  // Capture dynamic data after delay.
  function captureDynamicData(callback) {
    const codeElem = document.querySelector(
      'div.view-lines.monaco-mouse-cursor-text'
    );
    const code = codeElem ? codeElem.innerText : '';
    callback({ code });
  }

  // Main function to capture and send data.
  function captureAndSendData() {
    const staticData = captureStaticData();

    // Attach click listener to the submit button.
    const submitButton = document.querySelector(
      'button[data-e2e-locator="console-submit-button"]'
    );
    if (submitButton) {
      submitButton.addEventListener('click', () => {
        const observer = new MutationObserver((mutations, observerInstance) => {
          const statusElem = document.querySelector(
            'span[data-e2e-locator="submission-result"]'
          );
          if (statusElem && statusElem.textContent.trim() === 'Accepted') {
            captureDynamicData((dynamicData) => {
              const solutionData = { ...staticData, ...dynamicData };
              if (
                solutionData.problemTitle !== 'Unknown Problem' ||
                solutionData.description.length > 0 ||
                solutionData.code.length > 0
              ) {
                sendSolutionData(solutionData);
              }
            });
            observerInstance.disconnect();
            // Stop observing after capturing.
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // Initial capture attempt.
  captureAndSendData();

  // Set up MutationObserver with debounce to capture changes.
  const observer = new MutationObserver(
    debounce(() => {
      captureAndSendData();
    }, 3000)
  );
  observer.observe(document.body, { childList: true, subtree: true });
})();
