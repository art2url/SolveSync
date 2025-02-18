chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start_oauth') {
    const redirectUri = chrome.identity.getRedirectURL();
    const clientId = chrome.runtime.getManifest().oauth2.client_id;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=repo`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      function (redirectUrl) {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError });
          return;
        }
        if (redirectUrl) {
          try {
            const urlObj = new URL(redirectUrl);
            const code = urlObj.searchParams.get('code');
            if (!code) {
              sendResponse({
                error: 'Authorization code not found in redirect URL.',
              });
              return;
            }
            // Exchange the authorization code for token & username via backend.
            fetch('https://solvesync-backend.onrender.com/auth/github', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code }),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `Backend responded with status ${response.status}`
                  );
                }
                return response.json();
              })
              .then((data) => {
                if (data.access_token && data.github_username) {
                  // Save credentials to chrome.storage.
                  chrome.storage.local.set(
                    {
                      github_token: data.access_token,
                      github_username: data.github_username,
                    },
                    () => {
                      sendResponse({ success: true, data: data });
                    }
                  );
                } else {
                  sendResponse({
                    error: 'Invalid data received from backend.',
                  });
                }
              })
              .catch((error) => {
                sendResponse({ error: error.toString() });
              });
          } catch (err) {
            sendResponse({ error: err.toString() });
          }
        } else {
          sendResponse({ error: 'redirectUrl is undefined.' });
        }
      }
    );
    // Indicate that the response will be sent asynchronously.
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'commit_solution') {
    const { problemTitle, difficulty, language, code, description } = message;

    // Prevent committing if essential data is missing.
    if (
      problemTitle === 'Unknown Problem' ||
      difficulty === 'Unknown' ||
      (code.trim().length === 0 && description.trim().length === 0)
    ) {
      chrome.storage.local.set({
        commit_status: 'Insufficient problem data; commit skipped.',
        lastProblem: '',
      });
      sendResponse({
        success: false,
        error: 'Insufficient problem data; commit skipped.',
      });
      return;
    }

    // Clear previous commit state if the problem is new.
    chrome.storage.local.get(['lastProblem'], function (storedData) {
      if (!storedData.lastProblem || storedData.lastProblem !== problemTitle) {
        chrome.storage.local.remove(['commit_status', 'lastProblem']);
      }

      chrome.storage.local.get(
        ['repo', 'branch', 'github_token', 'github_username'],
        function (data) {
          if (
            !data.repo ||
            !data.branch ||
            !data.github_token ||
            !data.github_username
          ) {
            chrome.storage.local.set({
              commit_status:
                'Missing repository settings or GitHub credentials.',
              lastProblem: '',
            });
            sendResponse({
              success: false,
              error: 'Missing repository settings or GitHub credentials.',
            });
            return;
          }

          const diffFolder = difficulty.toLowerCase();

          function slugify(text) {
            return text
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^\w\-]+/g, '')
              .replace(/\-\-+/g, '-');
          }
          const slugTitle = slugify(problemTitle);

          const extensionMapping = {
            c: '.c',
            'c#': '.cs',
            'c++': '.cpp',
            cpp: '.cpp',
            dart: '.dart',
            go: '.go',
            haskell: '.hs',
            java: '.java',
            javascript: '.js',
            js: '.js',
            julia: '.jl',
            kotlin: '.kt',
            lua: '.lua',
            'ms sql server': '.sql',
            mysql: '.sql',
            'objective-c': '.m',
            objectivec: '.m',
            oracle: '.sql',
            php: '.php',
            perl: '.pl',
            python: '.py',
            python3: '.py',
            r: '.r',
            ruby: '.rb',
            rust: '.rs',
            scala: '.scala',
            shell: '.sh',
            bash: '.sh',
            swift: '.swift',
            typescript: '.ts',
          }; // TODO: add more languages.
          const fileExt = extensionMapping[language.toLowerCase()] || '.txt';

          const problemFolderPath = `${diffFolder}/${slugTitle}`;
          const solutionFilePath = `${problemFolderPath}/${slugTitle}${fileExt}`;
          const readmeFilePath = `${problemFolderPath}/readme.md`;
          const commitMessage = `Add solution for ${problemTitle}`;

          let encodedSolution, encodedReadme;
          try {
            encodedSolution = btoa(unescape(encodeURIComponent(code)));
            const readmeContent = `# ${problemTitle}\n\n${description}`;
            encodedReadme = btoa(unescape(encodeURIComponent(readmeContent)));
          } catch (e) {
            chrome.storage.local.set({
              commit_status: 'Failed to encode solution or description.',
              lastProblem: '',
            });
            sendResponse({
              success: false,
              error: 'Failed to encode solution or description.',
            });
            return;
          }

          const githubApiUrlBase = `https://api.github.com/repos/${data.github_username}/${data.repo}/contents/`;

          // Modified commitFile: if file exists, skip updating.
          function commitFile(filePath, content, callback) {
            const url = githubApiUrlBase + filePath;
            // Check if file exists.
            fetch(url + `?ref=${data.branch}`, {
              headers: {
                Authorization: `token ${data.github_token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            })
              .then((res) => {
                if (res.status === 200) {
                  return res.json();
                } else {
                  return null;
                }
              })
              .then((fileData) => {
                if (fileData && fileData.sha) {
                  // File already exists; do not overwrite.
                  callback(null, fileData);
                  return;
                }
                const body = {
                  message: commitMessage,
                  content: content,
                  branch: data.branch,
                };
                return fetch(url, {
                  method: 'PUT',
                  headers: {
                    Authorization: `token ${data.github_token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.github.v3+json',
                  },
                  body: JSON.stringify(body),
                });
              })
              .then((res) => (res ? res.json() : null))
              .then((result) => {
                if (result) {
                  callback(null, result);
                }
              })
              .catch((err) => {
                callback(err);
              });
          }

          // Commit the solution file first, then the readme file.
          commitFile(
            solutionFilePath,
            encodedSolution,
            function (err, solutionResult) {
              if (err) {
                chrome.storage.local.set({
                  commit_status: 'Error: ' + err.toString(),
                  lastProblem: '',
                });
                sendResponse({ success: false, error: err.toString() });
                return;
              }
              commitFile(
                readmeFilePath,
                encodedReadme,
                function (err, readmeResult) {
                  if (err) {
                    chrome.storage.local.set({
                      commit_status: 'Error: ' + err.toString(),
                      lastProblem: '',
                    });
                    sendResponse({ success: false, error: err.toString() });
                    return;
                  }
                  let truncatedTitle = problemTitle;
                  if (truncatedTitle.length > 30) {
                    truncatedTitle = truncatedTitle.substring(0, 27) + '...';
                  }
                  const commitStatusMessage = `${truncatedTitle} was successfully committed!`;
                  chrome.storage.local.set({
                    commit_status: commitStatusMessage,
                    lastProblem: problemTitle,
                  });
                  sendResponse({
                    success: true,
                    data: { solution: solutionResult, readme: readmeResult },
                  });
                }
              );
            }
          );
        }
      );
    });
    return true;
  }
});
