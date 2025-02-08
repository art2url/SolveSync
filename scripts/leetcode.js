(function () {
  console.log('LeetCode content script started.');

  // Run the script only on problem pages
  if (!window.location.href.startsWith('https://leetcode.com/problems/')) {
    console.log('Not a problem page. Script will not run.');
    return;
  }

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

    const language = findProgrammingLanguage();

    return { problemTitle, difficulty, description, language };
  }

  // Capture dynamic data after delay
  function captureDynamicData(callback) {
    const codeElem = document.querySelector(
      'div.view-lines.monaco-mouse-cursor-text'
    );
    const code = codeElem ? codeElem.innerText : '';

    callback({ code });
  }

  // Main function to capture and send data
  function captureAndSendData() {
    const staticData = captureStaticData();

    // Attach click listener to the submit button
    const submitButton = document.querySelector(
      'button[data-e2e-locator="console-submit-button"]'
    );

    if (submitButton) {
      console.log('Submit button found, adding click listener.');
      submitButton.addEventListener('click', () => {
        console.log('Submit button clicked. Waiting for "Accepted" status.');

        const observer = new MutationObserver((mutations, observerInstance) => {
          const statusElem = document.querySelector(
            'span[data-e2e-locator="submission-result"]'
          );

          if (statusElem && statusElem.textContent.trim() === 'Accepted') {
            console.log(
              'Submission Accepted. Capturing code and sending data.'
            );

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

            observerInstance.disconnect(); // Stop observing after capturing
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      });
    } else {
      console.log('Submit button not found.');
    }
  }

  // Initial capture attempt
  captureAndSendData();

  // Set up MutationObserver with debounce to capture changes
  const observer = new MutationObserver(
    debounce(() => {
      console.log('Detected DOM changes, checking for submit button...');
      captureAndSendData();
    }, 3000)
  );

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('LeetCode content script loaded and observing DOM changes.');
})();
