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
    const { problemTitle, difficulty, language, code, description, problemId } =
      message;

    // Check if essential data is missing and log which fields are missing.
    let missingFields = [];
    if (problemTitle === 'Unknown Problem') missingFields.push('problem title');
    if (difficulty === 'Unknown') missingFields.push('difficulty');
    if (code.trim().length === 0 && description.trim().length === 0)
      missingFields.push('solution code/description');
    if (!problemId) missingFields.push('problem ID');

    if (missingFields.length > 0) {
      const errorMsg =
        'Insufficient problem data; missing: ' + missingFields.join(', ');
      chrome.storage.local.set({
        commit_status: errorMsg,
        lastProblemId: '',
      });
      console.log('Commit skipped:', errorMsg);
      sendResponse({
        success: false,
        error: errorMsg,
      });
      return;
    }

    // Check stored problem ID; if different, clear previous state.
    chrome.storage.local.get(['lastProblemId'], function (storedData) {
      if (storedData.lastProblemId && storedData.lastProblemId !== problemId) {
        chrome.storage.local.remove(
          ['commit_status', 'lastProblemId'],
          function () {
            processCommit();
          }
        );
      } else {
        processCommit();
      }
    });

    function processCommit() {
      chrome.storage.local.get(
        ['repo', 'branch', 'github_token', 'github_username'],
        function (data) {
          if (
            !data.repo ||
            !data.branch ||
            !data.github_token ||
            !data.github_username
          ) {
            const errMsg = 'Missing repository settings or GitHub credentials.';
            chrome.storage.local.set({
              commit_status: errMsg,
              lastProblemId: '',
            });
            console.log(errMsg);
            sendResponse({
              success: false,
              error: errMsg,
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
          };
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
            const errMsg = 'Failed to encode solution or description.';
            chrome.storage.local.set({
              commit_status: errMsg,
              lastProblemId: '',
            });
            console.log(errMsg, e);
            sendResponse({
              success: false,
              error: errMsg,
            });
            return;
          }

          const githubApiUrlBase = `https://api.github.com/repos/${data.github_username}/${data.repo}/contents/`;

          // commitFile: if file exists, do not update.
          function commitFile(filePath, content, callback) {
            const url = githubApiUrlBase + filePath;
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

          commitFile(
            solutionFilePath,
            encodedSolution,
            function (err, solutionResult) {
              if (err) {
                const errorMsg = err.toString();
                chrome.storage.local.set({
                  commit_status: 'Error: ' + errorMsg,
                  lastProblemId: '',
                });
                console.log('Error committing solution file:', errorMsg);
                sendResponse({ success: false, error: errorMsg });
                return;
              }
              commitFile(
                readmeFilePath,
                encodedReadme,
                function (err, readmeResult) {
                  if (err) {
                    const errorMsg = err.toString();
                    chrome.storage.local.set({
                      commit_status: 'Error: ' + errorMsg,
                      lastProblemId: '',
                    });
                    console.log('Error committing readme file:', errorMsg);
                    sendResponse({ success: false, error: errorMsg });
                    return;
                  }
                  let truncatedTitle = problemTitle;
                  if (truncatedTitle.length > 30) {
                    truncatedTitle = truncatedTitle.substring(0, 27) + '...';
                  }
                  const commitStatusMessage = `${truncatedTitle} was successfully committed!`;
                  chrome.storage.local.set({
                    commit_status: commitStatusMessage,
                    lastProblemId: problemId,
                  });
                  console.log('Commit successful:', commitStatusMessage);
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
    }
    return true;
  }
});
