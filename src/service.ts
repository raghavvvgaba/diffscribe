import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { OpenRouter } from '@openrouter/sdk';
import type { CommitStyle, CommitMessage } from './config.js';
import { getOpenRouterConfig, DRAFT_MODEL_PRIMARY, DRAFT_MODEL_BACKUP, REFINEMENT_MODEL } from './config.js';

export interface CommitMessageGenerationResult {
  success: boolean;
  message?: string;
  error?: string;
  model?: string;
}

interface DiffStats {
  lines: number;
  chars: number;
}

const output = {
  error: (message: string) => {
    console.error(`${chalk.bold.red('✖')} ${message}`);
  },

  success: (message: string) => {
    console.log(`${chalk.bold.green('✓')} ${message}`);
  },

  info: (message: string) => {
    console.log(`${chalk.blue('ℹ')} ${message}`);
  },

  warning: (message: string) => {
    console.log(`${chalk.yellow('⚠')} ${message}`);
  },

  dim: (message: string) => {
    console.log(chalk.dim(message));
  },

  divider: () => {
    console.log(chalk.dim('─'.repeat(50)));
  },

  header: (title: string) => {
    console.log(`\n${chalk.bold.cyan(title)}\n`);
  }
};

function calculateDiffStats(diff: string): DiffStats {
  const lines = diff.split('\n').length;
  const chars = diff.length;
  return { lines, chars };
}

function isLongDiff(stats: DiffStats): boolean {
  return stats.lines > 300 || stats.chars > 12000;
}

async function callModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 500
): Promise<CommitMessageGenerationResult> {
  try {
    const config = getOpenRouterConfig();
    const openRouter = new OpenRouter({
      apiKey: config.apiKey
    });

    const result = openRouter.callModel({
      model,
      instructions: systemPrompt,
      input: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.1,
      maxOutputTokens: maxTokens
    });

    const message = await result.getText();

    if (!message || message.trim() === '') {
      return {
        success: false,
        error: 'LLM returned empty message'
      };
    }

    return {
      success: true,
      message: message.trim(),
      model
    };
  } catch (error: any) {
    if (error.statusCode === 401) {
      return {
        success: false,
        error: 'Invalid API key. Please check your OPENROUTER_API_KEY environment variable.'
      };
    }

    if (error.statusCode === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait and try again.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to generate commit message'
    };
  }
}

