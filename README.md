# SolveSync Chrome Extension (Currently in Testing)

SolveSync is a Chrome extension that automates the process of uploading your LeetCode solutions directly to a GitHub repository.

## Features
- Login with GitHub using OAuth authentication.
- Automatically save LeetCode solutions to your GitHub repository.
- Manage repository and branch settings within the extension.
- View your GitHub username and status in the extension's popup.

## Setup

### Prerequisites
1. **Chrome browser**.
2. **GitHub account** for authentication.
3. A **GitHub repository** to store your LeetCode solutions.

### Installation
1. Download the SolveSync extension from [GitHub Repository](https://github.com/art2url/SolveSync).
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode** and click **Load unpacked**.
4. Select the **SolveSync extension folder**.

### OAuth Login
1. Open the extension and click **"Login with GitHub"**.
2. You will be redirected to GitHub's OAuth authentication page.
3. Upon successful login, the extension will store your credentials and update the UI.

### Settings
1. Open the extension popup and click on the **"Settings"** button.
2. Enter the repository name and branch where your LeetCode solutions will be saved.
3. Click **Save Settings**.

### Usage
Once logged in:
1. When you submit a solution on LeetCode, the extension will automatically upload the code to your specified GitHub repository and branch.
2. View your GitHub username and connection status in the extension's popup.

## Technologies Used
- **Chrome Extensions API**
- **OAuth 2.0** (GitHub authentication)
- **JavaScript, HTML, CSS**

## License
This project is licensed under the MIT License.
