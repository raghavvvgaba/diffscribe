import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';

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

interface ConfigFile {
  openrouter?: {
    apiKey?: string;
  };
}

function getApiKeyFromConfig(): string | null {
  const configPath = join(homedir(), '.diffscribe', 'config.json');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config: ConfigFile = JSON.parse(configContent);

    return config.openrouter?.apiKey || null;
  } catch (error) {
    throw new Error(
      'Config file corrupted: ~/.diffscribe/config.json\n' +
      'Please remove or fix the file, then run: dcs auth set'
    );
  }
}

export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = getApiKeyFromConfig() || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'No OpenRouter API key found.\n' +
      'Run: dcs auth set to store your API key.'
    );
  }

  return {
    apiKey,
    siteUrl: 'https://github.com/yourusername/diffscribe',
    siteName: 'diffscribe'
  };
}
