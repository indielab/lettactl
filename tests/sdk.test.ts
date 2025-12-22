// Mock problematic ESM dependencies
jest.mock('ora', () => () => ({
  start: jest.fn().mockReturnThis(),
  stop: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn(),
  text: ''
}));

import { LettaCtl, FleetConfigBuilder } from '../src/sdk';
import { FleetConfig } from '../src/types/fleet-config';

describe('FleetConfigBuilder', () => {
  let builder: FleetConfigBuilder;

  beforeEach(() => {
    builder = new FleetConfigBuilder();
  });

  describe('build', () => {
    it('should create empty fleet config', () => {
      const config = builder.build();
      expect(config.agents).toEqual([]);
      expect(config.shared_blocks).toBeUndefined();
    });
  });

  describe('addAgent', () => {
    it('should add agent to config', () => {
      const agent = {
        name: 'test-agent',
        description: 'Test',
        llm_config: { model: 'test', context_window: 2000 },
        system_prompt: { value: 'prompt' }
      };

      const config = builder.addAgent(agent).build();

      expect(config.agents).toHaveLength(1);
      expect(config.agents[0].name).toBe('test-agent');
    });

    it('should support chaining multiple agents', () => {
      const config = builder
        .addAgent({ name: 'agent-1', description: 'A1', llm_config: { model: 'm', context_window: 1000 }, system_prompt: { value: 'p' } })
        .addAgent({ name: 'agent-2', description: 'A2', llm_config: { model: 'm', context_window: 1000 }, system_prompt: { value: 'p' } })
        .build();

      expect(config.agents).toHaveLength(2);
      expect(config.agents[0].name).toBe('agent-1');
      expect(config.agents[1].name).toBe('agent-2');
    });
  });

  describe('addSharedBlock', () => {
    it('should add shared block to config', () => {
      const config = builder
        .addSharedBlock({ name: 'shared-1', description: 'Shared block', limit: 5000, value: 'content' })
        .build();

      expect(config.shared_blocks).toHaveLength(1);
      expect(config.shared_blocks![0].name).toBe('shared-1');
    });

    it('should support multiple shared blocks', () => {
      const config = builder
        .addSharedBlock({ name: 'shared-1', description: 'S1', limit: 1000 })
        .addSharedBlock({ name: 'shared-2', description: 'S2', limit: 2000 })
        .build();

      expect(config.shared_blocks).toHaveLength(2);
    });
  });

  describe('complex configurations', () => {
    it('should build config with agents and shared blocks', () => {
      const config = builder
        .addSharedBlock({ name: 'guidelines', description: 'Guidelines', limit: 5000, value: 'rules' })
        .addAgent({
          name: 'my-agent',
          description: 'Agent with shared block',
          llm_config: { model: 'test', context_window: 8000 },
          system_prompt: { value: 'You are helpful' },
          shared_blocks: ['guidelines'],
          tools: ['tool1', 'tool2']
        })
        .build();

      expect(config.shared_blocks).toHaveLength(1);
      expect(config.agents).toHaveLength(1);
      expect(config.agents[0].shared_blocks).toContain('guidelines');
      expect(config.agents[0].tools).toEqual(['tool1', 'tool2']);
    });
  });
});

describe('LettaCtl', () => {
  describe('validateFleet', () => {
    let lettactl: LettaCtl;

    beforeEach(() => {
      lettactl = new LettaCtl();
    });

    it('should return true for valid config', () => {
      const config: FleetConfig = {
        agents: [{
          name: 'valid-agent',
          description: 'Valid agent',
          llm_config: { model: 'test', context_window: 2000 },
          system_prompt: { value: 'prompt' }
        }]
      };

      expect(lettactl.validateFleet(config)).toBe(true);
    });

    it('should return false for config without agents', () => {
      const config = {} as FleetConfig;
      expect(lettactl.validateFleet(config)).toBe(false);
    });

    it('should return false for agent without name', () => {
      const config: FleetConfig = {
        agents: [{
          description: 'No name',
          llm_config: { model: 'test', context_window: 2000 },
          system_prompt: { value: 'prompt' }
        } as any]
      };

      expect(lettactl.validateFleet(config)).toBe(false);
    });
  });

  describe('createFleetConfig', () => {
    it('should return FleetConfigBuilder instance', () => {
      const lettactl = new LettaCtl();
      const builder = lettactl.createFleetConfig();

      expect(builder).toBeInstanceOf(FleetConfigBuilder);
    });
  });
});
