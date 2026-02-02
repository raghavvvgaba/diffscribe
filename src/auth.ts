import { password } from '@inquirer/prompts';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

export interface AuthConfig {
  openrouter: {
    apiKey: string;
  };
}

function getConfigPath(): string {
  return join(homedir(), '.diffscribe', 'config.json');
}

function ensureConfigDirExists(): void {
  const configDir = join(homedir(), '.diffscribe');
  
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

function writeConfigFile(config: AuthConfig): void {
  ensureConfigDirExists();
  const configPath = getConfigPath();
  
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function setApiKey(): Promise<void> {
  const apiKey = await password({
    message: 'Enter your OpenRouter API key:',
    mask: true,
    validate: (value: string) => {
      if (!value || value.trim() === '') {
        return 'API key cannot be empty';
      }
      return true;
    }
  });

  console.log();
  console.log(chalk.dim('Your OpenRouter API key will be stored locally at: ~/.diffscribe/config.json'));
  console.log();

  const config: AuthConfig = {
    openrouter: {
      apiKey: apiKey.trim()
    }
  };

  writeConfigFile(config);

  console.log(`${chalk.bold.green('✓')} API key saved successfully!`);
}