import { LettaClientWrapper } from './letta-client';
import { normalizeResponse } from './response-normalizer';

export class AgentResolver {
  private client: LettaClientWrapper;

  constructor(client: LettaClientWrapper) {
    this.client = client;
  }

  async findAgentByName(name: string): Promise<{ agent: any; allAgents: any[] }> {
    const agents = await this.client.listAgents();
    const agentList = normalizeResponse(agents);
    const agent = agentList.find((a: any) => a.name === name);
    
    if (!agent) {
      throw new Error(`Agent "${name}" not found`);
    }
    
    return { agent, allAgents: agentList };
  }

  async getAllAgents(): Promise<any[]> {
    const agents = await this.client.listAgents();
    return normalizeResponse(agents);
  }

  async getAgentWithDetails(agentId: string): Promise<any> {
    return await this.client.getAgent(agentId);
  }
}