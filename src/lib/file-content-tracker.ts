import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileContentMap {
  [filePath: string]: string; // filePath -> content hash
}

/**
 * Centralized file content tracking for change detection across tools, folders, and memory blocks
 */
export class FileContentTracker {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Generates a content hash for a single file
   */
  generateFileContentHash(filePath: string): string {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath} for hashing:`, (error as Error).message);
      return crypto.createHash('sha256').update(`file-not-found:${filePath}`).digest('hex').substring(0, 16);
    }
  }

  /**
   * Generates content hashes for multiple files
   */
  generateFileContentHashes(filePaths: string[]): FileContentMap {
    const contentHashes: FileContentMap = {};
    
    for (const filePath of filePaths) {
      contentHashes[filePath] = this.generateFileContentHash(filePath);
    }
    
    return contentHashes;
  }

  /**
   * Generates content hashes for tool source files
   */
  generateToolSourceHashes(toolNames: string[]): FileContentMap {
    const toolHashes: FileContentMap = {};
    
    for (const toolName of toolNames) {
      // Skip built-in tools that don't have source files
      if (['archival_memory_insert', 'archival_memory_search'].includes(toolName)) {
        continue;
      }
      
      const toolPath = path.join('tools', `${toolName}.py`);
      toolHashes[toolName] = this.generateFileContentHash(toolPath);
    }
    
    return toolHashes;
  }

  /**
   * Generates content hashes for memory block files
   */
  generateMemoryBlockFileHashes(memoryBlocks: Array<{
    name: string;
    from_file?: string;
    value?: string;
  }>): FileContentMap {
    const blockHashes: FileContentMap = {};
    
    for (const block of memoryBlocks) {
      if (block.from_file) {
        // Memory block loads content from file
        blockHashes[block.name] = this.generateFileContentHash(block.from_file);
      } else if (block.value) {
        // Memory block has inline value - hash it directly
        blockHashes[block.name] = crypto.createHash('sha256').update(block.value).digest('hex').substring(0, 16);
      }
    }
    
    return blockHashes;
  }

  /**
   * Generates content hashes for folder files (grouped by folder)
   */
  generateFolderFileHashes(folderConfigs: Array<{
    name: string; 
    files: string[];
  }>): Map<string, FileContentMap> {
    const folderHashes = new Map<string, FileContentMap>();
    
    for (const folder of folderConfigs) {
      const fileHashes = this.generateFileContentHashes(folder.files);
      folderHashes.set(folder.name, fileHashes);
    }
    
    return folderHashes;
  }

  /**
   * Checks if a file exists
   */
  fileExists(filePath: string): boolean {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }
}