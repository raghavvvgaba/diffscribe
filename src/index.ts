#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { GitHelper } from './git.js';
import { CommitService } from './service.js';
import { promptCommitStyle, promptAction, promptContinueRegeneration } from './ui.js';
import { getOpenRouterConfig, DRAFT_MODEL_PRIMARY, DRAFT_MODEL_BACKUP, REFINEMENT_MODEL, CommitMessage, CommitStyle } from './config.js';

const program = new Command()
  .name('diffscribe')
  .description('AI-powered commit message generator')
  .version('1.0.0')
  .option('--mock', 'Use mock generation instead of LLM (for testing)');

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

async function main() {
  const options = program.opts();
  const useMock = options.mock;

  console.log(chalk.cyan.bold('diffscribe — AI-powered commit message generator\n'));
  console.log(chalk.blue('ℹ Starting...\n'));

  if (!useMock) {
    try {
      getOpenRouterConfig();
      console.log(chalk.dim(`Draft model: ${DRAFT_MODEL_PRIMARY} (backup: ${DRAFT_MODEL_BACKUP})`));
      console.log(chalk.dim(`Refinement model: ${REFINEMENT_MODEL}\n`));
    } catch (error: any) {
      console.error(`${chalk.bold.red('✖')} ${error.message}`);
      console.log(chalk.dim('To use mock mode for testing, run: diffscribe --mock'));
      process.exit(1);
    }
  } else {
    console.log(chalk.dim('Running in mock mode (no API calls)\n'));
  }

  const git = new GitHelper();

  if (!(await git.isInGitRepo())) {
    console.error(`${chalk.bold.red('✖')} Not a Git repository.`);
    console.log(chalk.dim('Run diffscribe inside a Git project.'));
    process.exit(1);
  }

  const diffResult = await git.getStagedDiff();

  if (!diffResult.success || !diffResult.diff) {
    console.error(`${chalk.bold.red('✖')} ${diffResult.error || 'No staged changes found.'}`);
    console.log(chalk.dim('Stage files using `git add` before running diffscribe.'));
    process.exit(1);
  }

  console.log(`${chalk.bold.green('✓')} Found staged changes (${diffResult.diff.split('\n').length} lines)`);

  const style = await promptCommitStyle();
  console.log(chalk.blue(`ℹ Selected style: ${style}\n`));

  let shouldContinue = true;
  let attempt = 0;

  const service = new CommitService();

  while (shouldContinue) {
    attempt++;
    console.log(chalk.dim(`Generating commit message (attempt ${attempt})...`));

    let message: CommitMessage;

    if (useMock) {
      message = await generateMockCommitMessage(style, diffResult.diff);
      service.displayCommitMessage(message);
    } else {
      const result = await service.generateCommitMessageWithLLM(diffResult.diff, style);

      if (!result.success || !result.message) {
        console.error(`${chalk.bold.red('✖')} ${result.error || 'Failed to generate commit message'}`);
        process.exit(1);
      }

      message = service.parseCommitMessage(result.message);
      service.displayCommitMessage(message, result.model);
    }

    const action = await promptAction();

    if (action === 'accept') {
      await service.copyCommitMessage(message);
      console.log(chalk.blue('ℹ Run `git commit` and paste the message.'));
      process.exit(0);
    } else if (action === 'reject') {
      console.log(chalk.blue('ℹ Cancelled.'));
      process.exit(0);
    } else if (action === 'regenerate') {
      shouldContinue = await promptContinueRegeneration();
      if (!shouldContinue) {
        console.log(chalk.blue('ℹ Cancelled.'));
        process.exit(0);
      }
    }
  }
}

program.action(() => {
  main().catch((error) => {
    console.error(`${chalk.bold.red('✖')} ${error.message}`);
    process.exit(1);
  });
});

program.parse(process.argv);
