import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  siteUrl?: string;
  siteName?: string;
}

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const COMMIT_MESSAGE_MODELS = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast, affordable, great for commit messages',
    pricing: '~$0.15/1M tokens'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Premium quality, higher cost',
    pricing: '~$2.50/1M tokens'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'Excellent coding capabilities, very affordable',
    pricing: '~$0.14/1M tokens'
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (Free)',
    description: 'Free model, good enough for simple commits',
    pricing: 'FREE'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Best quality, higher cost',
    pricing: '~$3.00/1M tokens'
  }
] as const;

export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY environment variable is not set.\n' +
      'Get your API key from: https://openrouter.ai/keys\n' +
      'Set it with: export OPENROUTER_API_KEY=your-key-here'
    );
  }

  return {
    apiKey,
    model: process.env.DIFFSCRIBE_MODEL || DEFAULT_MODEL,
    siteUrl: 'https://github.com/yourusername/diffscribe',
    siteName: 'diffscribe'
  };
}
