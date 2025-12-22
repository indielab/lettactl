import { BlockManager } from '../../src/lib/block-manager';
import { LettaClientWrapper } from '../../src/lib/letta-client';

jest.mock('../../src/lib/letta-client');
const MockedLettaClient = LettaClientWrapper as jest.MockedClass<typeof LettaClientWrapper>;

describe('BlockManager', () => {
  let blockManager: BlockManager;
  let mockClient: jest.Mocked<LettaClientWrapper>;

  beforeEach(() => {
    mockClient = new MockedLettaClient() as jest.Mocked<LettaClientWrapper>;
    blockManager = new BlockManager(mockClient);
    jest.clearAllMocks();
  });

  describe('generateContentHash', () => {
    it('should generate consistent hashes for same content', () => {
      const hash1 = (blockManager as any).generateContentHash('test content');
      const hash2 = (blockManager as any).generateContentHash('test content');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = (blockManager as any).generateContentHash('content A');
      const hash2 = (blockManager as any).generateContentHash('content B');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('parseVersionFromLabel', () => {
    it('should extract version from versioned label', () => {
      const result = (blockManager as any).parseVersionFromLabel('my-block__v__20241210-abc123');
      expect(result).toBe('20241210-abc123');
    });

    it('should return initial for non-versioned label', () => {
      const result = (blockManager as any).parseVersionFromLabel('simple-block');
      expect(result).toBe('initial');
    });
  });

  describe('getBlockKey', () => {
    it('should prefix shared blocks', () => {
      const result = (blockManager as any).getBlockKey('my-block', true);
      expect(result).toBe('shared:my-block');
    });

    it('should not prefix non-shared blocks', () => {
      const result = (blockManager as any).getBlockKey('my-block', false);
      expect(result).toBe('my-block');
    });

    it('should strip version suffix from label', () => {
      const result = (blockManager as any).getBlockKey('my-block__v__20241210-abc', false);
      expect(result).toBe('my-block');
    });
  });

  describe('validateUserVersion', () => {
    it('should lowercase and sanitize version string', () => {
      const result = (blockManager as any).validateUserVersion('My Version 1.0');
      expect(result).toBe('my-version-1.0');
    });

    it('should replace invalid characters with dashes', () => {
      const result = (blockManager as any).validateUserVersion('v1@#$%test');
      expect(result).toBe('v1----test');
    });

    it('should trim whitespace', () => {
      const result = (blockManager as any).validateUserVersion('  v1  ');
      expect(result).toBe('v1');
    });
  });

  describe('createVersionedLabel', () => {
    it('should create versioned label', () => {
      const result = (blockManager as any).createVersionedLabel('my-block', 'v1', false);
      expect(result).toBe('my-block__v__v1');
    });

    it('should return base name for initial version on first creation', () => {
      const result = (blockManager as any).createVersionedLabel('my-block', 'initial', true);
      expect(result).toBe('my-block');
    });

    it('should include version even for initial if not first version', () => {
      const result = (blockManager as any).createVersionedLabel('my-block', 'initial', false);
      expect(result).toBe('my-block__v__initial');
    });
  });

  describe('generateTimestampVersion', () => {
    it('should generate version in YYYYMMDD-hash format', () => {
      const hash = (blockManager as any).generateContentHash('test');
      const result = (blockManager as any).generateTimestampVersion(hash);
      expect(result).toMatch(/^\d{8}-[a-f0-9]{8}$/);
    });

    it('should use first 8 chars of hash', () => {
      const hash = 'abcdef1234567890';
      const result = (blockManager as any).generateTimestampVersion(hash);
      expect(result).toContain('-abcdef12');
    });
  });

  describe('getOrCreateSharedBlock', () => {
    beforeEach(async () => {
      mockClient.listBlocks.mockResolvedValue([] as any);
      await blockManager.loadExistingBlocks();
    });

    it('should create new block with no version suffix on first creation', async () => {
      mockClient.createBlock.mockResolvedValue({ id: 'block-123' } as any);

      await blockManager.getOrCreateSharedBlock({
        name: 'test-block',
        description: 'Test',
        limit: 1000,
        value: 'content'
      });

      expect(mockClient.createBlock).toHaveBeenCalledWith({
        label: 'test-block',
        description: 'Test',
        value: 'content',
        limit: 1000
      });
    });
  });
});
