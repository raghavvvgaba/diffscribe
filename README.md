# diffscribe

AI-powered commit message generator for Conventional Commits.

## Features

- ✅ Conventional Commits compliance
- ✅ Concise and detailed modes
- ✅ Preview before committing
- ✅ Automatic clipboard copy
- ✅ Regeneration loop
- ✅ OpenRouter integration with multiple AI models
- ✅ Mock mode for testing
- ✅ Error handling with clear messages

## How It Works

1. Reads your staged Git diffs
2. Generates a Conventional Commit message using AI
3. Preview and accept/reject
4. Copies to clipboard on accept
5. Run `git commit` and paste the message

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

See [OPENROUTER_SETUP.md](./OPENROUTER_SETUP.md) for detailed configuration.

## Usage

### Basic Usage

```bash
# Stage your changes
git add .

# Generate commit message
npx diffscribe
```

### Use Specific Model

```bash
npx diffscribe --model openai/gpt-4o
```

### Mock Mode (Testing)

For testing without API calls:

```bash
npx diffscribe --mock
```

### Available Models

| Model | Description | Pricing |
|--------|-------------|----------|
| `openai/gpt-4o-mini` | Fast, affordable, great for commit messages | ~$0.15/1M tokens |
| `openai/gpt-4o` | Premium quality, higher cost | ~$2.50/1M tokens |
| `deepseek/deepseek-chat` | Excellent coding capabilities, very affordable | ~$0.14/1M tokens |
| `meta-llama/llama-3.1-8b-instruct:free` | Free model, good for simple commits | FREE |
| `anthropic/claude-3.5-sonnet` | Best quality, higher cost | ~$3.00/1M tokens |

## Options

```
Options:
  -V, --version          output the version number
  --model <model>       AI model to use (default: "openai/gpt-4o-mini")
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
