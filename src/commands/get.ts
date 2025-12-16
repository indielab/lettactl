import { LettaClientWrapper } from '../lib/letta-client';
import { AgentResolver } from '../lib/agent-resolver';
import { OutputFormatter } from '../lib/output-formatter';
import { validateResourceType } from '../lib/validators';
import { withErrorHandling } from '../lib/error-handler';
import { createSpinner, getSpinnerEnabled } from '../lib/spinner';

const SUPPORTED_RESOURCES = ['agents', 'blocks', 'tools', 'folders'];

interface GetOptions {
  output?: string;
  agent?: string;
}

async function getCommandImpl(resource: string, _name?: string, options?: GetOptions, command?: any) {
  validateResourceType(resource, SUPPORTED_RESOURCES);

  const client = new LettaClientWrapper();
  const resolver = new AgentResolver(client);
  const spinnerEnabled = getSpinnerEnabled(command);

  // If --agent flag is provided, resolve agent name to ID
  let agentId: string | undefined;
  if (options?.agent) {
    if (resource === 'agents') {
      console.log('Note: --agent flag is ignored for "get agents"');
    } else {
      const spinner = createSpinner(`Resolving agent ${options.agent}...`, spinnerEnabled).start();
      try {
        const { agent } = await resolver.findAgentByName(options.agent);
        agentId = agent.id;
        spinner.stop();
      } catch (error) {
        spinner.fail(`Agent "${options.agent}" not found`);
        throw error;
      }
    }
  }

  // Handle each resource type
  switch (resource) {
    case 'agents':
      await getAgents(resolver, options, spinnerEnabled);
      break;
    case 'blocks':
      await getBlocks(client, options, spinnerEnabled, agentId);
      break;
    case 'tools':
      await getTools(client, options, spinnerEnabled, agentId);
      break;
    case 'folders':
      await getFolders(client, options, spinnerEnabled, agentId);
      break;
  }
}

async function getAgents(
  resolver: AgentResolver,
  options?: { output?: string },
  spinnerEnabled?: boolean
) {
  const spinner = createSpinner('Loading agents...', spinnerEnabled).start();

  try {
    const agents = await resolver.getAllAgents();
    spinner.stop();

    if (OutputFormatter.handleJsonOutput(agents, options?.output)) {
      return;
    }

    if (options?.output === 'yaml') {
      console.log(OutputFormatter.formatOutput(agents, 'yaml'));
      return;
    }

    console.log(OutputFormatter.createAgentTable(agents));
  } catch (error) {
    spinner.fail('Failed to load agents');
    throw error;
  }
}

async function getBlocks(
  client: LettaClientWrapper,
  options?: { output?: string },
  spinnerEnabled?: boolean,
  agentId?: string
) {
  const label = agentId ? 'Loading agent blocks...' : 'Loading blocks...';
  const spinner = createSpinner(label, spinnerEnabled).start();

  try {
    let blockList: any[];
    if (agentId) {
      const blocks = await client.listAgentBlocks(agentId);
      blockList = Array.isArray(blocks) ? blocks : (blocks as any).items || [];
    } else {
      blockList = await client.listBlocks();
    }
    spinner.stop();

    if (OutputFormatter.handleJsonOutput(blockList, options?.output)) {
      return;
    }

    if (blockList.length === 0) {
      console.log(agentId ? 'No blocks attached to this agent' : 'No blocks found');
      return;
    }

    console.log(OutputFormatter.createBlockTable(blockList));
  } catch (error) {
    spinner.fail('Failed to load blocks');
    throw error;
  }
}

async function getTools(
  client: LettaClientWrapper,
  options?: { output?: string },
  spinnerEnabled?: boolean,
  agentId?: string
) {
  const label = agentId ? 'Loading agent tools...' : 'Loading tools...';
  const spinner = createSpinner(label, spinnerEnabled).start();

  try {
    let toolList: any[];
    if (agentId) {
      const tools = await client.listAgentTools(agentId);
      toolList = Array.isArray(tools) ? tools : (tools as any).items || [];
    } else {
      toolList = await client.listTools();
    }
    spinner.stop();

    if (OutputFormatter.handleJsonOutput(toolList, options?.output)) {
      return;
    }

    if (toolList.length === 0) {
      console.log(agentId ? 'No tools attached to this agent' : 'No tools found');
      return;
    }

    console.log(OutputFormatter.createToolTable(toolList));
  } catch (error) {
    spinner.fail('Failed to load tools');
    throw error;
  }
}

async function getFolders(
  client: LettaClientWrapper,
  options?: { output?: string },
  spinnerEnabled?: boolean,
  agentId?: string
) {
  const label = agentId ? 'Loading agent folders...' : 'Loading folders...';
  const spinner = createSpinner(label, spinnerEnabled).start();

  try {
    let folderList: any[];
    if (agentId) {
      const folders = await client.listAgentFolders(agentId);
      folderList = Array.isArray(folders) ? folders : (folders as any).items || [];
    } else {
      folderList = await client.listFolders();
    }
    spinner.stop();

    if (OutputFormatter.handleJsonOutput(folderList, options?.output)) {
      return;
    }

    if (folderList.length === 0) {
      console.log(agentId ? 'No folders attached to this agent' : 'No folders found');
      return;
    }

    console.log(OutputFormatter.createFolderTable(folderList));
  } catch (error) {
    spinner.fail('Failed to load folders');
    throw error;
  }
}

export default withErrorHandling('Get command', getCommandImpl);