async function generateCommitMessage(
  diff: string,
  style: 'concise' | 'detailed',
  useFallback: boolean
): Promise<CommitMessageGenerationResult> {
  const styleInstruction = style === 'concise'
    ? `Return a concise commit message in Conventional Commits format:

<type>(<scope>): <description>

- Bullet point 1

Use 1-4 bullet points dynamically based on the number of changes.
Only add bullet points if there are meaningful details to explain.`
    : `Return a detailed commit message in Conventional Commits format.

Format Options (choose dynamically based on diff complexity):

SIMPLE FORMAT (for straightforward changes):
<type>(<scope>): <description>

- Bullet point 1
- Bullet point 2
- Bullet point 3

STRUCTURED FORMAT (for complex changes with multiple aspects):
<type>(<scope>): <description>

<Section Title>:
- Bullet point
- Bullet point

<Section Title>:
- Bullet point
- Bullet point

[Optional footer for pending work, breaking changes, etc.]

Use structured format when changes involve:
- Multiple features/aspects
- Different technical areas
- Implementation details + user impact
- Complex refactoring
Use simple format for focused, single-aspect changes.`;

  const systemPrompt = `You are an expert developer who writes perfect Conventional Commits.
Your task is to analyze git diffs and generate clear, meaningful commit messages.

Rules:
- Use valid Conventional Commit types: feat, fix, docs, style, refactor, test, chore, perf
- Scope should be the affected module or component (e.g., auth, api, ui, db)
- Description must be in imperative mood (e.g., "add" not "added" or "adds")
- Keep header under 72 characters
- No period at the end of header
- Focus on WHAT and WHY, not HOW

Section Guidelines:
- Create logical sections based on the diff content
- Common section titles: Core Features, Changes, Technical, Implementation, Breaking Changes
- Use clear, descriptive section names
- Group related changes together
- Each section should have 4-5 bullet points maximum
- Each bullet should be a complete thought

EXAMPLES:

Simple Format Example:
feat(auth): implement OAuth login flow

- Add Google OAuth integration
- Update auth controller to handle OAuth callbacks
- Add OAuth configuration to environment variables

Structured Format Example:
feat(notes): implement note creation, reading, deletion with tag system

Core Features:
- Create notes with tag assignments
- Read and filter notes by tags
- Delete notes with UI confirmation

Tag System:
- Add multiple tags to notes
- Filter notes by tags
- Tag management interface
- Tag-based organization

Technical:
- Appwrite database integration
- Real-time note listing
- Tag filtering functionality
- Responsive UI design

Pending: Update functionality for existing notes

Fix Example:
fix(api): resolve null pointer in user authentication

Issue: Login fails when user has no profile image
- Add null check for profile images
- Update auth middleware to handle missing profiles
- Add error logging for authentication failures

Refactor Example:
refactor(core): migrate from Redux to Zustand

Migration:
- Replace Redux store with Zustand
- Update all state selectors
- Remove Redux middleware
- Migrate async actions to Zustand

Benefits:
- Smaller bundle size (reduced by 200KB)
- Simpler state management
- Better TypeScript support
- Improved developer experience`;

  const userPrompt = `${styleInstruction}\n\nGit Diff:\n\`\`\`diff\n${diff}\n\`\`\``;

  const result = await callModel(DRAFT_MODEL_PRIMARY, systemPrompt, userPrompt);

  if (result.success) {
    return result;
  }

  if (useFallback) {
    const backupResult = await callModel(DRAFT_MODEL_BACKUP, systemPrompt, userPrompt);
    return backupResult;
  }

  return result;
}

async function refineCommitMessage(
  draftMessage: string
): Promise<CommitMessageGenerationResult> {
  const systemPrompt = `You refine git commit messages.
Improve clarity, grammar, and structure.
Do NOT invent new changes or alter meaning.
Maintain Conventional Commits format.`;

  const userPrompt = `Refine this commit message:\n\n${draftMessage}\n\nReturn the final commit message.`;

  return await callModel(REFINEMENT_MODEL, systemPrompt, userPrompt, 300);
}

function parseCommitMessage(llmOutput: string): CommitMessage {
  const lines = llmOutput.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return { header: 'chore: update code' };
  }

  const header = lines[0].trim();

  if (lines.length === 1) {
    return { header };
  }

  const bodyLines = lines.slice(1).join('\n');
  return { header, body: bodyLines };
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await clipboardy.write(text);
    output.success('Commit message copied to clipboard!');
  } catch (error) {
    output.error('Failed to copy to clipboard');
    throw error;
  }
}

export class CommitService {
  async generateCommitMessageWithLLM(
    diff: string,
    style: 'concise' | 'detailed'
  ): Promise<CommitMessageGenerationResult> {
    const stats = calculateDiffStats(diff);
    const isLong = isLongDiff(stats);

    if (!isLong) {
      const result = await generateCommitMessage(diff, style, false);
      return result;
    }

    const draftResult = await generateCommitMessage(diff, style, true);

    if (!draftResult.success || !draftResult.message) {
      return draftResult;
    }

    const refinedResult = await refineCommitMessage(draftResult.message);

    if (refinedResult.success && refinedResult.message) {
      return refinedResult;
    }

    return draftResult;
  }

  parseCommitMessage(llmOutput: string): CommitMessage {
    return parseCommitMessage(llmOutput);
  }

  displayCommitMessage(message: CommitMessage, model?: string): void {
    output.header('Generated Commit Message');
    if (model) {
      output.dim(`Model: ${model}`);
      console.log();
    }
    console.log(chalk.cyan(message.header));

    if (message.body) {
      console.log();
      console.log(chalk.dim(message.body));
    }

    output.divider();
  }

  async copyCommitMessage(message: CommitMessage): Promise<void> {
    const fullMessage = message.body ? `${message.header}\n\n${message.body}` : message.header;
    await copyToClipboard(fullMessage);
  }
}
