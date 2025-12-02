import Table from 'cli-table3';

export class OutputFormatter {
  /**
   * Formats output based on the specified format
   */
  static formatOutput(data: any, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'yaml':
        // TODO: Implement YAML formatting
        return 'YAML output not yet implemented';
      
      default:
        return ''; // Default handling should be done by caller
    }
  }

  /**
   * Creates a table for agent listing
   */
  static createAgentTable(agents: any[]): string {
    const table = new Table({
      head: ['NAME', 'ID'],
      colWidths: [30, 50]
    });

    for (const agent of agents) {
      table.push([
        agent.name || 'Unknown',
        agent.id || 'Unknown'
      ]);
    }

    return table.toString();
  }

  /**
   * Handles JSON output if requested, returns true if handled
   */
  static handleJsonOutput(data: any, format?: string): boolean {
    if (format === 'json') {
      console.log(JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  }
}