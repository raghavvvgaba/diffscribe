import chalk from 'chalk';

export const output = {
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
