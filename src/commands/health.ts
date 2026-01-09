import { LettaClientWrapper } from '../lib/letta-client';

export async function healthCommand(_options: {}, command: any) {
  const verbose = command.parent?.opts().verbose || false;
  const baseUrl = process.env.LETTA_BASE_URL;

  console.log('Letta Server Health Check');
  console.log('==========================\n');

  // Check environment
  if (!baseUrl) {
    console.log('[FAIL] LETTA_BASE_URL not set');
    process.exit(1);
  }
  console.log(`Server URL: ${baseUrl}`);

  // Check connectivity
  try {
    const response = await fetch(`${baseUrl}/v1/health/`);

    if (!response.ok) {
      console.log(`[FAIL] Server returned ${response.status}`);
      process.exit(1);
    }

    const health = await response.json() as { status: string; version: string };

    console.log(`Status:     ${health.status === 'ok' ? '[OK]' : '[FAIL] ' + health.status}`);
    console.log(`Version:    ${health.version}`);

    if (verbose) {
      // Additional checks in verbose mode
      console.log('\nDetailed Checks:');

      // Check agents endpoint
      try {
        const client = new LettaClientWrapper();
        const agents = await client.listAgents();
        const agentCount = Array.isArray(agents) ? agents.length : 0;
        console.log(`  Agents:   [OK] ${agentCount} found`);
      } catch (e: any) {
        console.log(`  Agents:   [FAIL] ${e.message}`);
      }

      // Check tools endpoint
      try {
        const client = new LettaClientWrapper();
        const tools = await client.listTools();
        const toolCount = Array.isArray(tools) ? tools.length : 0;
        console.log(`  Tools:    [OK] ${toolCount} found`);
      } catch (e: any) {
        console.log(`  Tools:    [FAIL] ${e.message}`);
      }

      // Check API key status
      if (process.env.LETTA_API_KEY) {
        console.log(`  API Key:  [OK] configured`);
      } else {
        console.log(`  API Key:  [--] not set (ok for self-hosted)`);
      }
    }

    console.log('\nLetta server is healthy');

  } catch (error: any) {
    const msg = error.cause?.code || error.code || error.message;
    if (msg === 'ECONNREFUSED') {
      console.log(`[FAIL] Connection refused - is Letta server running at ${baseUrl}?`);
    } else if (msg === 'ENOTFOUND') {
      console.log(`[FAIL] Host not found - check LETTA_BASE_URL`);
    } else {
      console.log(`[FAIL] Cannot connect to ${baseUrl}`);
    }
    process.exit(1);
  }
}
