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
