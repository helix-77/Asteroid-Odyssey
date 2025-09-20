# Contributor Workflow

This guide outlines the steps for contributing to this repository. Please follow these steps to ensure a smooth workflow. Always use branches and pull requests—never commit directly to the `main` branch.

## Prerequisites
- Ensure you have [Git](https://git-scm.com/) installed.
- Install [pnpm](https://pnpm.io/) globally if you don’t already have it:
  ```bash
  npm install -g pnpm
  ```

## Workflow Steps

### 1. Clone the Repository (First Time Only)
Clone the repository to your local machine and navigate to the project folder:
```bash
git clone git@github.com:<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install Dependencies
Install the project dependencies using pnpm:
```bash
pnpm install
```

### 3. Create a New Branch
Create a new branch for your feature, bug fix, or maintenance task:
```bash
git checkout -b feature/my-change
```

**Branch Naming Conventions:**
- `feature/...` — for new features
- `fix/...` — for bug fixes
- `chore/...` — for maintenance tasks

### 4. Make Changes
Edit files, test locally, and run linter/tests if available:
```bash
pnpm run dev   # or project-specific start script
pnpm run lint  # optional: check formatting
```

### 5. Stage and Commit Your Work
Stage your changes and commit with a clear message:
```bash
git add .
git commit -m "feat: short description of change"
```

### 6. Push Your Branch
Push your branch to the remote repository:
```bash
git push origin feature/my-change
```

### 7. Open a Pull Request (PR)
- Go to the repository on GitHub.
- Click **Compare & pull request** for your branch.
- Set the target branch to `main` (unless instructed otherwise).
- Provide a clear description and request a review.

### 8. Sync with the Latest Changes
Before starting new work, update your local repository:
```bash
git checkout main
git pull origin main
git checkout -b feature/new-task
```

**Repeat steps 3–8 for each new task.**

## Notes
- If you encounter merge conflicts during `git pull`, resolve them carefully and ask for help if needed.
- Always test your changes locally before pushing.
- Follow any additional project-specific guidelines (e.g., coding standards, testing requirements).

Happy contributing! 🚀


# NASA

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/helix-77s-projects/v0-nasa)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/yDo0JWMuTDs)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/helix-77s-projects/v0-nasa](https://vercel.com/helix-77s-projects/v0-nasa)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/yDo0JWMuTDs](https://v0.app/chat/projects/yDo0JWMuTDs)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
