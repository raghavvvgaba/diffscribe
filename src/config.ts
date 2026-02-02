import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env') });

export type CommitStyle = 'concise' | 'detailed';

export interface CommitMessage {
  header: string;
  body?: string;
}

export interface GitResult {
  success: boolean;
  diff?: string;
  error?: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  siteUrl?: string;
  siteName?: string;
}

export const DRAFT_MODEL_PRIMARY = 'google/gemini-2.5-flash-lite';

export const DRAFT_MODEL_BACKUP = 'mistralai/devstral-2512';

export const REFINEMENT_MODEL = 'google/gemini-2.5-flash';

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
    siteUrl: 'https://github.com/yourusername/diffscribe',
    siteName: 'diffscribe'
  };
}
