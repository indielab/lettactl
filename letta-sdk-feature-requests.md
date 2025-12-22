# Letta SDK Feature Request

## Feature: Add `connected_to_agents_count_*` filters to ToolListParams and FolderListParams

### Current State
- **Blocks**: Has `connected_to_agents_count_eq/gt/lt` filters (works great, server-side)
- **Tools/Folders**: No equivalent filters (requires client-side computation)

### What client-side computation looks like
```
1. Fetch all tools/folders         → 1 API call
2. Fetch all agents                → 1 API call
3. For EACH agent, get its tools   → N API calls (where N = agent count)
4. Count and filter locally
```

For a fleet with 20 agents: **22 API calls minimum**

### Honest Assessment

**Is it a deal breaker?** No. The feature works, just slower.

**How much slower?**
- 10 agents: ~3-5 seconds
- 20 agents: ~5-10 seconds
- 50 agents: ~15-25 seconds

**How often is this used?**
- `--shared` and `--orphaned` are fleet analysis commands
- Run occasionally during cleanup/debugging, not constantly
- Maybe once a day or less

**Would API support make it faster?**
- Yes, O(1) vs O(n) - single API call vs N+2 calls
- But marginal real-world impact for typical fleet sizes

### My Recommendation

**Don't submit this feature request.**

Reasons:
1. The client-side solution works fine for reasonable fleet sizes (< 50 agents)
2. This is an occasional operation, not a hot path
3. The Letta team is shipping core features - this is polish
4. If you ever have 100+ agents, revisit this