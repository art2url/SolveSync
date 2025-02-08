(function () {
  console.log('LeetCode content script started.');

  // Utility: Send captured problem data to the background script.
  function sendSolutionData(solutionData) {
    console.log('Sending solution data to background:', solutionData);
    chrome.runtime.sendMessage(
      { action: 'commit_solution', ...solutionData },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            'Error sending message to background:',
            chrome.runtime.lastError
          );
        }
        console.log('Response from background:', response);
      }
    );
  }

  // List of supported languages
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
      const text = element.textContent.trim().toLowerCase(); // Normalize case
      if (supportedLanguages.includes(text)) {
        return text;
      }
    }
    return 'unknown';
  }

  // Debounce utility to limit rapid calls
  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Capture static data immediately
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
    const description = descriptionElem ? descriptionElem.innerText.trim() : '';

    return { problemTitle, difficulty, description };
  }

  // Capture dynamic data after delay
  function captureDynamicData(callback) {
    setTimeout(() => {
      const language = findProgrammingLanguage();
      const codeElem = document.querySelector(
        'div.view-lines.monaco-mouse-cursor-text'
      );
      const code = codeElem ? codeElem.innerText : '';

      callback({ language, code });
    }, 4000); // 2-second delay for dynamic content
  }

  // Main function to capture and send data
  function captureAndSendData() {
    const staticData = captureStaticData();

    captureDynamicData((dynamicData) => {
      const solutionData = { ...staticData, ...dynamicData };

      if (
        solutionData.problemTitle !== 'Unknown Problem' ||
        solutionData.description.length > 0 ||
        solutionData.code.length > 0
      ) {
        sendSolutionData(solutionData);
      } else {
        console.log('Data incomplete; will retry...');
      }
    });
  }

  // Initial capture attempt
  captureAndSendData();

  // Set up MutationObserver with debounce to capture changes
  const observer = new MutationObserver(
    debounce(() => {
      console.log('Detected DOM changes, capturing updated data...');
      captureAndSendData();
    }, 3000)
  ); // Debounce for 3 second

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('LeetCode content script loaded and observing DOM changes.');
})();
