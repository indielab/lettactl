import { AgentManager } from '../../src/lib/agent-manager';
import { LettaClientWrapper } from '../../src/lib/letta-client';

jest.mock('../../src/lib/letta-client');
const MockedLettaClient = LettaClientWrapper as jest.MockedClass<typeof LettaClientWrapper>;

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let mockClient: jest.Mocked<LettaClientWrapper>;

  beforeEach(() => {
    mockClient = new MockedLettaClient() as jest.Mocked<LettaClientWrapper>;
    agentManager = new AgentManager(mockClient);
    jest.clearAllMocks();
  });

  describe('generateContentHash', () => {
    it('should generate consistent hashes for same content', () => {
      const hash1 = (agentManager as any).generateContentHash('test content');
      const hash2 = (agentManager as any).generateContentHash('test content');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = (agentManager as any).generateContentHash('content A');
      const hash2 = (agentManager as any).generateContentHash('content B');
      expect(hash1).not.toBe(hash2);
    });

    it('should return 16 character hex string', () => {
      const hash = (agentManager as any).generateContentHash('test');
      expect(hash).toMatch(/^[a-f0-9]{16}$/);
    });
  });

  describe('parseVersionFromName', () => {
    it('should parse versioned agent name', () => {
      const result = (agentManager as any).parseVersionFromName('my-agent__v__20241210-abc123');
      expect(result.baseName).toBe('my-agent');
      expect(result.version).toBe('20241210-abc123');
    });

    it('should handle non-versioned agent name', () => {
      const result = (agentManager as any).parseVersionFromName('simple-agent');
      expect(result.baseName).toBe('simple-agent');
      expect(result.version).toBeNull();
    });

    it('should handle complex base names with hyphens', () => {
      const result = (agentManager as any).parseVersionFromName('my-complex-agent-name__v__v1');
      expect(result.baseName).toBe('my-complex-agent-name');
      expect(result.version).toBe('v1');
    });
  });

  describe('generateAgentConfigHashes', () => {
    it('should generate different hashes for different system prompts', () => {
      const config1 = { systemPrompt: 'Prompt A', tools: [] };
      const config2 = { systemPrompt: 'Prompt B', tools: [] };

      const hashes1 = (agentManager as any).generateAgentConfigHashes(config1);
      const hashes2 = (agentManager as any).generateAgentConfigHashes(config2);

      expect(hashes1.systemPrompt).not.toBe(hashes2.systemPrompt);
      expect(hashes1.overall).not.toBe(hashes2.overall);
    });

    it('should generate different hashes for different tools', () => {
      const config1 = { systemPrompt: 'Same', tools: ['tool-a'] };
      const config2 = { systemPrompt: 'Same', tools: ['tool-b'] };

      const hashes1 = (agentManager as any).generateAgentConfigHashes(config1);
      const hashes2 = (agentManager as any).generateAgentConfigHashes(config2);

      expect(hashes1.tools).not.toBe(hashes2.tools);
      expect(hashes1.systemPrompt).toBe(hashes2.systemPrompt);
    });

    it('should include tool source hashes in computation', () => {
      const config1 = { systemPrompt: 'Same', tools: ['my-tool'], toolSourceHashes: { 'my-tool': 'hash1' } };
      const config2 = { systemPrompt: 'Same', tools: ['my-tool'], toolSourceHashes: { 'my-tool': 'hash2' } };

      const hashes1 = (agentManager as any).generateAgentConfigHashes(config1);
      const hashes2 = (agentManager as any).generateAgentConfigHashes(config2);

      expect(hashes1.tools).not.toBe(hashes2.tools);
    });

    it('should generate different hashes for different memory blocks', () => {
      const config1 = { systemPrompt: 'Same', tools: [], memoryBlocks: [{ name: 'block', description: 'd', limit: 100, value: 'v1' }] };
      const config2 = { systemPrompt: 'Same', tools: [], memoryBlocks: [{ name: 'block', description: 'd', limit: 100, value: 'v2' }] };

      const hashes1 = (agentManager as any).generateAgentConfigHashes(config1);
      const hashes2 = (agentManager as any).generateAgentConfigHashes(config2);

      expect(hashes1.memoryBlocks).not.toBe(hashes2.memoryBlocks);
    });
  });

  describe('getConfigChanges', () => {
    it('should detect system prompt change', () => {
      const existing = {
        id: 'agent-1',
        name: 'test-agent',
        baseName: 'test-agent',
        version: 'v1',
        lastUpdated: '2024-01-01',
        configHashes: (agentManager as any).generateAgentConfigHashes({ systemPrompt: 'Old prompt', tools: [] })
      };

      const newConfig = { systemPrompt: 'New prompt', tools: [] };
      const result = agentManager.getConfigChanges(existing, newConfig);

      expect(result.hasChanges).toBe(true);
      expect(result.changedComponents).toContain('systemPrompt');
    });

    it('should detect no changes when config identical', () => {
      const config = { systemPrompt: 'Same prompt', tools: ['tool1'] };
      const existing = {
        id: 'agent-1',
        name: 'test-agent',
        baseName: 'test-agent',
        version: 'v1',
        lastUpdated: '2024-01-01',
        configHashes: (agentManager as any).generateAgentConfigHashes(config)
      };

      const result = agentManager.getConfigChanges(existing, config);

      expect(result.hasChanges).toBe(false);
      expect(result.changedComponents).toEqual([]);
    });

    it('should detect tool changes', () => {
      const existing = {
        id: 'agent-1',
        name: 'test-agent',
        baseName: 'test-agent',
        version: 'v1',
        lastUpdated: '2024-01-01',
        configHashes: (agentManager as any).generateAgentConfigHashes({ systemPrompt: 'p', tools: ['old-tool'] })
      };

      const newConfig = { systemPrompt: 'p', tools: ['new-tool'] };
      const result = agentManager.getConfigChanges(existing, newConfig);

      expect(result.hasChanges).toBe(true);
      expect(result.changedComponents).toContain('tools');
    });
  });

  describe('getOrCreateAgentName', () => {
    beforeEach(async () => {
      mockClient.listAgents.mockResolvedValue([] as any);
      await agentManager.loadExistingAgents();
    });

    it('should create new agent when none exists', async () => {
      const result = await agentManager.getOrCreateAgentName(
        'new-agent',
        { systemPrompt: 'Test', tools: [] }
      );

      expect(result.agentName).toBe('new-agent');
      expect(result.shouldCreate).toBe(true);
      expect(result.existingAgent).toBeUndefined();
    });

    it('should return existing agent for updates', async () => {
      mockClient.listAgents.mockResolvedValue([
        { id: 'agent-123', name: 'test-agent', system: 'Old prompt' }
      ] as any);
      await agentManager.loadExistingAgents();

      const result = await agentManager.getOrCreateAgentName(
        'test-agent',
        { systemPrompt: 'New prompt', tools: [] }
      );

      expect(result.agentName).toBe('test-agent');
      expect(result.shouldCreate).toBe(false);
      expect(result.existingAgent?.id).toBe('agent-123');
    });
  });
});
