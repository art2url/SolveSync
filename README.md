# SolveSync Chrome Extension

SolveSync is a Chrome extension that automates uploading your accepted LeetCode solutions directly to your GitHub repository. It uses secure OAuth authorization to handle your credentials and commits your solutions in a structured format.

## Features

- **Automatic Uploads:** Seamlessly upload accepted LeetCode solutions to your GitHub.
- **Organized Repository:** Solutions are categorized by difficulty (Easy, Medium, Hard) and stored in folders named after the problem title.
- **Secure Authorization:** OAuth 2.0 ensures your GitHub credentials are handled securely.

## Technologies Used

- **Frontend:** JavaScript, Chrome Extensions API
- **Backend:** Node.js, Express, Axios, CORS
- **Authentication:** GitHub OAuth 2.0

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/art2url/solve-sync.git
   ```

2. **Load Extension in Chrome:**
   - Go to `chrome://extensions/`.
   - Enable **Developer Mode** (top right corner).
   - Click **Load unpacked** and select the cloned `solve-sync` directory.

3. **Set Up GitHub OAuth App:**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers).
   - Click on **New OAuth App**.
   - **Application Name:** SolveSync
   - **Homepage URL:** `https://github.com/your-username`
   - **Authorization Callback URL:** `https://<your-extension-id>.chromiumapp.org`
   - After creation, copy the **Client ID** and **Client Secret**.

4. **Configure the Backend Server:**
   - Clone the backend repository:
     ```bash
     git clone https://github.com/art2url/solve-sync-oauth-server.git
     cd solve-sync-oauth-server
     ```
   - Create a `.env` file in the root directory with the following content:
     ```env
     GITHUB_CLIENT_ID=your-client-id
     GITHUB_CLIENT_SECRET=your-client-secret
     ```
   - Deploy the backend to a free server like [Render](https://render.com/):
     - Create a new **Web Service** on Render.
     - Connect your GitHub repository and deploy.
     - Ensure the backend URL is updated in the extension's `manifest.json` under `host_permissions`.

5. **Configure Extension Settings:**
   - Open the SolveSync extension popup.
   - **Login with GitHub** using the OAuth flow.
   - Enter your **Repository** and **Branch** where solutions will be uploaded.

## Usage

1. Go to any LeetCode problem.
2. Solve and submit the problem.
3. Once your solution is **Accepted**, it will be automatically uploaded to your GitHub repository in the specified structure.

## Repository Structure

```
├── easy
│   └── 2703-return-length-of-arguments-passed
│       ├── 2703-return-length-of-arguments-passed.js
│       └── readme.md
├── medium
│   └── example-medium-problem
│       ├── example-medium-problem.py
│       └── readme.md
└── hard
    └── example-hard-problem
        ├── example-hard-problem.java
        └── readme.md
```

## License

This project is licensed under the [MIT License](LICENSE).

---

Enjoy solving problems and keeping your GitHub repository updated effortlessly! 🚀
