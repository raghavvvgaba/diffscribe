import { OpenRouter } from '@openrouter/sdk';
import { getOpenRouterConfig, COMMIT_MESSAGE_MODELS } from './config.js';

export interface CommitMessageGenerationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function selectModel(): Promise<string> {
  const { select } = await import('@inquirer/prompts');

  const choices = COMMIT_MESSAGE_MODELS.map(model => ({
    name: `${model.name} - ${model.description} (${model.pricing})`,
    value: model.id
  }));

  return await select({
    message: 'Select AI model for commit message generation:',
    choices,
    default: getOpenRouterConfig().model
  });
}

export async function generateCommitMessageWithLLM(
  diff: string,
  style: 'concise' | 'detailed',
  customPrompt?: string
): Promise<CommitMessageGenerationResult> {
  try {
    const config = getOpenRouterConfig();
    const openRouter = new OpenRouter({
      apiKey: config.apiKey
    });

    const styleInstruction = style === 'concise'
      ? 'Return ONLY a single-line commit message in Conventional Commits format: <type>(<scope>): <description>'
      : 'Return a commit message in Conventional Commits format with:\n- Header: <type>(<scope>): <description>\n- Body: 2-3 bullet points explaining what was changed and why';

    const systemPrompt = `You are an expert developer who writes perfect Conventional Commits.
Your task is to analyze git diffs and generate clear, meaningful commit messages.

Rules:
- Use valid Conventional Commit types: feat, fix, docs, style, refactor, test, chore, perf
- Scope should be the affected module or component (e.g., auth, api, ui, db)
- Description must be in imperative mood (e.g., "add" not "added" or "adds")
- Keep header under 72 characters
- No period at the end of header
- Focus on WHAT and WHY, not HOW
${customPrompt ? `\nAdditional context: ${customPrompt}` : ''}`;

    const result = openRouter.callModel({
      model: config.model,
      instructions: systemPrompt,
      input: [
        {
          role: 'user',
          content: `${styleInstruction}\n\nGit Diff:\n\`\`\`diff\n${diff}\n\`\`\``
        }
      ],
      temperature: 0.3,
      maxOutputTokens: 500
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
      message: message.trim()
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
