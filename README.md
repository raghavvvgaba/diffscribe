# diffscribe

CLI based AI-powered commit message generator for Conventional Commits.

## Features

- Conventional Commits compliance
- Concise and detailed modes
- Preview before committing
- Automatic clipboard copy
- Regeneration loop

## How It Works

1. Reads your staged Git diffs
2. Generates a Conventional Commit message
3. Preview and accept/reject
4. Copies to clipboard on accept

## Installation

Zero-install via npx:

```bash
npx diffscribe

## How to use

```bash
# Stage changes
git add .

# Generate commit message
npx diffscribe
```


```
## Requirements

- Node.js >= 20
- Git repository

