#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { GitHelper } from './lib/git.js';
import { output } from './lib/output.js';
import { promptCommitStyle, promptAction, promptContinueRegeneration } from './cli/prompts.js';
import type { CommitStyle, CommitMessage } from './types.js';

const program = new Command()
  .name('diffscribe')
  .description('AI-powered commit message generator')
  .version('1.0.0');

async function generateMockCommitMessage(style: CommitStyle, diff: string): Promise<CommitMessage> {
  const hasTest = diff.includes('test') || diff.includes('spec');
  const hasFix = diff.includes('fix') || diff.includes('bug');
  const hasFeature = diff.includes('add') || diff.includes('new');

  let type = 'chore';
  let description = 'update code';

  if (hasTest) {
    type = 'test';
    description = 'add test coverage';
  } else if (hasFix) {
    type = 'fix';
    description = 'fix bugs';
  } else if (hasFeature) {
    type = 'feat';
    description = 'add new feature';
  }

  const header = `${type}(): ${description}`;

  if (style === 'detailed') {
    return {
      header,
      body: '- update implementation\n- improve code quality'
    };
  }

  return { header };
}

function displayCommitMessage(message: CommitMessage): void {
  output.header('Generated Commit Message');
  console.log(chalk.cyan(message.header));

  if (message.body) {
    console.log();
    console.log(chalk.dim(message.body));
  }

  output.divider();
}

async function main() {
  console.log(chalk.cyan.bold('diffscribe — AI-powered commit message generator\n'));
  output.info('Starting...\n');

  const git = new GitHelper();

  if (!(await git.isInGitRepo())) {
    output.error('Not a Git repository.');
    output.dim('Run diffscribe inside a Git project.');
    process.exit(1);
  }

  const diffResult = await git.getStagedDiff();

  if (!diffResult.success || !diffResult.diff) {
    output.error(diffResult.error || 'No staged changes found.');
    output.dim('Stage files using `git add` before running diffscribe.');
    process.exit(1);
  }

  output.success(`Found staged changes (${diffResult.diff.split('\n').length} lines)`);

  const style = await promptCommitStyle();
  output.info(`Selected style: ${style}\n`);

  let shouldContinue = true;
  let attempt = 0;

  while (shouldContinue) {
    attempt++;
    output.dim(`Generating commit message (attempt ${attempt})...`);

    const message = await generateMockCommitMessage(style, diffResult.diff);
    displayCommitMessage(message);

    const action = await promptAction();

    if (action === 'accept') {
      try {
        const fullMessage = message.body ? `${message.header}\n\n${message.body}` : message.header;
        await clipboardy.write(fullMessage);
        output.success('Commit message copied to clipboard!');
        output.info('Run `git commit` and paste the message.');
        process.exit(0);
      } catch (error) {
        output.error('Failed to copy to clipboard');
        console.log(chalk.cyan(message.header));
        if (message.body) {
          console.log();
          console.log(chalk.dim(message.body));
        }
        process.exit(1);
      }
    } else if (action === 'reject') {
      output.info('Cancelled.');
      process.exit(0);
    } else if (action === 'regenerate') {
      shouldContinue = await promptContinueRegeneration();
      if (!shouldContinue) {
        output.info('Cancelled.');
        process.exit(0);
      }
    }
  }
}

program.action(() => {
  main().catch((error) => {
    output.error(error.message);
    process.exit(1);
  });
});

program.parse(process.argv);
