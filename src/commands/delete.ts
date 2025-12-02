import { LettaClientWrapper } from '../lib/letta-client';
import { AgentResolver } from '../lib/agent-resolver';
import { ResourceClassifier } from '../lib/resource-classifier';
import { validateResourceType, validateRequired } from '../lib/validators';
import { withErrorHandling } from '../lib/error-handler';
import { normalizeResponse } from '../lib/response-normalizer';

async function deleteCommandImpl(resource: string, name: string, options?: { force?: boolean }) {
  validateResourceType(resource, ['agent', 'agents']);
  validateRequired(name, 'Agent name', 'lettactl delete agent <name>');

  const client = new LettaClientWrapper();
  const resolver = new AgentResolver(client);
  const classifier = new ResourceClassifier(client);
  
  // Find agent by name
  const { agent, allAgents } = await resolver.findAgentByName(name);
    
    if (!options?.force) {
      console.log(`This will permanently delete agent: ${name} (${agent.id})`);
      console.log('Use --force to confirm deletion');
      process.exit(1);
    }
    
    console.log(`Deleting agent: ${name}...`);
    
    // Get agent details to find attached folders and blocks
    const agentDetails = await resolver.getAgentWithDetails(agent.id);
    
    // Delete attached folders if they're not shared
    const folders = (agentDetails as any).folders;
    if (folders) {
      console.log(`Checking attached folders...`);
      for (const folder of folders) {
        // Check if folder is shared or used by other agents
        const isShared = classifier.isSharedFolder(folder);
        const usedByOthers = await classifier.isFolderUsedByOtherAgents(folder.id, agent.id, allAgents);
        
        if (isShared) {
          console.log(`Keeping shared folder: ${folder.name || folder.id}`);
        } else if (!usedByOthers) {
          console.log(`Deleting agent-specific folder: ${folder.name || folder.id}`);
          try {
            await client.deleteFolder(folder.id);
            console.log(`Folder deleted`);
          } catch (error: any) {
            console.warn(`Could not delete folder: ${error.message}`);
          }
        } else {
          console.log(`Keeping folder used by other agents: ${folder.name || folder.id}`);
        }
      }
    }
    
    // Delete the agent
    await client.deleteAgent(agent.id);
    console.log(`Agent ${name} deleted successfully`);
    
    // Clean up orphaned memory blocks
    console.log(`Cleaning up memory blocks...`);
    try {
      const blocks = await client.listBlocks();
      const blockList = normalizeResponse(blocks);
      const agentSpecificBlocks = classifier.getAgentSpecificBlocks(blockList, name);
      
      for (const block of agentSpecificBlocks) {
        // Check if this block is still attached to any remaining agents
        const blockInUse = await classifier.isBlockUsedByOtherAgents(block.id, agent.id, allAgents);
        
        if (!blockInUse) {
          console.log(`Deleting orphaned block: ${block.label}`);
          try {
            await client.deleteBlock(block.id);
            console.log(`Block deleted`);
          } catch (error: any) {
            console.warn(`Could not delete block: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      console.warn(`Could not clean up blocks: ${error.message}`);
    }
    
    console.log(`Agent ${name} and associated resources deleted successfully`);
}

export default withErrorHandling('Delete command', deleteCommandImpl);