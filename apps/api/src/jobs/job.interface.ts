export interface Job {
  readonly name: string;
  readonly cron: string;
  run(): Promise<void>;
}
