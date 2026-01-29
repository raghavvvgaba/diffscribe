import { select, confirm } from '@inquirer/prompts';
import type { CommitStyle } from '../types.js';

export async function promptCommitStyle(): Promise<CommitStyle> {
  const choices = [
    { name: 'Concise  — single-line, clean history', value: 'concise' as CommitStyle },
    { name: 'Detailed — header + body with context', value: 'detailed' as CommitStyle }
  ];

  return await select({
    message: 'Choose commit message style:',
    choices
  }) as CommitStyle;
}

export async function promptAction(): Promise<'accept' | 'regenerate' | 'reject'> {
  const choices = [
    { name: 'Accept & copy to clipboard', value: 'accept' },
    { name: 'Regenerate', value: 'regenerate' },
    { name: 'Reject & exit', value: 'reject' }
  ];

  return await select({
    message: 'What would you like to do?',
    choices
  }) as 'accept' | 'regenerate' | 'reject';
}

export async function promptContinueRegeneration(): Promise<boolean> {
  return await confirm({
    message: 'Continue regenerating?',
    default: true
  });
}
