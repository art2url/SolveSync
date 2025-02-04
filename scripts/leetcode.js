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

  // Capture problem details using selectors based on provided examples.
  function captureProblemData() {
    // Title: capture the <a> element with href starting with "/problems/"
    const titleElem = document.querySelector('a[href^="/problems/"]');
    const problemTitle = titleElem
      ? titleElem.innerText.trim()
      : 'Unknown Problem';
    console.log('Title element:', titleElem, 'Captured title:', problemTitle);

    // Difficulty: capture the <div> whose class contains "text-difficulty-"
    const difficultyElem = document.querySelector(
      'div[class*="text-difficulty-"]'
    );
    const difficulty = difficultyElem
      ? difficultyElem.innerText.trim()
      : 'Unknown';
    console.log(
      'Difficulty element:',
      difficultyElem,
      'Captured difficulty:',
      difficulty
    );

    // Description: capture the <div> with the attribute data-track-load="description_content"
    const descriptionElem = document.querySelector(
      'div[data-track-load="description_content"]'
    );
    const description = descriptionElem ? descriptionElem.innerText.trim() : '';
    console.log(
      'Description element:',
      descriptionElem,
      'Description length:',
      description.length
    );

    // Language: capture the language from the button with classes "rounded inline-flex"
    const languageElem = document.querySelector('button.rounded.inline-flex');
    // The language text might include extra content (like the chevron icon), so we may need to clean it.
    const language = languageElem
      ? languageElem.firstChild.textContent.trim()
      : 'python';
    console.log(
      'Language element:',
      languageElem,
      'Captured language:',
      language
    );

    // Code: capture the solution code from the Monaco editor container
    const codeElem = document.querySelector(
      'div.view-lines.monaco-mouse-cursor-text'
    );
    const code = codeElem ? codeElem.innerText : '';
    console.log(
      'Code element:',
      codeElem,
      'Captured code length:',
      code.length
    );

    return { problemTitle, difficulty, language, code, description };
  }

  // Try an immediate capture.
  let data = captureProblemData();
  if (
    data.problemTitle !== 'Unknown Problem' ||
    data.description.length > 0 ||
    data.code.length > 0
  ) {
    console.log('Initial capture successful:', data);
    sendSolutionData(data);
  } else {
    console.log('Initial capture unsuccessful; setting up MutationObserver...');
    const observer = new MutationObserver(function (
      mutations,
      observerInstance
    ) {
      let data = captureProblemData();
      if (
        data.problemTitle !== 'Unknown Problem' &&
        (data.description.length > 0 || data.code.length > 0)
      ) {
        console.log('MutationObserver captured data:', data);
        sendSolutionData(data);
        observerInstance.disconnect();
      } else {
        console.log('MutationObserver waiting for data to load...');
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  console.log('LeetCode content script loaded and observing DOM changes.');
})();
