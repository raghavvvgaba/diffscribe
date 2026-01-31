// Git operations and repository management
import { execa } from 'execa';
import type { GitResult } from './config.js';

export class GitHelper {
  private cwd?: string;

  constructor(cwd?: string) {
    this.cwd = cwd;
  }

  async isInGitRepo(): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--is-inside-work-tree'], {
        cwd: this.cwd,
        stdio: 'ignore'
      });
      return true;
    } catch {
      return false;
    }
  }

  async getStagedDiff(): Promise<GitResult> {
    try {
      const { stdout } = await execa('git', ['diff', '--cached'], {
        cwd: this.cwd,
        maxBuffer: 10 * 1024 * 1024
      });

      if (!stdout.trim()) {
        return {
          success: false,
          error: 'No staged changes found'
        };
      }

      return {
        success: true,
        diff: stdout
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get staged diff'
      };
    }
  }

  async hasStagedChanges(): Promise<boolean> {
    try {
      await execa('git', ['diff', '--cached', '--quiet', '--exit-code'], {
        cwd: this.cwd
      });
      return false;
    } catch (error: any) {
      return error.exitCode === 1;
    }
  }
}
