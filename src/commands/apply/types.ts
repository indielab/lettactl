export interface ApplyOptions {
  file: string;
  agent?: string;
  match?: string;
  /** Comma-separated tag filter — only agents whose `tags` array contains ALL
   *  listed tags get applied. Lets callers do incremental scoped deploys
   *  (e.g. `--scope tenant:<brand-id>`) without redeploying the whole fleet.
   *  See nouamanecodes/lettactl#380. */
  scope?: string;
  dryRun?: boolean;
  force?: boolean;
  root?: string;
  manifest?: string;
  skipFirstMessage?: boolean;
  canary?: boolean;
  canaryPrefix?: string;
  promote?: boolean;
  cleanup?: boolean;
  skipRecompile?: boolean;
  freshContext?: boolean;
  freshContextTags?: string;
  freshContextMatch?: string;
  compact?: boolean;
  compactTags?: string;
  compactMatch?: string;
  recalibrate?: boolean;
  recalibrateMessage?: string;
  recalibrateTags?: string;
  recalibrateMatch?: string;
  wait?: boolean;  // Commander maps --no-wait to wait=false
  waitForIdle?: boolean;  // Commander maps --no-wait-for-idle to waitForIdle=false
}

export interface DeployResult {
  agents: Record<string, string>;  // name → letta_agent_id
  created: string[];
  updated: string[];
  unchanged: string[];
}
