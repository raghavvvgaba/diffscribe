# diffscribe

AI-powered commit message generator for Conventional Commits.

## Features

- ✅ Conventional Commits compliance
- ✅ Concise and detailed modes
- ✅ Preview before committing
- ✅ Automatic clipboard copy
- ✅ Regeneration loop
- ✅ Smart model selection (free draft + paid refinement for long diffs)
- ✅ Mock mode for testing
- ✅ Error handling with clear messages

## How It Works

1. Reads your staged Git diffs
2. Generates a Conventional Commit message using AI
3. Preview and accept/reject
4. Copies to clipboard on accept
5. Run `git commit` and paste message

## Installation

Zero-install via npx:

```bash
npx diffscribe
```

## Setup

### 1. Get OpenRouter API Key

Visit https://openrouter.ai/keys to get your API key.

### 2. Set Environment Variable

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

For permanent setup, add to your shell profile:
```bash
echo 'export OPENROUTER_API_KEY=your-api-key-here' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc
```

### 3. Verify Setup

```bash
echo $OPENROUTER_API_KEY
```

## Usage

### Basic Usage

```bash
# Stage your changes
git add .

# Generate commit message
npx diffscribe
```

### Mock Mode (Testing)

For testing without API calls:

```bash
npx diffscribe --mock
```

## Model Strategy

The tool uses a smart two-stage approach for optimal cost and quality:

### Draft Stage (Free Models)
- **Primary**: `mistralai/devstral-2512:free` — Fast free model for initial commit message
- **Backup**: `qwen/qwen3-coder:free` — Falls back if primary hits rate limits

### Refinement Stage (Paid Model)
- **Refinement**: `google/gemini-2.5-flash-lite` — Polishes messages for large diffs (300+ lines or 12KB+)

### When Does Refinement Run?
Only for larger changes to improve clarity and structure. Smaller diffs skip refinement to save cost.

## Options

```
Options:
  -V, --version          output the version number
  --mock                Use mock generation instead of LLM (for testing)
  -h, --help           display help for command
```

## Requirements

- Node.js >= 20
- Git repository
- OpenRouter API key (unless using --mock mode)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck
```

## License

MIT
