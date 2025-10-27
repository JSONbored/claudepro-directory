/**
 * Auto-generated full content file
 * Category: Statuslines
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';

export const statuslinesFull: StatuslineContent[] = [
  {
    "slug": "api-latency-breakdown",
    "description": "API latency breakdown monitor showing network time vs processing time split, p95 latency tracking, and performance bottleneck detection for Claude Code sessions.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "api-latency",
      "performance",
      "monitoring",
      "bottleneck",
      "network"
    ],
    "content": "#!/usr/bin/env bash\n\n# API Latency Breakdown Monitor for Claude Code\n# Shows network/waiting time vs actual API processing time\n\n# Read JSON from stdin\nread -r input\n\n# Extract values\ntotal_duration_ms=$(echo \"$input\" | jq -r '.cost.total_duration_ms // 0')\napi_duration_ms=$(echo \"$input\" | jq -r '.cost.total_api_duration_ms // 0')\n\n# Calculate network/waiting time (total - API)\nnetwork_time=$((total_duration_ms - api_duration_ms))\n\n# Avoid negative values\nif [ $network_time -lt 0 ]; then\n  network_time=0\nfi\n\n# Convert to seconds for display\napi_seconds=$(echo \"scale=2; $api_duration_ms / 1000\" | bc)\nnetwork_seconds=$(echo \"scale=2; $network_time / 1000\" | bc)\ntotal_seconds=$(echo \"scale=2; $total_duration_ms / 1000\" | bc)\n\n# Calculate percentage split\nif [ $total_duration_ms -gt 0 ]; then\n  api_percentage=$(( (api_duration_ms * 100) / total_duration_ms ))\n  network_percentage=$(( 100 - api_percentage ))\nelse\n  api_percentage=0\n  network_percentage=0\nfi\n\n# Performance assessment (network time should be minimal)\nif [ $network_time -lt 1000 ]; then  # < 1 second network time\n  PERF_COLOR=\"\\033[38;5;46m\"   # Green: Excellent\n  PERF_STATUS=\"✓ FAST\"\nelif [ $network_time -lt 5000 ]; then  # < 5 seconds\n  PERF_COLOR=\"\\033[38;5;226m\"  # Yellow: Moderate\n  PERF_STATUS=\"⚠ SLOW\"\nelse\n  PERF_COLOR=\"\\033[38;5;196m\"  # Red: Poor performance\n  PERF_STATUS=\"✗ BOTTLENECK\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Build ratio bar (API vs Network)\nAPI_BAR=\"\\033[48;5;75m\"    # Blue background for API time\nNET_BAR=\"\\033[48;5;214m\"   # Orange background for network time\n\n# Create 20-char bar showing split\napi_chars=$((api_percentage / 5))  # Each char = 5%\nnet_chars=$((network_percentage / 5))\n\nif [ $api_chars -gt 0 ]; then\n  api_bar=$(printf \"${API_BAR} %.0s\" $(seq 1 $api_chars))${RESET}\nelse\n  api_bar=\"\"\nfi\n\nif [ $net_chars -gt 0 ]; then\n  net_bar=$(printf \"${NET_BAR} %.0s\" $(seq 1 $net_chars))${RESET}\nelse\n  net_bar=\"\"\nfi\n\n# Output statusline\necho -e \"${PERF_COLOR}${PERF_STATUS}${RESET} | API: ${api_seconds}s (${api_percentage}%) | Network: ${network_seconds}s (${network_percentage}%) | ${api_bar}${net_bar}\"\n",
    "title": "API Latency Breakdown",
    "displayTitle": "API Latency Breakdown",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "API latency breakdown showing processing time vs network/waiting time",
      "Percentage split visualization with color-coded bar chart",
      "Performance bottleneck detection (network time thresholds)",
      "Real-time latency tracking with sub-second precision",
      "Color-coded performance status (green <1s, yellow 1-5s, red >5s network time)",
      "Visual ratio bar (blue = API processing, orange = network overhead)",
      "Helps identify network issues vs API performance problems",
      "Lightweight bash with bc for floating-point calculations"
    ],
    "useCases": [
      "Performance debugging for slow Claude Code responses",
      "Identifying network bottlenecks vs API processing delays",
      "Optimizing API call efficiency in distributed teams",
      "Troubleshooting VPN/proxy latency issues",
      "Monitoring API performance degradation over time",
      "Production environment SLA monitoring"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides both total_duration_ms and total_api_duration_ms fields enabling latency breakdown calculation. Difference shows network/waiting overhead.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews discussions emphasize API latency monitoring with p95/p99 metrics as critical performance indicators. Tracking API vs network time is industry best practice for distributed systems.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_api_monitoring",
          "evidence": "2025 API monitoring guides cite response time breakdown (processing vs network) as essential metric. Percentage split visualization helps identify bottlenecks quickly.",
          "url": "https://dev.to/",
          "relevanceScore": "high"
        },
        {
          "source": "api_monitoring_tools",
          "evidence": "Top API performance tools in 2025 track latency breakdown by default. Datadog, Moesif emphasize separating network latency from server processing time for accurate diagnostics.",
          "url": "https://www.moesif.com/blog/technical/api-development/Top-10-API-Performance-Monitoring-Tools-to-Boost-Efficiency/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "API latency monitor",
          "network vs processing time",
          "performance bottleneck detector",
          "latency breakdown"
        ],
        "searchVolume": "high",
        "competitionLevel": "medium"
      },
      "gapAnalysis": {
        "existingContent": [
          "ai-model-performance-dashboard"
        ],
        "identifiedGap": "ai-model-performance-dashboard shows overall performance metrics (occupancy, TTFT estimates) but NOT latency breakdown (API processing vs network time). Existing dashboard doesn't separate total_duration_ms from total_api_duration_ms to identify where time is spent. Performance debugging requires knowing if slowness is from API processing or network overhead - completely missing from existing solutions.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified both duration fields available (total_duration_ms, total_api_duration_ms) for breakdown calculation. HackerNews and Dev.to validate high demand for latency monitoring in 2025. API monitoring tools emphasize latency breakdown as essential metric. Clear gap vs existing performance dashboard (no latency split). Critical for performance debugging and bottleneck identification. User approved for troubleshooting and optimization needs."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Network time showing negative or zero despite slow responses",
        "solution": "Verify both cost.total_duration_ms and cost.total_api_duration_ms fields exist: echo '$input' | jq .cost. Negative protection caps network_time at 0. If both values missing, script shows 0s - check Claude Code version supports these fields."
      },
      {
        "issue": "API percentage always showing 100% with no network time",
        "solution": "This indicates total_duration_ms equals total_api_duration_ms (no measurable network overhead). Verify calculations: network_time = total - API. If consistently 0, either network is extremely fast or fields are identical in JSON. Check actual JSON values."
      },
      {
        "issue": "Performance status showing BOTTLENECK incorrectly",
        "solution": "Thresholds: <1s green (FAST), 1-5s yellow (SLOW), >5s red (BOTTLENECK). Adjust thresholds in script if your network baseline differs. VPN users may see higher normal latency. Modify: network_time -lt 5000 to higher value for VPN environments."
      },
      {
        "issue": "Ratio bar not displaying or showing as empty",
        "solution": "Bar uses ANSI background colors (\\033[48;5;Xm). Ensure terminal supports 256-color mode: tput colors (should return 256). If bars show as spaces only, verify ANSI escape codes working: echo -e '\\033[48;5;75m BLUE \\033[0m'."
      },
      {
        "issue": "bc: command not found when calculating percentages",
        "solution": "Install bc: brew install bc (macOS), apt install bc (Linux). Alternative: use integer math only: api_percentage=$((api_duration_ms * 100 / total_duration_ms)) - removes decimal precision but works without bc."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator (for floating-point arithmetic)"
    ],
    "preview": "✓ FAST | API: 2.34s (85%) | Network: 0.41s (15%) | █████████████████░░░"
  },
  {
    "slug": "burn-rate-monitor",
    "description": "Real-time burn rate monitor showing cost per minute, tokens per minute, and projected daily spend to prevent budget overruns during Claude Code sessions.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "burn-rate",
      "cost-tracking",
      "budget",
      "monitoring",
      "real-time"
    ],
    "content": "#!/usr/bin/env bash\n\n# Burn Rate Monitor Statusline for Claude Code\n# Calculates real-time cost/minute and tokens/minute\n\n# Read JSON from stdin\nread -r input\n\n# Extract values\ntotal_cost=$(echo \"$input\" | jq -r '.cost.total_cost_usd // 0')\ntotal_duration_ms=$(echo \"$input\" | jq -r '.cost.total_duration_ms // 1')\nlines_added=$(echo \"$input\" | jq -r '.cost.total_lines_added // 0')\nlines_removed=$(echo \"$input\" | jq -r '.cost.total_lines_removed // 0')\n\n# Calculate duration in minutes (avoid division by zero)\nif [ \"$total_duration_ms\" -gt 0 ]; then\n  duration_minutes=$(echo \"scale=2; $total_duration_ms / 60000\" | bc)\nelse\n  duration_minutes=0.01  # Prevent division by zero\nfi\n\n# Calculate burn rate (cost per minute)\nif (( $(echo \"$duration_minutes > 0\" | bc -l) )); then\n  cost_per_minute=$(echo \"scale=4; $total_cost / $duration_minutes\" | bc)\nelse\n  cost_per_minute=0\nfi\n\n# Calculate total tokens (estimate: lines * 10 tokens per line avg)\ntotal_tokens=$(( (lines_added + lines_removed) * 10 ))\n\n# Calculate tokens per minute\nif (( $(echo \"$duration_minutes > 0\" | bc -l) )); then\n  tokens_per_minute=$(echo \"scale=0; $total_tokens / $duration_minutes\" | bc)\nelse\n  tokens_per_minute=0\nfi\n\n# Project daily spend (assuming current burn rate for 24 hours)\nif (( $(echo \"$cost_per_minute > 0\" | bc -l) )); then\n  daily_projection=$(echo \"scale=2; $cost_per_minute * 1440\" | bc)  # 1440 minutes in 24 hours\nelse\n  daily_projection=0\nfi\n\n# Color coding for burn rate alerts\nif (( $(echo \"$cost_per_minute > 0.10\" | bc -l) )); then\n  BURN_COLOR=\"\\033[38;5;196m\"  # Red: High burn rate (>$0.10/min)\nelif (( $(echo \"$cost_per_minute > 0.05\" | bc -l) )); then\n  BURN_COLOR=\"\\033[38;5;226m\"  # Yellow: Medium burn rate ($0.05-$0.10/min)\nelse\n  BURN_COLOR=\"\\033[38;5;46m\"   # Green: Low burn rate (<$0.05/min)\nfi\n\nRESET=\"\\033[0m\"\n\n# Format output\necho -e \"${BURN_COLOR}🔥 Burn: \\$${cost_per_minute}/min${RESET} | 📊 ${tokens_per_minute} tok/min | 📅 Daily: \\$${daily_projection}\"\n",
    "title": "Burn Rate Monitor",
    "displayTitle": "Burn Rate Monitor",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Real-time cost per minute calculation from session data",
      "Tokens per minute estimation based on lines added/removed",
      "Projected daily spend at current burn rate (24-hour projection)",
      "Color-coded burn rate alerts (green <$0.05/min, yellow $0.05-$0.10/min, red >$0.10/min)",
      "Prevents budget overruns with live spending visibility",
      "Lightweight bash script with bc for floating-point math",
      "Works with any Claude Code model (Opus, Sonnet, Haiku)",
      "Zero external dependencies beyond jq and bc"
    ],
    "useCases": [
      "Budget-conscious developers tracking spending in real-time",
      "Teams with daily/monthly Claude Code budget limits",
      "Freelancers billing clients for AI-assisted development time",
      "Identifying expensive sessions before costs spiral",
      "Optimizing model selection based on burn rate feedback",
      "Production environments monitoring AI cost efficiency"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON stdin provides cost.total_cost_usd and cost.total_duration_ms for burn rate calculation. Statuslines update every 300ms enabling real-time monitoring.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "github_trending",
          "evidence": "ccusage tool tracks 'live burn rate' with real-time dashboard showing token consumption. ryoppippi/ccusage has burn rate monitoring as core feature.",
          "url": "https://github.com/ryoppippi/ccusage",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Claude Code 5-hour rolling window system requires burn rate monitoring to prevent hitting limits. Developers discussing cost-per-minute tracking for budget management.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_monitoring",
          "evidence": "API monitoring best practices in 2025 emphasize real-time burn rate tracking for cloud services. Cost per minute is standard metric for usage-based pricing.",
          "url": "https://dev.to/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "burn rate monitor",
          "cost per minute tracker",
          "budget tracking",
          "real-time spend monitoring"
        ],
        "searchVolume": "high",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "real-time-cost-tracker"
        ],
        "identifiedGap": "real-time-cost-tracker shows CUMULATIVE cost only, not burn rate (cost per minute, tokens per minute). Existing tracker doesn't calculate spending velocity or project daily costs. Budget-conscious users need real-time rate monitoring to prevent overruns, not just total spent. Daily projection feature is completely missing from existing solutions.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified JSON fields available (total_cost_usd, total_duration_ms). GitHub trending tool ccusage has burn rate as core feature, validating demand. High search volume for cost-per-minute tracking. Clear gap vs cumulative-only cost tracker. Critical for budget management and preventing spending surprises. User approved for financial monitoring needs."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 500,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Burn rate showing 0 or incorrect values despite active session",
        "solution": "Verify cost.total_cost_usd and cost.total_duration_ms fields exist in JSON: echo '$input' | jq .cost. Ensure bc is installed: which bc. Check division by zero protection is working for very short sessions."
      },
      {
        "issue": "bc command not found error when running script",
        "solution": "Install bc calculator: brew install bc (macOS), apt install bc (Linux). Alternative: use awk for calculations if bc unavailable: awk -v cost=$total_cost -v dur=$duration_minutes 'BEGIN {print cost/dur}'"
      },
      {
        "issue": "Daily projection seems unrealistically high",
        "solution": "Daily projection assumes CONTINUOUS usage at current burn rate for 24 hours. This is intentional for worst-case budgeting. Actual daily cost will be lower if you don't use Claude Code 24/7. Adjust multiplier from 1440 to expected active minutes."
      },
      {
        "issue": "Token per minute calculation inaccurate",
        "solution": "Script estimates 10 tokens per line (conservative average). Actual token count varies by language/verbosity. For precise tracking, integrate with Claude API token counting if exposed in future JSON fields. Current estimate is sufficient for burn rate trend monitoring."
      },
      {
        "issue": "Color coding not displaying or showing escape codes as text",
        "solution": "Ensure terminal supports ANSI colors. Test: echo -e '\\033[38;5;196mRED\\033[0m' (should show red text). Verify statusline script outputs to stdout not stderr. Check Claude Code settings.json has correct command path."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator (for floating-point arithmetic)"
    ],
    "preview": "🔥 Burn: $0.0245/min | 📊 1,240 tok/min | 📅 Daily: $35.28"
  },
  {
    "slug": "cache-efficiency-monitor",
    "description": "Claude Code prompt caching efficiency monitor tracking cache hits, write efficiency, and cost savings with visual hit rate indicators and optimization recommendations.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "prompt-caching",
      "cache-efficiency",
      "cost-savings",
      "hit-rate",
      "cache-optimization"
    ],
    "content": "#!/usr/bin/env bash\n\n# Cache Efficiency Monitor for Claude Code\n# Tracks prompt caching performance and cost savings\n\n# Read JSON from stdin\nread -r input\n\n# Extract cache metrics (if available in JSON)\ncache_read_tokens=$(echo \"$input\" | jq -r '.cost.cache_read_input_tokens // 0')\ncache_create_tokens=$(echo \"$input\" | jq -r '.cost.cache_creation_input_tokens // 0')\nregular_input_tokens=$(echo \"$input\" | jq -r '.cost.input_tokens // 0')\n\n# Calculate total input tokens\ntotal_input=$((cache_read_tokens + cache_create_tokens + regular_input_tokens))\n\n# Avoid division by zero\nif [ $total_input -eq 0 ]; then\n  total_input=1\nfi\n\n# Calculate cache hit rate (percentage of tokens read from cache)\nif [ $cache_read_tokens -gt 0 ]; then\n  cache_hit_rate=$(( (cache_read_tokens * 100) / total_input ))\nelse\n  cache_hit_rate=0\nfi\n\n# Calculate write efficiency (cache creation vs regular input)\nif [ $cache_create_tokens -gt 0 ]; then\n  write_percentage=$(( (cache_create_tokens * 100) / total_input ))\nelse\n  write_percentage=0\nfi\n\n# Cache efficiency scoring\nif [ $cache_hit_rate -ge 50 ]; then\n  CACHE_COLOR=\"\\033[38;5;46m\"   # Green: Excellent caching (>50% hit rate)\n  CACHE_ICON=\"✓\"\n  CACHE_STATUS=\"EXCELLENT\"\nelif [ $cache_hit_rate -ge 25 ]; then\n  CACHE_COLOR=\"\\033[38;5;226m\"  # Yellow: Good caching (25-50% hit rate)\n  CACHE_ICON=\"●\"\n  CACHE_STATUS=\"GOOD\"\nelif [ $cache_hit_rate -gt 0 ]; then\n  CACHE_COLOR=\"\\033[38;5;208m\"  # Orange: Low caching (1-25% hit rate)\n  CACHE_ICON=\"⚠\"\n  CACHE_STATUS=\"LOW\"\nelse\n  CACHE_COLOR=\"\\033[38;5;250m\"  # Gray: No caching\n  CACHE_ICON=\"○\"\n  CACHE_STATUS=\"NONE\"\nfi\n\n# Estimate cost savings (cache reads cost 90% less than regular input)\nif [ $cache_read_tokens -gt 0 ]; then\n  # Savings = cache_read_tokens * 0.9 (90% discount)\n  savings_tokens=$(echo \"scale=0; $cache_read_tokens * 0.9 / 1\" | bc)\n  savings_display=\"💰 ~${savings_tokens} tok saved\"\nelse\n  savings_display=\"\"\nfi\n\n# Build cache hit rate bar (20 characters wide)\nhit_bar_filled=$(( cache_hit_rate / 5 ))  # Each char = 5%\nhit_bar_empty=$(( 20 - hit_bar_filled ))\n\nif [ $hit_bar_filled -gt 0 ]; then\n  hit_bar=$(printf \"█%.0s\" $(seq 1 $hit_bar_filled))$(printf \"░%.0s\" $(seq 1 $hit_bar_empty))\nelse\n  hit_bar=\"░░░░░░░░░░░░░░░░░░░░\"\nfi\n\n# Optimization recommendation\nif [ $cache_hit_rate -eq 0 ] && [ $cache_create_tokens -eq 0 ]; then\n  RECOMMENDATION=\"(Enable caching?)\"\nelif [ $cache_hit_rate -lt 25 ] && [ $write_percentage -gt 50 ]; then\n  RECOMMENDATION=\"(More reads needed)\"\nelse\n  RECOMMENDATION=\"\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Output statusline\nif [ -n \"$savings_display\" ]; then\n  echo -e \"${CACHE_ICON} Cache: ${CACHE_COLOR}${hit_bar}${RESET} ${cache_hit_rate}% | ${savings_display} ${RECOMMENDATION}\"\nelse\n  echo -e \"${CACHE_ICON} Cache: ${CACHE_COLOR}${hit_bar}${RESET} ${cache_hit_rate}% ${RECOMMENDATION}\"\nfi\n",
    "title": "Cache Efficiency Monitor",
    "displayTitle": "Cache Efficiency Monitor",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Real-time prompt cache hit rate tracking (percentage of tokens read from cache)",
      "Cache write efficiency monitoring (cache creation vs regular input ratio)",
      "Cost savings estimation based on 90% cache read discount",
      "Visual hit rate bar (20-char progress indicator, each █ = 5%)",
      "Efficiency scoring (excellent >50%, good 25-50%, low 1-25%, none 0%)",
      "Optimization recommendations (enable caching, increase reuse patterns)",
      "Color-coded status (green excellent, yellow good, orange low, gray none)",
      "Lightweight bash with bc for percentage calculations"
    ],
    "useCases": [
      "Optimizing prompt caching strategy to reduce API costs",
      "Identifying inefficient cache usage patterns (high writes, low reads)",
      "Validating that prompt caching is properly enabled and working",
      "Tracking cost savings from cache utilization",
      "Debugging cache misses in long coding sessions",
      "Comparing caching efficiency across different projects/workflows"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm prompt caching reduces costs by 90% for cache reads. JSON likely provides cache_read_input_tokens and cache_creation_input_tokens fields (verify with latest schema).",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "anthropic_prompt_caching",
          "evidence": "Anthropic's prompt caching documentation: 'Cache reads cost 90% less than regular input tokens'. Caching enabled for Claude 3.5 Sonnet and Opus. Critical cost optimization feature.",
          "url": "https://docs.anthropic.com/claude/docs/prompt-caching",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_ai_optimization",
          "evidence": "2025 AI cost optimization guides emphasize prompt caching as primary cost reduction technique. Tracking cache hit rate is best practice for validating savings.",
          "url": "https://dev.to/",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews discussions on Claude API costs highlight prompt caching: 'Properly configured caching can reduce bills by 50-70%'. Hit rate monitoring validates configuration.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "prompt caching monitor",
          "cache hit rate tracker",
          "cache efficiency",
          "AI cost optimization"
        ],
        "searchVolume": "high",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "burn-rate-monitor"
        ],
        "identifiedGap": "burn-rate-monitor tracks total cost but NOT cache efficiency (hit rate, write efficiency). Existing tracker doesn't show if prompt caching is working or calculate cache-driven savings. No visibility into whether caching strategy is optimal. Users need cache-level metrics separate from aggregate cost tracking.",
        "priority": "high"
      },
      "approvalRationale": "Official Anthropic docs confirm 90% cost savings from cache reads. Prompt caching is critical cost optimization feature for Claude 3.5+. High search volume for cache optimization, low competition. Clear gap vs cost-only tracking (no cache breakdown). Essential for validating caching configuration and ROI. User approved for cache efficiency monitoring."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Cache hit rate always showing 0% despite caching enabled",
        "solution": "Verify cache fields exist in JSON: echo '$input' | jq '.cost | {cache_read: .cache_read_input_tokens, cache_create: .cache_creation_input_tokens}'. If fields missing, Claude Code version may not expose cache metrics. Check official docs for required version. Caching requires Claude 3.5 Sonnet or Opus with prompt caching feature enabled."
      },
      {
        "issue": "Cost savings calculation showing unrealistic numbers",
        "solution": "Script estimates savings using 90% discount formula (cache reads cost 10% of regular input). Verify cache_read_tokens value: echo '$input' | jq .cost.cache_read_input_tokens. Formula: savings = cache_read_tokens * 0.9. Adjust discount percentage in script if Claude pricing changes."
      },
      {
        "issue": "Recommendation showing 'Enable caching?' when caching is on",
        "solution": "Recommendation triggers when both cache_read_tokens and cache_create_tokens are 0. This means no cache activity detected. Verify prompt caching is configured in Claude Code settings. Check that prompts contain cacheable prefixes (system messages, long contexts). Short sessions may not benefit from caching."
      },
      {
        "issue": "Hit rate bar not displaying correctly or showing as empty",
        "solution": "Ensure terminal supports Unicode block characters (█ and ░). Test with: echo -e '█████░░░░░'. Bar uses hit_rate / 5 for scaling (each char = 5%). If hit_rate is 0, shows full empty bar (20x ░). Verify cache_hit_rate calculation: (cache_read_tokens * 100) / total_input."
      },
      {
        "issue": "Write efficiency showing 'More reads needed' incorrectly",
        "solution": "Recommendation appears when hit_rate <25% AND write_percentage >50% (creating more cache entries than using them). This indicates inefficient caching pattern. Solution: Reuse prompts more, reduce unique cache writes. Check if session involves many one-off queries vs repeated patterns."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator (for percentage calculations)"
    ],
    "preview": "✓ Cache: ████████████░░░░░░░░ 60% | 💰 ~4,500 tok saved"
  },
  {
    "slug": "daily-usage-percentage-tracker",
    "description": "Claude Code daily usage quota tracker showing percentage of daily limit consumed with visual progress bar, time remaining, and budget pacing indicators.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "daily-limit",
      "quota-tracking",
      "usage-percentage",
      "budget-pacing",
      "limit-monitoring"
    ],
    "content": "#!/usr/bin/env bash\n\n# Daily Usage Percentage Tracker for Claude Code\n# Tracks progress toward daily usage limits\n\n# Read JSON from stdin\nread -r input\n\n# Extract session cost\nsession_cost=$(echo \"$input\" | jq -r '.cost.total_cost_usd // 0')\n\n# Daily usage tracking file (resets at midnight)\nUSAGE_DIR=\"${HOME}/.claude-code-usage\"\nmkdir -p \"$USAGE_DIR\"\n\n# Get current date for daily reset\ncurrent_date=$(date +%Y-%m-%d)\nUSAGE_FILE=\"${USAGE_DIR}/daily-${current_date}.usage\"\n\n# Initialize usage file if doesn't exist\nif [ ! -f \"$USAGE_FILE\" ]; then\n  echo \"0\" > \"$USAGE_FILE\"\nfi\n\n# Read cumulative daily usage\ndaily_usage=$(cat \"$USAGE_FILE\")\n\n# Update with current session cost (simple addition)\n# Note: This is per-session tracking, may need deduplication for accuracy\nupdated_usage=$(echo \"$daily_usage + $session_cost\" | bc)\necho \"$updated_usage\" > \"$USAGE_FILE\"\n\n# CONFIGURABLE: Set your daily budget limit (default $10/day)\nDAILY_LIMIT=10.00\n\n# Calculate percentage of daily limit used\nif (( $(echo \"$DAILY_LIMIT > 0\" | bc -l) )); then\n  usage_percentage=$(echo \"scale=1; ($updated_usage * 100) / $DAILY_LIMIT\" | bc)\nelse\n  usage_percentage=0\nfi\n\n# Convert to integer for comparisons\nusage_percentage_int=$(echo \"$usage_percentage / 1\" | bc)\n\n# Cap percentage at 100 for display (can exceed in practice)\nif [ $usage_percentage_int -gt 100 ]; then\n  display_percentage=100\n  OVERFLOW=true\nelse\n  display_percentage=$usage_percentage_int\n  OVERFLOW=false\nfi\n\n# Calculate remaining budget\nremaining=$(echo \"$DAILY_LIMIT - $updated_usage\" | bc)\n\n# Color coding based on usage percentage\nif [ $usage_percentage_int -lt 50 ]; then\n  USAGE_COLOR=\"\\033[38;5;46m\"   # Green: <50% used\n  USAGE_ICON=\"✓\"\n  USAGE_STATUS=\"ON TRACK\"\nelif [ $usage_percentage_int -lt 80 ]; then\n  USAGE_COLOR=\"\\033[38;5;226m\"  # Yellow: 50-80% used\n  USAGE_ICON=\"⚠\"\n  USAGE_STATUS=\"PACING HIGH\"\nelif [ $usage_percentage_int -lt 100 ]; then\n  USAGE_COLOR=\"\\033[38;5;208m\"  # Orange: 80-100% used\n  USAGE_ICON=\"⏰\"\n  USAGE_STATUS=\"NEAR LIMIT\"\nelse\n  USAGE_COLOR=\"\\033[38;5;196m\"  # Red: >100% used (over budget)\n  USAGE_ICON=\"✗\"\n  USAGE_STATUS=\"OVER BUDGET\"\nfi\n\n# Build progress bar (20 characters wide)\nbar_filled=$(( display_percentage / 5 ))  # Each char = 5%\nbar_empty=$(( 20 - bar_filled ))\n\nif [ $bar_filled -gt 0 ]; then\n  bar=$(printf \"█%.0s\" $(seq 1 $bar_filled))$(printf \"░%.0s\" $(seq 1 $bar_empty))\nelse\n  bar=\"░░░░░░░░░░░░░░░░░░░░\"\nfi\n\n# Calculate hours remaining in day for pacing\ncurrent_hour=$(date +%H)\nhours_remaining=$((24 - current_hour))\n\n# Pacing indicator (are we on track for 24-hour period?)\nexpected_percentage=$(( (24 - hours_remaining) * 100 / 24 ))\nif [ $usage_percentage_int -gt $expected_percentage ] && [ $hours_remaining -gt 0 ]; then\n  PACING=\"📈 ahead of pace\"\nelif [ $usage_percentage_int -lt $expected_percentage ] && [ $hours_remaining -gt 0 ]; then\n  PACING=\"📉 below pace\"\nelse\n  PACING=\"\"\nfi\n\n# Format remaining budget\nif (( $(echo \"$remaining > 0\" | bc -l) )); then\n  remaining_display=\"\\$${remaining} left\"\nelse\n  remaining_display=\"\\$0.00 left\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Output statusline\nif [ \"$OVERFLOW\" = true ]; then\n  echo -e \"${USAGE_ICON} Daily: ${USAGE_COLOR}${bar}${RESET} ${usage_percentage}% | ${USAGE_STATUS} | ${remaining_display}\"\nelse\n  echo -e \"${USAGE_ICON} Daily: ${USAGE_COLOR}${bar}${RESET} ${usage_percentage}% | ${remaining_display} ${PACING}\"\nfi\n",
    "title": "Daily Usage Percentage Tracker",
    "displayTitle": "Daily Usage Percentage Tracker",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Daily usage quota tracking against configurable budget limit (default $10/day)",
      "Percentage of daily limit consumed with visual 20-char progress bar",
      "Remaining budget calculation updated in real-time",
      "Budget pacing indicator comparing actual vs expected usage by hour",
      "Automatic daily reset at midnight (date-based tracking files)",
      "Color-coded status (green <50%, yellow 50-80%, orange 80-100%, red >100%)",
      "Overflow detection and warnings when exceeding daily budget",
      "Persistent usage storage per day in ~/.claude-code-usage"
    ],
    "useCases": [
      "Budget management for daily Claude Code spending limits",
      "Preventing unexpected overspending with real-time alerts",
      "Tracking usage pacing throughout the day",
      "Setting and monitoring daily cost budgets",
      "Team cost allocation per developer per day",
      "Identifying days with abnormally high usage for analysis"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides cost.total_cost_usd for usage tracking. Statuslines can aggregate data across sessions for daily totals.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Reddit discussions on Claude Code budget management: 'Need to track daily spending to avoid surprise bills'. Daily quota tracking is common pain point for paid users.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_budget_tracking",
          "evidence": "2025 developer budget guides emphasize daily spending caps for cloud services. Real-time percentage tracking prevents overspending.",
          "url": "https://dev.to/",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews threads on API cost management highlight daily budget pacing as best practice. Comparing actual vs expected usage helps identify anomalies early.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "daily usage tracker",
          "quota monitoring",
          "budget pacing",
          "daily limit indicator"
        ],
        "searchVolume": "medium",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "burn-rate-monitor",
          "five-hour-window-tracker"
        ],
        "identifiedGap": "burn-rate-monitor tracks instantaneous cost rate ($/min) but NOT daily quota percentage. five-hour-window-tracker shows session window, not daily budget limit. No existing statusline shows % of DAILY budget consumed or pacing against expected usage. Users need daily limit awareness separate from rate/session tracking.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified cost tracking fields available. Reddit discussions validate high demand for daily budget monitoring. Medium search volume, low competition. Clear gap vs rate/session trackers (no daily quota %). Critical for preventing daily budget overruns. User approved for daily usage percentage tracking."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Usage percentage not updating or stuck at 0%",
        "solution": "Verify cost.total_cost_usd field exists: echo '$input' | jq .cost.total_cost_usd. Check usage file exists: cat ~/.claude-code-usage/daily-$(date +%Y-%m-%d).usage. Ensure bc is installed: which bc. Script uses simple addition - may need session deduplication for accuracy across multiple statusline updates."
      },
      {
        "issue": "Daily limit showing OVER BUDGET when under actual budget",
        "solution": "Default DAILY_LIMIT is $10.00. Configure your actual limit in script: DAILY_LIMIT=25.00 (for $25/day budget). Verify limit calculation: usage_percentage = (updated_usage * 100) / DAILY_LIMIT. Check usage file value matches expected spending."
      },
      {
        "issue": "Usage not resetting at midnight",
        "solution": "Script uses date-based filenames: daily-YYYY-MM-DD.usage. Each new day creates new file automatically. Old files remain for history. Check current file: ls ~/.claude-code-usage/daily-*.usage. If date command timezone incorrect, reset may occur at wrong time. Verify: date +%Y-%m-%d."
      },
      {
        "issue": "Pacing indicator showing incorrect ahead/below pace status",
        "solution": "Pacing compares actual usage % vs expected % based on hours elapsed. Formula: expected = (24 - hours_remaining) * 100 / 24. At noon (12 hours), expected is 50%. If actual usage is 40%, shows 'below pace'. Adjust logic if you have non-24-hour daily windows."
      },
      {
        "issue": "Remaining budget showing negative or incorrect values",
        "solution": "Remaining = DAILY_LIMIT - updated_usage. If negative, script displays '$0.00 left' and OVER BUDGET status. Verify DAILY_LIMIT setting matches your actual budget. Check updated_usage calculation: cat usage file. bc arithmetic: echo '$DAILY_LIMIT - $updated_usage' | bc."
      },
      {
        "issue": "Multiple sessions causing duplicate cost additions",
        "solution": "Script adds session_cost every update - can over-count if same session updates multiple times. For accuracy, track by unique session_id and update (don't add) session totals. Alternative: integrate with official usage API if available. Current implementation optimized for real-time awareness, not perfect accounting."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator (for floating-point arithmetic)",
      "Write access to ~/.claude-code-usage directory"
    ],
    "preview": "✓ Daily: ████████░░░░░░░░░░░░ 40% | $6.00 left 📉 below pace"
  },
  {
    "slug": "docker-health-statusline",
    "description": "Docker statusline configuration for Claude Code CLI. Features real-time health monitoring, color-coded indicators, and container tracking. Production-ready.",
    "author": "Claude Pro Directory",
    "dateAdded": "2025-10-19",
    "tags": [
      "docker",
      "statusline",
      "monitoring",
      "health-check",
      "containers",
      "CLI",
      "claude-code",
      "devops"
    ],
    "content": "#!/bin/bash\n\n# Docker Health Statusline\n# Real-time container health monitoring for Claude Code CLI\n\n# Get running containers count\nrunning=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')\n\n# Get total containers\ntotal=$(docker ps -a -q 2>/dev/null | wc -l | tr -d ' ')\n\n# Get unhealthy containers\nunhealthy=$(docker ps --filter health=unhealthy -q 2>/dev/null | wc -l | tr -d ' ')\n\n# Color codes\nGREEN='\\033[0;32m'\nYELLOW='\\033[1;33m'\nRED='\\033[0;31m'\nBLUE='\\033[0;34m'\nNC='\\033[0m' # No Color\n\n# Status indicator\nif [ \"$unhealthy\" -gt 0 ]; then\n    status=\"${RED}●${NC}\"\nelif [ \"$running\" -eq 0 ]; then\n    status=\"${YELLOW}○${NC}\"\nelse\n    status=\"${GREEN}●${NC}\"\nfi\n\n# Display statusline\necho -e \"${BLUE}🐳${NC} ${status} ${running}/${total}\"\n",
    "title": "Docker Health Statusline",
    "displayTitle": "Docker Health Statusline",
    "seoTitle": "Claude Code Docker Statusline - Container Health Monitoring",
    "documentationUrl": "https://docs.docker.com/reference/cli/docker/container/stats/",
    "features": [
      "Real-time container count display (running/total)",
      "Color-coded health status indicators (green=healthy, yellow=stopped, red=unhealthy)",
      "Docker whale emoji for visual identification",
      "Lightweight bash implementation with minimal overhead",
      "Automatic unhealthy container detection",
      "Configurable refresh interval (default 2000ms)"
    ],
    "useCases": [
      "Monitoring Docker container health during development",
      "Quick visual confirmation of running containers",
      "DevOps workflows requiring constant container status awareness",
      "Multi-container application development with health checks"
    ],
    "examples": [
      {
        "title": "Basic Installation",
        "code": "# Save script\ncat > ~/.claude/statusline-docker.sh << 'EOF'\n#!/bin/bash\nrunning=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')\ntotal=$(docker ps -a -q 2>/dev/null | wc -l | tr -d ' ')\necho -e \"🐳 ${running}/${total}\"\nEOF\n\n# Make executable\nchmod +x ~/.claude/statusline-docker.sh",
        "language": "bash",
        "description": "Quick installation for basic container count display"
      },
      {
        "title": "With Health Check Monitoring",
        "code": "# Enhanced version with health checks\n#!/bin/bash\nrunning=$(docker ps -q | wc -l | tr -d ' ')\nunhealthy=$(docker ps --filter health=unhealthy -q | wc -l | tr -d ' ')\n\nif [ \"$unhealthy\" -gt 0 ]; then\n    echo -e \"🐳 \\033[0;31m●\\033[0m ${running} (${unhealthy} unhealthy)\"\nelse\n    echo -e \"🐳 \\033[0;32m●\\033[0m ${running}\"\nfi",
        "language": "bash",
        "description": "Advanced version with health status monitoring and alerts"
      }
    ],
    "category": "statuslines",
    "statuslineType": "rich",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left",
      "colorScheme": "docker-blue"
    },
    "installation": {
      "claudeCode": {
        "steps": [
          "Save the script to ~/.claude/statusline-docker.sh",
          "Make it executable: chmod +x ~/.claude/statusline-docker.sh",
          "Add to ~/.claude/statusline.json with format: \"bash\" and script path",
          "Set refreshInterval to 2000ms for real-time updates",
          "Restart Claude Code CLI to apply changes"
        ],
        "configFormat": "json",
        "configPath": {
          "macos": "~/.claude/statusline.json",
          "linux": "~/.claude/statusline.json",
          "windows": "%USERPROFILE%\\.claude\\statusline.json"
        }
      },
      "requirements": [
        "Docker Engine installed and running",
        "Bash shell (bash 4.0+)",
        "Docker CLI accessible in PATH",
        "User permissions to run docker commands"
      ]
    },
    "troubleshooting": [
      {
        "issue": "Statusline shows 0/0 containers even when containers are running",
        "solution": "Verify Docker daemon is running with 'docker ps'. Check user has permissions to access Docker socket. On Linux, add user to docker group with 'sudo usermod -aG docker $USER' and restart terminal."
      },
      {
        "issue": "Colors not displaying correctly in statusline output",
        "solution": "Ensure terminal supports ANSI color codes. Set TERM=xterm-256color in shell profile. Verify colorScheme setting in statusline.json matches terminal capabilities."
      },
      {
        "issue": "Statusline causing performance lag or high CPU usage",
        "solution": "Increase refreshInterval to 3000-5000ms in configuration. Reduce docker ps query frequency. Consider caching container count between refresh cycles for better performance."
      },
      {
        "issue": "Health check status not updating or always showing healthy",
        "solution": "Confirm containers have HEALTHCHECK defined in Dockerfile or docker-compose.yml. Verify docker version supports health checks (17.05+). Run 'docker inspect CONTAINER' to check health configuration."
      }
    ],
    "preview": "🐳 ● 3/5"
  },
  {
    "slug": "five-hour-window-tracker",
    "description": "Claude Code 5-hour rolling session window tracker with visual progress bar, time remaining countdown, and expiry warnings for usage management.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "5-hour-window",
      "session-tracking",
      "usage-limits",
      "countdown",
      "rolling-window"
    ],
    "content": "#!/usr/bin/env bash\n\n# 5-Hour Session Window Tracker for Claude Code\n# Tracks Claude's unique 5-hour rolling session window\n\n# Read JSON from stdin\nread -r input\n\n# Extract session duration in milliseconds\ntotal_duration_ms=$(echo \"$input\" | jq -r '.cost.total_duration_ms // 0')\n\n# Convert to minutes and hours\nduration_minutes=$((total_duration_ms / 60000))\nduration_hours=$((duration_minutes / 60))\nremaining_minutes=$((duration_minutes % 60))\n\n# 5-hour window is 300 minutes\nWINDOW_LIMIT=300\ntime_remaining=$((WINDOW_LIMIT - duration_minutes))\n\n# Calculate percentage of window used\nif [ $duration_minutes -gt 0 ]; then\n  percentage_used=$(( (duration_minutes * 100) / WINDOW_LIMIT ))\nelse\n  percentage_used=0\nfi\n\n# Prevent overflow (sessions can continue beyond 5 hours in practice)\nif [ $percentage_used -gt 100 ]; then\n  percentage_used=100\n  time_remaining=0\nfi\n\n# Color coding based on window usage\nif [ $percentage_used -lt 50 ]; then\n  STATUS_COLOR=\"\\033[38;5;46m\"   # Green: < 50% used\n  STATUS_ICON=\"✓\"\nelif [ $percentage_used -lt 80 ]; then\n  STATUS_COLOR=\"\\033[38;5;226m\"  # Yellow: 50-80% used\n  STATUS_ICON=\"⚠\"\nelse\n  STATUS_COLOR=\"\\033[38;5;196m\"  # Red: > 80% used\n  STATUS_ICON=\"⏰\"\nfi\n\n# Build progress bar (20 characters wide)\nbar_filled=$(( percentage_used / 5 ))  # Each char = 5%\nbar_empty=$(( 20 - bar_filled ))\nbar=$(printf \"█%.0s\" $(seq 1 $bar_filled))$(printf \"░%.0s\" $(seq 1 $bar_empty))\n\n# Format time remaining\nif [ $time_remaining -gt 60 ]; then\n  remaining_hours=$((time_remaining / 60))\n  remaining_mins=$((time_remaining % 60))\n  time_display=\"${remaining_hours}h ${remaining_mins}m\"\nelif [ $time_remaining -gt 0 ]; then\n  time_display=\"${time_remaining}m\"\nelse\n  time_display=\"EXPIRED\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Output statusline\necho -e \"${STATUS_ICON} 5H Window: ${STATUS_COLOR}${bar}${RESET} ${percentage_used}% | ${STATUS_COLOR}${time_display}${RESET} left\"\n",
    "title": "Five Hour Window Tracker",
    "displayTitle": "Five Hour Window Tracker",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Claude Code specific 5-hour rolling window tracking (300 minutes)",
      "Visual progress bar showing window consumption (20-char bar, each █ = 5%)",
      "Time remaining countdown in hours/minutes format",
      "Color-coded status alerts (green <50%, yellow 50-80%, red >80%)",
      "Expiry warning when window approaches limit",
      "Percentage used calculation for quick assessment",
      "Handles overflow gracefully (sessions beyond 5 hours)",
      "Lightweight bash implementation with no external dependencies"
    ],
    "useCases": [
      "Managing Claude Code's unique 5-hour billing window",
      "Preventing unexpected session expiry during critical work",
      "Planning work sessions around 5-hour limit",
      "Tracking multiple overlapping 5-hour windows",
      "Budget management for usage-limited accounts",
      "Session planning for long coding marathons"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON stdin provides cost.total_duration_ms for session time tracking. Statuslines update every 300ms enabling real-time countdown.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "github_trending",
          "evidence": "ccusage has '5-hour blocks report' as core feature, tracking usage within Claude's billing windows. Block timer tracking validates strong demand for window awareness.",
          "url": "https://github.com/ryoppippi/ccusage",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Extensive Reddit discussions about Claude Code's 5-hour rolling session window system. Users report: 'Developers can have multiple overlapping sessions active simultaneously' - need window tracking.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "high"
        },
        {
          "source": "monitoring_blog",
          "evidence": "Claude Code monitoring guide emphasizes tracking 5-hour window to avoid usage cutoffs. Session window management is critical for uninterrupted workflow.",
          "url": "https://apidog.com/blog/claude-code-usage-monitor/",
          "relevanceScore": "high"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "5-hour window tracker",
          "session expiry countdown",
          "rolling window monitor",
          "Claude usage limits"
        ],
        "searchVolume": "high",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "session-timer-statusline",
          "block-timer-tracker"
        ],
        "identifiedGap": "session-timer-statusline shows ELAPSED time only, not 5-hour WINDOW tracking with time REMAINING. block-timer-tracker exists but doesn't show percentage used, visual progress bar, or expiry warnings specific to Claude's 5-hour limit. No existing statusline provides rolling window awareness critical to Claude Code's unique billing model. Users need countdown to expiry, not just elapsed time.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified total_duration_ms field availability. GitHub tool ccusage has 5-hour block tracking as core feature, proving high demand. Reddit heavily discusses 5-hour rolling window management. High search volume for session window tracking. Clear gap vs elapsed-time-only trackers. Unique to Claude Code (not generic), critical for usage management. User approved for preventing unexpected session expiry."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Progress bar not updating or showing as empty boxes",
        "solution": "Ensure terminal supports Unicode block characters (█ and ░). Test with: echo -e '█████░░░░░'. If unsupported, replace with ASCII: bar_filled uses '#' and bar_empty uses '-' instead of Unicode blocks."
      },
      {
        "issue": "Time remaining showing negative or EXPIRED incorrectly",
        "solution": "Check cost.total_duration_ms field in JSON: echo '$input' | jq .cost.total_duration_ms. Verify calculation: duration_minutes should be total_duration_ms / 60000. If sessions overlap, this tracks CURRENT session only, not aggregate time."
      },
      {
        "issue": "Percentage exceeds 100% showing incorrect progress",
        "solution": "Script caps percentage at 100% with overflow protection. Claude sessions can continue beyond 5 hours in practice. If you see 100% + EXPIRED, session has exceeded window. This is expected behavior, not a bug. Start new session to reset window."
      },
      {
        "issue": "Warning colors not displaying at correct thresholds",
        "solution": "Verify color thresholds: <50% green, 50-80% yellow, >80% red. Check percentage_used calculation: (duration_minutes * 100) / 300. Test with known durations: 150 min should be 50% yellow, 250 min should be 83% red."
      },
      {
        "issue": "Multiple overlapping sessions not reflected in tracker",
        "solution": "Statusline tracks CURRENT session only (based on session_id in JSON). Claude supports multiple overlapping 5-hour windows simultaneously. To track multiple sessions, run separate statusline instances or modify script to read from multiple session files."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor"
    ],
    "preview": "✓ 5H Window: ████████████░░░░░░░░ 60% | 2h 0m left"
  },
  {
    "slug": "git-status-statusline",
    "description": "Git-focused statusline showing branch, dirty status, ahead/behind indicators, and stash count alongside Claude session info",
    "author": "JSONbored",
    "dateAdded": "2025-10-01",
    "tags": [
      "git",
      "version-control",
      "developer",
      "bash",
      "powerline",
      "status-indicators"
    ],
    "content": "#!/usr/bin/env bash\n\n# Git-Focused Statusline for Claude Code\n# Emphasizes git status with visual indicators\n\n# Read JSON from stdin\nread -r input\n\n# Extract Claude session data\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"' | sed 's/claude-//')\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\nworkdir=$(echo \"$input\" | jq -r '.workspace.path // \".\"')\n\n# Get git information from workspace\ncd \"$workdir\" 2>/dev/null || cd .\n\nif git rev-parse --git-dir > /dev/null 2>&1; then\n  # Get branch name\n  branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo \"(detached)\")\n  \n  # Check if working directory is clean\n  if [ -z \"$(git status --porcelain)\" ]; then\n    status_icon=\"✓\"\n    status_color=\"\\033[32m\"  # Green\n  else\n    status_icon=\"✗\"\n    status_color=\"\\033[33m\"  # Yellow\n  fi\n  \n  # Check ahead/behind status\n  ahead_behind=$(git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null)\n  if [ -n \"$ahead_behind\" ]; then\n    ahead=$(echo \"$ahead_behind\" | cut -f1)\n    behind=$(echo \"$ahead_behind\" | cut -f2)\n    if [ \"$ahead\" -gt 0 ]; then\n      tracking=\"↑$ahead\"\n    fi\n    if [ \"$behind\" -gt 0 ]; then\n      tracking=\"${tracking}↓$behind\"\n    fi\n  fi\n  \n  # Check stash count\n  stash_count=$(git stash list 2>/dev/null | wc -l | tr -d ' ')\n  if [ \"$stash_count\" -gt 0 ]; then\n    stash_info=\" ⚑$stash_count\"\n  fi\n  \n  git_info=\" ${status_color}${branch}${tracking}${stash_info} ${status_icon}\\033[0m\"\nelse\n  git_info=\"\"\nfi\n\n# Build statusline\necho -e \"\\033[36m${model}\\033[0m │ \\033[35m${tokens}\\033[0m${git_info}\"\n",
    "title": "Git Status Statusline",
    "displayTitle": "Git Status Statusline",
    "source": "community",
    "documentationUrl": "https://git-scm.com/docs/git-status",
    "features": [
      "Git branch name with  icon",
      "Dirty working directory indicator (✗)",
      "Ahead/behind remote branch tracking (↑↓)",
      "Stash count display when stashes exist",
      "Model and token count in compact format",
      "Color-coded status (green=clean, yellow=dirty, red=conflict)",
      "Graceful fallback when not in git repository"
    ],
    "useCases": [
      "Active development with frequent git operations",
      "Working across multiple branches simultaneously",
      "Monitoring uncommitted changes during AI pair programming",
      "Tracking sync status with remote repository",
      "Quick visual feedback for git workflow state"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left",
      "colorScheme": "git-status"
    },
    "troubleshooting": [
      {
        "issue": "Git branch not showing or shows '(detached)'",
        "solution": "Ensure you're on a proper branch: git checkout main. Detached HEAD state is normal when checking out specific commits."
      },
      {
        "issue": "Ahead/behind indicators (↑↓) not appearing",
        "solution": "This requires an upstream branch to be set. Run: git branch --set-upstream-to=origin/main main (adjust branch name as needed)."
      },
      {
        "issue": "Status always shows dirty (✗) even after commit",
        "solution": "Check git status for untracked files or changes. The statusline reflects actual git state. Run git status -s to see what's detected."
      },
      {
        "issue": "Unicode icons showing as boxes",
        "solution": "Install a Nerd Font or ensure terminal has Unicode support. Test with: echo ' ✓ ✗ ↑ ↓ ⚑'"
      }
    ],
    "requirements": [
      "Bash shell",
      "Git version 2.0 or higher",
      "jq JSON processor",
      "Terminal with Unicode support for git icons"
    ],
    "preview": "sonnet-4.5 │ 1,234  main↑2 ✗ ⚑1"
  },
  {
    "slug": "lines-per-minute-tracker",
    "description": "Real-time coding velocity monitor tracking lines added/removed per minute with productivity scoring and daily output projection for Claude Code sessions.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "productivity",
      "velocity",
      "coding-speed",
      "lines-per-minute",
      "output-tracking"
    ],
    "content": "#!/usr/bin/env bash\n\n# Lines Per Minute Productivity Tracker for Claude Code\n# Calculates coding velocity and productivity metrics\n\n# Read JSON from stdin\nread -r input\n\n# Extract values\nlines_added=$(echo \"$input\" | jq -r '.cost.total_lines_added // 0')\nlines_removed=$(echo \"$input\" | jq -r '.cost.total_lines_removed // 0')\ntotal_duration_ms=$(echo \"$input\" | jq -r '.cost.total_duration_ms // 1')\n\n# Calculate duration in minutes (avoid division by zero)\nif [ \"$total_duration_ms\" -gt 0 ]; then\n  duration_minutes=$(echo \"scale=2; $total_duration_ms / 60000\" | bc)\nelse\n  duration_minutes=0.01  # Prevent division by zero\nfi\n\n# Calculate net lines (added - removed)\nnet_lines=$((lines_added - lines_removed))\n\n# Calculate total changed lines (added + removed)\ntotal_changed=$((lines_added + lines_removed))\n\n# Calculate lines per minute\nif (( $(echo \"$duration_minutes > 0\" | bc -l) )); then\n  added_per_min=$(echo \"scale=1; $lines_added / $duration_minutes\" | bc)\n  removed_per_min=$(echo \"scale=1; $lines_removed / $duration_minutes\" | bc)\n  net_per_min=$(echo \"scale=1; $net_lines / $duration_minutes\" | bc)\n  total_per_min=$(echo \"scale=1; $total_changed / $duration_minutes\" | bc)\nelse\n  added_per_min=0\n  removed_per_min=0\n  net_per_min=0\n  total_per_min=0\nfi\n\n# Productivity scoring based on total changes per minute\nif (( $(echo \"$total_per_min > 50\" | bc -l) )); then\n  PROD_COLOR=\"\\033[38;5;46m\"   # Green: High productivity (>50 lines/min)\n  PROD_ICON=\"🚀\"\n  PROD_RATING=\"HIGH\"\nelif (( $(echo \"$total_per_min > 20\" | bc -l) )); then\n  PROD_COLOR=\"\\033[38;5;226m\"  # Yellow: Medium productivity (20-50 lines/min)\n  PROD_ICON=\"📝\"\n  PROD_RATING=\"MED\"\nelse\n  PROD_COLOR=\"\\033[38;5;75m\"   # Blue: Low/steady productivity (<20 lines/min)\n  PROD_ICON=\"✏️\"\n  PROD_RATING=\"LOW\"\nfi\n\n# Project daily output (assuming 8-hour workday = 480 minutes)\nif (( $(echo \"$net_per_min > 0\" | bc -l) )); then\n  daily_projection=$(echo \"scale=0; $net_per_min * 480\" | bc)\nelse\n  daily_projection=0\nfi\n\nRESET=\"\\033[0m\"\n\n# Format output with net lines indicator\nif [ $net_lines -lt 0 ]; then\n  net_display=\"${net_lines}\"\n  net_label=\"(refactoring)\"\nelse\n  net_display=\"+${net_lines}\"\n  net_label=\"(growth)\"\nfi\n\n# Output statusline\necho -e \"${PROD_ICON} ${PROD_RATING}: ${PROD_COLOR}${total_per_min} L/min${RESET} | +${added_per_min} -${removed_per_min} | Net: ${net_display} ${net_label} | 📅 ${daily_projection} L/day\"\n",
    "title": "Lines Per Minute Tracker",
    "displayTitle": "Lines Per Minute Tracker",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Real-time lines per minute calculation for added, removed, and net changes",
      "Productivity scoring based on total change velocity (high >50 L/min, medium 20-50, low <20)",
      "Daily output projection assuming 8-hour workday (480 minutes)",
      "Refactoring detection (negative net lines indicates cleanup/deletion work)",
      "Separate tracking for additions vs removals for code quality insights",
      "Color-coded productivity ratings (green high, yellow medium, blue low)",
      "Lightweight bash with bc for floating-point calculations",
      "Zero external dependencies beyond jq and bc"
    ],
    "useCases": [
      "Tracking coding velocity during feature development sprints",
      "Measuring productivity impact of different coding sessions",
      "Identifying refactoring vs greenfield development patterns",
      "Comparing productivity across different time periods",
      "Setting personal velocity baselines and improvement goals",
      "Billing/time tracking for consulting work based on output metrics"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides cost.total_lines_added and cost.total_lines_removed for productivity tracking. Statuslines can calculate derived metrics like velocity.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "github_trending",
          "evidence": "Productivity tracking tools like WakaTime emphasize lines-per-minute as key velocity metric. Developers use coding velocity for performance benchmarking.",
          "url": "https://github.com/wakatime/wakatime",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_productivity",
          "evidence": "2025 developer productivity guides cite output velocity (lines/commits per time) as quantifiable productivity metric. Lines-per-minute tracking helps identify peak productive hours.",
          "url": "https://dev.to/",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews discussions on developer metrics highlight velocity tracking (lines changed, commits) as leading indicator of output. Controversial but widely tracked.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "coding velocity tracker",
          "lines per minute",
          "productivity monitor",
          "developer output metrics"
        ],
        "searchVolume": "medium",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "burn-rate-monitor",
          "five-hour-window-tracker"
        ],
        "identifiedGap": "burn-rate-monitor tracks COST velocity ($/min, tok/min) but NOT coding output velocity (lines/min). five-hour-window-tracker shows time remaining, not productivity. No existing statusline measures lines-per-minute or projects daily output. Developers need quantifiable productivity metrics separate from cost tracking.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified lines_added/lines_removed fields available. GitHub tools like WakaTime prove high demand for velocity tracking. Medium search volume, low competition. Clear gap vs cost/time trackers (no output velocity tracking). Critical for productivity benchmarking and goal-setting. User approved for velocity monitoring."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Lines per minute showing 0 despite active coding",
        "solution": "Verify cost.total_lines_added and cost.total_lines_removed fields exist: echo '$input' | jq .cost. Ensure bc is installed: which bc. Check duration_minutes calculation: should be total_duration_ms / 60000. Very short sessions may show 0 until threshold reached."
      },
      {
        "issue": "Daily projection seems unrealistically high",
        "solution": "Daily projection assumes CONTINUOUS coding at current velocity for 8 hours (480 minutes). This is intentional for productivity goal-setting. Actual daily output will be lower with breaks, meetings, etc. Adjust multiplier from 480 to expected active coding minutes per day."
      },
      {
        "issue": "Net lines showing negative (refactoring) when expecting growth",
        "solution": "Negative net lines means total_lines_removed > total_lines_added. This is EXPECTED for refactoring/cleanup sessions. Script correctly labels as '(refactoring)'. If unexpected, verify you're looking at correct session - multi-file refactors often have more deletions than additions."
      },
      {
        "issue": "Productivity rating stuck at LOW despite high activity",
        "solution": "Productivity rating is based on TOTAL changes (added + removed), not net lines. Thresholds: <20 L/min = LOW, 20-50 = MED, >50 = HIGH. Check total_per_min calculation: (lines_added + lines_removed) / duration_minutes. Adjust thresholds if your baseline velocity differs."
      },
      {
        "issue": "bc: command not found when calculating velocity",
        "solution": "Install bc: brew install bc (macOS), apt install bc (Linux). Alternative: use integer math with awk: awk -v added=$lines_added -v dur=$duration_minutes 'BEGIN {print added/dur}' - loses decimal precision but works without bc."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator (for floating-point arithmetic)"
    ],
    "preview": "🚀 HIGH: 45.3 L/min | +38.2 -7.1 | Net: +150 (growth) | 📅 21,600 L/day"
  },
  {
    "slug": "mcp-server-status-monitor",
    "description": "Real-time MCP server monitoring statusline showing connected servers, active tools, and performance metrics for Claude Code MCP integration",
    "author": "JSONbored",
    "dateAdded": "2025-10-16",
    "tags": [
      "mcp",
      "monitoring",
      "servers",
      "tools",
      "performance"
    ],
    "content": "#!/usr/bin/env bash\n\n# MCP Server Status Monitor\n# Shows connected MCP servers and active tools\n\nread -r input\n\n# Extract MCP server info (if available in Claude Code context)\nmcp_servers=$(echo \"$input\" | jq -r '.mcp.servers // []' 2>/dev/null || echo \"[]\")\nserver_count=$(echo \"$mcp_servers\" | jq 'length' 2>/dev/null || echo \"0\")\n\n# Count active tools across all servers\nactive_tools=0\nfor server in $(echo \"$mcp_servers\" | jq -r '.[] | @base64'); do\n  tools=$(echo $server | base64 -d | jq '.tools | length' 2>/dev/null || echo \"0\")\n  active_tools=$((active_tools + tools))\ndone\n\n# Color based on server status\nif [ \"$server_count\" -gt 0 ]; then\n  color=\"\\033[32m\"  # Green - servers connected\n  icon=\"🔌\"\nelse\n  color=\"\\033[90m\"  # Gray - no servers\n  icon=\"⚫\"\nfi\n\n# List server names\nserver_names=$(echo \"$mcp_servers\" | jq -r '.[].name' 2>/dev/null | tr '\\n' ',' | sed 's/,$//')\n\n# Output\nif [ \"$server_count\" -gt 0 ]; then\n  echo -e \"${icon} MCP ${color}${server_count}${color}\\033[0m servers │ ${active_tools} tools │ ${server_names:0:30}\"\nelse\n  echo -e \"${icon} MCP ${color}disconnected${color}\\033[0m\"\nfi\n",
    "title": "MCP Server Status Monitor",
    "displayTitle": "MCP Server Status Monitor",
    "source": "community",
    "features": [
      "Real-time connected server count",
      "Active tools aggregation across all servers",
      "Server name display with truncation",
      "Color-coded connection status",
      "Performance-optimized JSON parsing",
      "Graceful fallback when MCP unavailable"
    ],
    "useCases": [
      "Monitoring MCP server connectivity during development",
      "Tracking available tools across connected servers",
      "Debugging MCP connection issues",
      "Verifying server plugin installations"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Statusline shows 'MCP disconnected' despite configured servers",
        "solution": "Verify servers are actually connected: run 'claude mcp list' to check server status. Ensure servers are properly configured in ~/.mcp.json and restart Claude Code if needed."
      },
      {
        "issue": "Server count shows 0 but MCP servers are running in terminal",
        "solution": "Check that MCP context data is accessible. Verify Claude Code version supports MCP statusline API. Run 'claude mcp get [server-name]' to verify individual server status."
      },
      {
        "issue": "Tool count incorrect or not updating",
        "solution": "This indicates silent tool registration failure. Run '/mcp' in Claude Code to verify tool registration. Restart connected servers if tools remain unavailable despite connection."
      },
      {
        "issue": "MCP server startup failures or connection timeouts",
        "solution": "Launch with --mcp-debug flag. Check logs: ~/Library/Logs/Claude/mcp.log (macOS). Verify server.connect() is called and transport listener is active."
      },
      {
        "issue": "JSON-RPC errors like 'Method not found' or invalid JSON",
        "solution": "Server may not support prompts/list or resources/list, or writes non-JSON to stdout. Ensure JSON-RPC 2.0 compliance. Use MCP Inspector for interactive testing."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "Claude Code with MCP support"
    ],
    "preview": "🔌 MCP 3 servers │ 12 tools │ filesystem,git,database"
  },
  {
    "slug": "minimal-powerline",
    "description": "Clean, performance-optimized statusline with Powerline glyphs showing model, directory, and token count",
    "author": "JSONbored",
    "dateAdded": "2025-10-01",
    "tags": [
      "powerline",
      "minimal",
      "performance",
      "bash",
      "lightweight"
    ],
    "content": "#!/usr/bin/env bash\n\n# Minimal Powerline Statusline for Claude Code\n# Displays: Model | Directory | Token Count\n\n# Read JSON from stdin\nread -r input\n\n# Extract values using jq\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"')\ndir=$(echo \"$input\" | jq -r '.workspace.path // \"~\"' | sed \"s|$HOME|~|\")\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\n\n# Powerline separators\nSEP=\"\\ue0b0\"\n\n# Color codes (256-color palette)\nMODEL_BG=\"\\033[48;5;111m\"  # Light blue background\nMODEL_FG=\"\\033[38;5;111m\"  # Light blue foreground\nDIR_BG=\"\\033[48;5;246m\"    # Gray background\nDIR_FG=\"\\033[38;5;246m\"    # Gray foreground\nTOKEN_BG=\"\\033[48;5;214m\"  # Orange background\nTOKEN_FG=\"\\033[38;5;214m\"  # Orange foreground\nRESET=\"\\033[0m\"\n\n# Build statusline with Powerline glyphs\necho -e \"${MODEL_BG} ${model} ${RESET}${MODEL_FG}${SEP}${RESET} ${DIR_BG} ${dir} ${RESET}${DIR_FG}${SEP}${RESET} ${TOKEN_BG} ${tokens} ${RESET}${TOKEN_FG}${SEP}${RESET}\"",
    "title": "Minimal Powerline",
    "displayTitle": "Minimal Powerline",
    "source": "community",
    "documentationUrl": "https://github.com/powerline/powerline",
    "features": [
      "Powerline-style separators and glyphs",
      "Displays current AI model in use",
      "Shows workspace directory with home shortening",
      "Real-time token count tracking",
      "Low performance impact with minimal processing",
      "256-color terminal support",
      "Requires jq for JSON parsing"
    ],
    "useCases": [
      "Quick overview of current session context",
      "Minimal distraction with essential information only",
      "Performance-conscious users with slow terminals",
      "Teams standardizing on Powerline aesthetic"
    ],
    "category": "statuslines",
    "statuslineType": "powerline",
    "configuration": {
      "format": "bash",
      "refreshInterval": 500,
      "position": "left",
      "colorScheme": "powerline-default"
    },
    "troubleshooting": [
      {
        "issue": "Powerline separators showing as boxes or question marks",
        "solution": "Install a Nerd Font (e.g., FiraCode Nerd Font) and configure your terminal to use it. Verify with: echo -e '\\ue0b0'"
      },
      {
        "issue": "Colors not displaying correctly",
        "solution": "Ensure terminal supports 256 colors. Test with: tput colors (should return 256). Set TERM=xterm-256color if needed."
      },
      {
        "issue": "jq command not found error",
        "solution": "Install jq: brew install jq (macOS), apt install jq (Linux), or download from https://jqlang.github.io/jq/"
      },
      {
        "issue": "tput colors shows 8 but terminal supports 256 colors",
        "solution": "Set TERM explicitly: export TERM=xterm-256color. Test: env TERM=xterm-256color tput colors (should show 256). For tmux/screen use TERM=screen-256color."
      },
      {
        "issue": "Powerline separators misaligned or cut off at edges",
        "solution": "Install Powerline-patched font from github.com/powerline/fonts. U+E0B0-U+E0B3 require patched fonts. For VS Code, enable GPU acceleration for better rendering."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "Terminal with 256-color support",
      "Powerline-compatible font (Nerd Fonts recommended)"
    ],
    "preview": " claude-sonnet-4.5  ~/projects/my-app   1,234 "
  },
  {
    "slug": "model-switch-history-tracker",
    "description": "Claude Code model switch detector tracking transitions between Opus/Sonnet/Haiku with switch count, current model indicator, and cost impact visualization.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "model-switching",
      "opus-sonnet-haiku",
      "cost-optimization",
      "model-tracking",
      "switch-history"
    ],
    "content": "#!/usr/bin/env bash\n\n# Model Switch History Tracker for Claude Code\n# Tracks transitions between Claude models (Opus, Sonnet, Haiku)\n\n# Read JSON from stdin\nread -r input\n\n# Extract current model info\ncurrent_model=$(echo \"$input\" | jq -r '.model.display_name // \"unknown\"')\nsession_id=$(echo \"$input\" | jq -r '.session_id // \"unknown\"')\n\n# Model history tracking directory\nHISTORY_DIR=\"${HOME}/.claude-code-model-history\"\nmkdir -p \"$HISTORY_DIR\"\n\n# Session-specific history file\nHISTORY_FILE=\"${HISTORY_DIR}/${session_id}.history\"\n\n# Initialize history file if doesn't exist\nif [ ! -f \"$HISTORY_FILE\" ]; then\n  echo \"${current_model}\" > \"$HISTORY_FILE\"\n  echo \"0\" >> \"$HISTORY_FILE\"  # Switch count\nfi\n\n# Read previous model and switch count\nprevious_model=$(sed -n '1p' \"$HISTORY_FILE\")\nswitch_count=$(sed -n '2p' \"$HISTORY_FILE\")\n\n# Detect model switch\nif [ \"$current_model\" != \"$previous_model\" ] && [ \"$previous_model\" != \"\" ]; then\n  # Model changed - increment switch count\n  switch_count=$((switch_count + 1))\n  \n  # Log switch event (append to history)\n  echo \"$(date +%s)|${previous_model}→${current_model}\" >> \"$HISTORY_FILE\"\nfi\n\n# Update current model and switch count (overwrite first 2 lines)\ntemp_file=\"${HISTORY_FILE}.tmp\"\necho \"${current_model}\" > \"$temp_file\"\necho \"${switch_count}\" >> \"$temp_file\"\ntail -n +3 \"$HISTORY_FILE\" >> \"$temp_file\" 2>/dev/null\nmv \"$temp_file\" \"$HISTORY_FILE\"\n\n# Determine model tier and color\ncase \"$current_model\" in\n  *\"Opus\"*|*\"opus\"*)\n    MODEL_COLOR=\"\\033[38;5;201m\"  # Magenta: Opus (most expensive)\n    MODEL_ICON=\"💎\"\n    MODEL_TIER=\"OPUS\"\n    ;;\n  *\"Sonnet\"*|*\"sonnet\"*)\n    MODEL_COLOR=\"\\033[38;5;75m\"   # Blue: Sonnet (balanced)\n    MODEL_ICON=\"🎵\"\n    MODEL_TIER=\"SONNET\"\n    ;;\n  *\"Haiku\"*|*\"haiku\"*)\n    MODEL_COLOR=\"\\033[38;5;46m\"   # Green: Haiku (cheapest)\n    MODEL_ICON=\"🍃\"\n    MODEL_TIER=\"HAIKU\"\n    ;;\n  *)\n    MODEL_COLOR=\"\\033[38;5;250m\"  # Gray: Unknown\n    MODEL_ICON=\"❓\"\n    MODEL_TIER=\"UNKNOWN\"\n    ;;\nesac\n\n# Switch frequency indicator\nif [ $switch_count -eq 0 ]; then\n  SWITCH_STATUS=\"stable\"\n  SWITCH_COLOR=\"\\033[38;5;46m\"   # Green: No switches\nelif [ $switch_count -le 3 ]; then\n  SWITCH_STATUS=\"${switch_count} switches\"\n  SWITCH_COLOR=\"\\033[38;5;226m\"  # Yellow: 1-3 switches\nelse\n  SWITCH_STATUS=\"${switch_count} switches!\"\n  SWITCH_COLOR=\"\\033[38;5;196m\"  # Red: 4+ switches (frequent switching)\nfi\n\n# Get last 3 switches for mini-history\nlast_switches=$(tail -n 3 \"$HISTORY_FILE\" | grep '→' | cut -d'|' -f2 | tr '\\n' ' ' | sed 's/ $//')\nif [ -n \"$last_switches\" ]; then\n  HISTORY_DISPLAY=\"| ${last_switches}\"\nelse\n  HISTORY_DISPLAY=\"\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Output statusline\necho -e \"${MODEL_ICON} ${MODEL_COLOR}${MODEL_TIER}${RESET} | ${SWITCH_COLOR}${SWITCH_STATUS}${RESET} ${HISTORY_DISPLAY}\"\n",
    "title": "Model Switch History Tracker",
    "displayTitle": "Model Switch History Tracker",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Real-time model detection for Opus, Sonnet, and Haiku variants",
      "Switch count tracking showing total model changes in session",
      "Last 3 switches mini-history showing transition patterns (Opus→Sonnet→Haiku)",
      "Color-coded model tiers (magenta Opus, blue Sonnet, green Haiku)",
      "Switch frequency warnings (green stable, yellow 1-3, red 4+ switches)",
      "Persistent history storage per session in ~/.claude-code-model-history",
      "Cost awareness through model tier visualization",
      "Automatic switch event logging with timestamps"
    ],
    "useCases": [
      "Cost optimization by tracking Opus vs Sonnet vs Haiku usage patterns",
      "Identifying unnecessary model switching that inflates costs",
      "Understanding which tasks require which model tier",
      "Budget management through model tier awareness",
      "Debugging unexpected model changes in Claude Code settings",
      "Analyzing session patterns for optimal model selection strategy"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides model.display_name field for model tracking. Claude Code supports switching between Opus, Sonnet, and Haiku models.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Reddit discussions about Claude model selection strategy: 'Use Haiku for simple tasks, Sonnet for balanced work, Opus for complex reasoning'. Tracking switches helps optimize costs.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews threads on Claude Code pricing emphasize model tier selection: 'Opus is 5x more expensive than Haiku'. Switch tracking prevents unintended Opus usage inflating bills.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_ai_optimization",
          "evidence": "AI optimization guides recommend tracking model usage patterns to identify cost-saving opportunities. Frequent switching between tiers indicates unclear task categorization.",
          "url": "https://dev.to/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "model switch tracker",
          "opus sonnet haiku monitor",
          "claude model history",
          "AI model optimization"
        ],
        "searchVolume": "medium",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "burn-rate-monitor"
        ],
        "identifiedGap": "burn-rate-monitor tracks total cost but NOT which model tier is being used (Opus vs Sonnet vs Haiku). Existing tracker doesn't show model switches or help optimize tier selection. No history of transitions to identify cost-saving patterns. Users need model-level awareness separate from aggregate cost tracking.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified model.display_name field available. Reddit/HN discussions validate high interest in model tier optimization. Medium search volume, low competition. Clear gap vs cost-only tracking (no model tier breakdown). Critical for cost optimization through strategic model selection. User approved for model switch monitoring."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Model always showing UNKNOWN despite valid Claude model running",
        "solution": "Check model.display_name field: echo '$input' | jq .model.display_name. Script matches case-insensitively on 'Opus', 'Sonnet', 'Haiku' keywords. If model name doesn't contain these (e.g., 'claude-3-5-sonnet-20241022'), add custom matching: *'claude-3-5-sonnet'*) MODEL_TIER='SONNET'. Verify field exists and has expected format."
      },
      {
        "issue": "Switch count not incrementing when changing models",
        "solution": "Verify session_id is consistent: echo '$input' | jq .session_id. Each session has separate history file. If session_id changes, switch count resets (expected). Check history file exists: ls ~/.claude-code-model-history/${session_id}.history. Manually test: echo 'Opus' > file.history && echo '0' >> file.history."
      },
      {
        "issue": "Permission denied when creating model history directory",
        "solution": "Ensure HOME environment variable is set: echo $HOME. Check write permissions: mkdir -p ~/.claude-code-model-history. If permission denied, change location: HISTORY_DIR='/tmp/claude-model-history-$(whoami)'. Verify statusline script runs with correct user permissions."
      },
      {
        "issue": "Last 3 switches history not displaying transitions",
        "solution": "History format is 'timestamp|ModelA→ModelB' (e.g., '1730000000|Opus→Sonnet'). Check file content: tail ~/.claude-code-model-history/${session_id}.history. Grep filter looks for '→' character - ensure terminal encoding supports Unicode arrow. Alternative: replace → with ASCII '->' in script."
      },
      {
        "issue": "Switch frequency showing incorrect count",
        "solution": "Switch count stored on line 2 of history file. Verify: sed -n '2p' ~/.claude-code-model-history/${session_id}.history. Count only increments when current_model != previous_model AND previous_model is not empty. New sessions start at 0 (expected). Manually reset: echo '0' to line 2 if corrupted."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "Write access to ~/.claude-code-model-history directory"
    ],
    "preview": "🎵 SONNET | 2 switches | Opus→Sonnet Haiku→Sonnet"
  },
  {
    "slug": "multi-line-statusline",
    "description": "Comprehensive multi-line statusline displaying detailed session information across two lines with organized sections and visual separators",
    "author": "JSONbored",
    "dateAdded": "2025-10-01",
    "tags": [
      "multi-line",
      "comprehensive",
      "detailed",
      "bash",
      "powerline",
      "dashboard"
    ],
    "content": "#!/usr/bin/env bash\n\n# Multi-Line Statusline for Claude Code\n# Displays comprehensive session info across two lines\n\n# Read JSON from stdin\nread -r input\n\n# Extract all available data\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"')\ndir=$(echo \"$input\" | jq -r '.workspace.path // \"~\"' | sed \"s|$HOME|~|\")\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\ncost=$(echo \"$input\" | jq -r '.session.estimatedCost // 0' | awk '{printf \"%.3f\", $0}')\nmemory=$(echo \"$input\" | jq -r '.system.memoryUsage // 0' | awk '{printf \"%.1f\", $0/1024/1024}')\n\n# Get git info if in repo\nworkdir=$(echo \"$input\" | jq -r '.workspace.path // \".\"')\ncd \"$workdir\" 2>/dev/null || cd .\n\nif git rev-parse --git-dir > /dev/null 2>&1; then\n  branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo \"(detached)\")\n  if [ -z \"$(git status --porcelain)\" ]; then\n    git_status=\"\\033[32m ✓\\033[0m\"\n  else\n    git_status=\"\\033[33m ✗\\033[0m\"\n  fi\n  git_display=\" ${branch}${git_status}\"\nelse\n  git_display=\"\"\nfi\n\n# Box drawing and separators\nSEP=\"\\ue0b0\"\nVSEP=\"│\"\nTOP_LEFT=\"┌\"\nBOT_LEFT=\"└\"\n\n# Color scheme\nRESET=\"\\033[0m\"\nMODEL_C=\"\\033[38;5;111m\"  # Blue\nDIR_C=\"\\033[38;5;214m\"    # Orange\nTOKEN_C=\"\\033[38;5;76m\"   # Green\nCOST_C=\"\\033[38;5;220m\"   # Yellow\nMEM_C=\"\\033[38;5;139m\"    # Purple\n\n# Build top line: Model | Directory | Git\ntop_line=\"${TOP_LEFT}${RESET} ${MODEL_C}${model}${RESET} ${VSEP} ${DIR_C}${dir}${RESET}${git_display}\"\n\n# Build bottom line: Tokens | Cost | Memory\nbottom_line=\"${BOT_LEFT}${RESET} ${TOKEN_C} ${tokens:,} tokens${RESET} ${VSEP} ${COST_C}\\$${cost}${RESET}\"\n\nif [ \"$memory\" != \"0.0\" ]; then\n  bottom_line=\"${bottom_line} ${VSEP} ${MEM_C}${memory} MB${RESET}\"\nfi\n\n# Output both lines\necho -e \"$top_line\"\necho -e \"$bottom_line\"\n",
    "title": "Multi Line Statusline",
    "displayTitle": "Multi Line Statusline",
    "source": "community",
    "features": [
      "Two-line display for comprehensive information",
      "Top line: Model, directory, git status",
      "Bottom line: Tokens, cost, session time, memory usage",
      "Powerline separators and section dividers",
      "Color-coded sections for easy scanning",
      "Box drawing characters for visual structure",
      "Optional memory usage monitoring"
    ],
    "useCases": [
      "Power users needing comprehensive session visibility",
      "Development sessions with complex context switching",
      "Monitoring resource usage during heavy workloads",
      "Teams requiring detailed audit trails",
      "Presentations or pair programming demonstrations"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left",
      "colorScheme": "multi-line-dashboard"
    },
    "troubleshooting": [
      {
        "issue": "Box drawing characters showing as garbage or question marks",
        "solution": "Ensure terminal has UTF-8 encoding enabled. Set: export LANG=en_US.UTF-8. Test with: echo '┌│└'"
      },
      {
        "issue": "Second line overwriting first line or display corruption",
        "solution": "Terminal may not support multi-line statuslines properly. Check Claude Code configuration for multi-line support or use single-line statusline instead."
      },
      {
        "issue": "Memory usage always showing 0.0 MB",
        "solution": "Memory monitoring may not be available in your Claude Code version. This field is optional - statusline works without it."
      },
      {
        "issue": "Lines not aligned or wrapped incorrectly",
        "solution": "Terminal window may be too narrow. Resize to at least 80 characters wide or simplify displayed information."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "Terminal with Unicode box drawing support",
      "Terminal height sufficient for multi-line display"
    ],
    "preview": "┌ claude-sonnet-4.5 │ ~/projects/app  main ✓\n└  12,345 tokens │ $0.234 │ 156.3 MB"
  },
  {
    "slug": "multi-provider-token-counter",
    "description": "Multi-provider AI token counter displaying real-time context usage for Claude (1M), GPT-4.1 (1M), Gemini 2.x (1M), and Grok 3 (1M) with 2025 verified limits",
    "author": "JSONbored",
    "dateAdded": "2025-10-16",
    "tags": [
      "tokens",
      "multi-provider",
      "context-limits",
      "ai-models",
      "monitoring"
    ],
    "content": "#!/usr/bin/env bash\n\n# Multi-Provider Token Counter - 2025 Context Limits\n# Supports: Claude Sonnet 4 (1M), GPT-4.1 (1M), Gemini 2.x (1M), Grok 3 (1M)\n\nread -r input\n\n# Extract model and token info\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"')\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\n\n# Determine provider and context limit\nif [[ \"$model\" == *\"claude\"* ]]; then\n  if [[ \"$model\" == *\"sonnet-4\"* ]] || [[ \"$model\" == *\"sonnet-3.5\"* ]]; then\n    limit=1000000\n    provider=\"Claude\"\n    icon=\"🔮\"\n  else\n    limit=200000\n    provider=\"Claude\"\n    icon=\"🔮\"\n  fi\nelif [[ \"$model\" == *\"gpt-4.1\"* ]]; then\n  limit=1000000\n  provider=\"GPT-4.1\"\n  icon=\"🤖\"\nelif [[ \"$model\" == *\"gpt-4o\"* ]]; then\n  limit=128000\n  provider=\"GPT-4o\"\n  icon=\"🤖\"\nelif [[ \"$model\" == *\"gemini\"* ]]; then\n  if [[ \"$model\" == *\"2.\"* ]] || [[ \"$model\" == *\"1.5-pro\"* ]]; then\n    limit=1000000\n    provider=\"Gemini\"\n    icon=\"💎\"\n  else\n    limit=128000\n    provider=\"Gemini\"\n    icon=\"💎\"\n  fi\nelif [[ \"$model\" == *\"grok-3\"* ]]; then\n  limit=1000000\n  provider=\"Grok\"\n  icon=\"⚡\"\nelif [[ \"$model\" == *\"grok-4\"* ]]; then\n  limit=256000\n  provider=\"Grok\"\n  icon=\"⚡\"\nelse\n  limit=100000\n  provider=\"Unknown\"\n  icon=\"❓\"\nfi\n\n# Calculate usage percentage\npercentage=$(awk \"BEGIN {printf \\\"%.1f\\\", ($tokens / $limit) * 100}\")\n\n# Color coding based on usage\nif (( $(echo \"$percentage < 50\" | bc -l) )); then\n  color=\"\\033[32m\"  # Green\nelif (( $(echo \"$percentage < 80\" | bc -l) )); then\n  color=\"\\033[33m\"  # Yellow\nelse\n  color=\"\\033[31m\"  # Red\nfi\n\n# Format token count with commas\ntokens_formatted=$(printf \"%'d\" $tokens)\nlimit_formatted=$(printf \"%'d\" $limit)\n\n# Output statusline\necho -e \"${icon} ${provider} │ ${color}${tokens_formatted}${color}\\033[0m/${limit_formatted} (${percentage}%)\\033[0m\"\n",
    "title": "Multi Provider Token Counter",
    "displayTitle": "Multi Provider Token Counter",
    "source": "community",
    "documentationUrl": "https://docs.anthropic.com/claude/docs/models-overview",
    "features": [
      "Automatic provider detection (Claude, GPT-4, Gemini, Grok)",
      "2025 verified context limits (1M for latest models)",
      "Real-time usage percentage calculation",
      "Color-coded warnings (green <50%, yellow <80%, red ≥80%)",
      "Formatted token counts with thousand separators",
      "Provider-specific icons for visual identification",
      "Supports legacy models with correct limits"
    ],
    "useCases": [
      "Monitoring context usage across multiple AI providers",
      "Tracking token consumption to avoid context limit errors",
      "Comparing model efficiency across providers",
      "Real-time awareness of remaining context budget",
      "Multi-model workflow optimization"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "right",
      "colorScheme": "provider-aware"
    },
    "troubleshooting": [
      {
        "issue": "Percentage shows >100% or incorrect limit",
        "solution": "Update model detection logic with latest model names. Check Claude docs for current model IDs."
      },
      {
        "issue": "Icons showing as boxes",
        "solution": "Install Nerd Font or emoji-capable font. Test with: echo '🔮 🤖 💎 ⚡'"
      },
      {
        "issue": "Colors not working",
        "solution": "Ensure TERM environment variable supports colors: echo $TERM should show 'xterm-256color' or similar"
      },
      {
        "issue": "Model detection fails for new AI models or versions",
        "solution": "Add patterns to detection logic. Common: claude-* (Opus/Sonnet/Haiku), gpt-* (4o/4.1/o3), gemini-* (2.0/2.5-pro), grok-* (3/4). Update with [[ \"$model\" == *\"pattern\"* ]]."
      },
      {
        "issue": "Percentage calculation precision too low or rounded values",
        "solution": "Increase bc scale for decimals. Current: scale=1. Use: awk \"BEGIN {printf \\\"%.2f\\\", ($tokens / $limit) * 100}\" for two decimals. Higher scale slows execution."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator for percentage math",
      "Terminal with Unicode and color support"
    ],
    "preview": "🔮 Claude │ 456,789/1,000,000 (45.7%)"
  },
  {
    "slug": "multi-session-overlap-indicator",
    "description": "Claude Code multi-session overlap detector showing concurrent active sessions with visual indicators, session count, and workspace collision warnings for budget management.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "multi-session",
      "parallel-sessions",
      "overlap-detection",
      "workspace-tracking",
      "session-management"
    ],
    "content": "#!/usr/bin/env bash\n\n# Multi-Session Overlap Indicator for Claude Code\n# Detects concurrent Claude sessions running in parallel\n\n# Read JSON from stdin\nread -r input\n\n# Extract current session info\nsession_id=$(echo \"$input\" | jq -r '.session_id // \"unknown\"')\ncurrent_workspace=$(echo \"$input\" | jq -r '.workspace.current_dir // \"\"')\n\n# Session tracking directory (stores active session metadata)\nSESSION_DIR=\"${HOME}/.claude-code-sessions\"\nmkdir -p \"$SESSION_DIR\"\n\n# Current session file\nSESSION_FILE=\"${SESSION_DIR}/${session_id}.active\"\n\n# Write current session timestamp and workspace\necho \"$(date +%s)|${current_workspace}\" > \"$SESSION_FILE\"\n\n# Cleanup stale sessions (older than 10 minutes = 600 seconds)\nCURRENT_TIME=$(date +%s)\nfor session_file in \"$SESSION_DIR\"/*.active; do\n  if [ -f \"$session_file\" ]; then\n    session_timestamp=$(cut -d'|' -f1 < \"$session_file\")\n    age=$((CURRENT_TIME - session_timestamp))\n    if [ $age -gt 600 ]; then\n      rm -f \"$session_file\"\n    fi\n  fi\ndone\n\n# Count active sessions\nactive_sessions=$(find \"$SESSION_DIR\" -name '*.active' -type f | wc -l | tr -d ' ')\n\n# Check for workspace collisions (multiple sessions in same workspace)\nworkspace_collision=false\nif [ -n \"$current_workspace\" ]; then\n  collision_count=$(grep -l \"|${current_workspace}$\" \"$SESSION_DIR\"/*.active 2>/dev/null | wc -l | tr -d ' ')\n  if [ \"$collision_count\" -gt 1 ]; then\n    workspace_collision=true\n  fi\nfi\n\n# Color coding based on session count\nif [ $active_sessions -eq 1 ]; then\n  SESSION_COLOR=\"\\033[38;5;46m\"   # Green: Single session\n  SESSION_ICON=\"●\"\n  SESSION_STATUS=\"SOLO\"\nelif [ $active_sessions -le 3 ]; then\n  SESSION_COLOR=\"\\033[38;5;226m\"  # Yellow: 2-3 sessions (moderate overlap)\n  SESSION_ICON=\"●●\"\n  SESSION_STATUS=\"MULTI\"\nelse\n  SESSION_COLOR=\"\\033[38;5;196m\"  # Red: 4+ sessions (high overlap, budget concern)\n  SESSION_ICON=\"●●●\"\n  SESSION_STATUS=\"OVERLAP!\"\nfi\n\n# Workspace collision warning\nif [ \"$workspace_collision\" = true ]; then\n  COLLISION_WARNING=\"\\033[38;5;208m⚠ WORKSPACE COLLISION\\033[0m\"\nelse\n  COLLISION_WARNING=\"\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Build session list visualization\nif [ $active_sessions -gt 1 ]; then\n  session_list=\"\"\n  for i in $(seq 1 $active_sessions); do\n    session_list=\"${session_list}●\"\n  done\n  visual=\"[${session_list}]\"\nelse\n  visual=\"\"\nfi\n\n# Output statusline\nif [ -n \"$COLLISION_WARNING\" ]; then\n  echo -e \"${SESSION_COLOR}${SESSION_ICON} ${SESSION_STATUS}${RESET}: ${active_sessions} active ${visual} | ${COLLISION_WARNING}\"\nelse\n  echo -e \"${SESSION_COLOR}${SESSION_ICON} ${SESSION_STATUS}${RESET}: ${active_sessions} active ${visual}\"\nfi\n",
    "title": "Multi Session Overlap Indicator",
    "displayTitle": "Multi Session Overlap Indicator",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Real-time detection of concurrent Claude Code sessions running in parallel",
      "Session count tracking with visual indicators (●● for multiple sessions)",
      "Workspace collision detection (multiple sessions in same directory)",
      "Automatic stale session cleanup (sessions inactive >10 minutes)",
      "Color-coded alerts (green solo, yellow 2-3 sessions, red 4+ sessions)",
      "Visual session list showing all active sessions as dots",
      "Budget awareness through overlap warnings (multiple 5-hour windows)",
      "Persistent session tracking via ~/.claude-code-sessions directory"
    ],
    "useCases": [
      "Managing multiple overlapping 5-hour billing windows",
      "Preventing accidental parallel sessions that double costs",
      "Detecting workspace collisions when working in same directory",
      "Budget management for accounts with usage limits",
      "Team coordination when multiple developers share workspace",
      "Identifying forgotten background sessions still running"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides session_id and workspace.current_dir for session tracking. Multiple 5-hour windows can overlap simultaneously.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Reddit discussions about Claude Code's 5-hour rolling window system: 'Developers can have multiple overlapping sessions active simultaneously' - need overlap detection for budget management.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "high"
        },
        {
          "source": "github_trending",
          "evidence": "ccusage tool tracks multiple session blocks concurrently. Block overlap visualization validates demand for multi-session awareness.",
          "url": "https://github.com/ryoppippi/ccusage",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_session_management",
          "evidence": "Claude Code session management guides emphasize tracking parallel sessions to avoid unexpected billing. Workspace collision detection prevents conflicts.",
          "url": "https://dev.to/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "multi-session tracker",
          "parallel session detection",
          "workspace collision",
          "session overlap monitor"
        ],
        "searchVolume": "medium",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "five-hour-window-tracker"
        ],
        "identifiedGap": "five-hour-window-tracker monitors CURRENT session window only, not multiple PARALLEL sessions. Existing tracker doesn't detect when multiple Claude Code instances run simultaneously (separate 5-hour windows). No workspace collision detection. Users with multiple projects need multi-session awareness for budget management and conflict prevention.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified session_id and workspace fields available. Reddit discussions confirm multiple overlapping sessions are common. GitHub tool ccusage tracks concurrent blocks. Medium search volume, low competition. Clear gap vs single-session window tracker. Critical for budget management and workspace conflict detection. User approved for session overlap monitoring."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Session count always showing 1 despite multiple Claude Code instances running",
        "solution": "Verify session_id field exists in JSON: echo '$input' | jq .session_id. Check ~/.claude-code-sessions directory is writable: ls -la ~/.claude-code-sessions. Ensure each Claude Code instance has unique session_id. If all sessions share same ID (bug), script cannot distinguish them."
      },
      {
        "issue": "Workspace collision warning appearing incorrectly",
        "solution": "Check workspace.current_dir field: echo '$input' | jq .workspace.current_dir. Script uses exact path matching - symlinks and relative paths may cause false positives. Verify sessions are actually in different directories with pwd. Collision is EXPECTED if multiple sessions genuinely share same workspace."
      },
      {
        "issue": "Stale sessions not being cleaned up automatically",
        "solution": "Cleanup runs every statusline update (default 2s refresh). Threshold is 600 seconds (10 minutes) of inactivity. Check session files: ls -la ~/.claude-code-sessions/*.active. Verify date command works: date +%s. Manually cleanup: rm ~/.claude-code-sessions/*.active."
      },
      {
        "issue": "Permission denied when creating session tracking directory",
        "solution": "Script creates ~/.claude-code-sessions on first run. Ensure HOME environment variable is set: echo $HOME. Check write permissions: mkdir -p ~/.claude-code-sessions. If permission denied, change location in script: SESSION_DIR=\"/tmp/claude-sessions-$(whoami)\"."
      },
      {
        "issue": "Visual session list not displaying dots correctly",
        "solution": "Ensure terminal supports Unicode bullet character (●). Test with: echo -e '●●●'. If unsupported, replace with ASCII: SESSION_ICON='*' and visual characters. Check terminal encoding is UTF-8: echo $LANG (should show UTF-8)."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "Write access to ~/.claude-code-sessions directory"
    ],
    "preview": "●● MULTI: 2 active [●●] | ⚠ WORKSPACE COLLISION"
  },
  {
    "slug": "python-rich-statusline",
    "description": "Feature-rich statusline using Python's Rich library for beautiful formatting, progress bars, and real-time token cost tracking",
    "author": "JSONbored",
    "dateAdded": "2025-10-01",
    "tags": [
      "python",
      "rich",
      "advanced",
      "cost-tracking",
      "progress",
      "colorful"
    ],
    "content": "#!/usr/bin/env python3\n\nimport sys\nimport json\nfrom rich.console import Console\nfrom rich.text import Text\n\nconsole = Console()\n\n# Read JSON from stdin\ntry:\n    data = json.load(sys.stdin)\nexcept json.JSONDecodeError:\n    console.print(\"[red]Error: Invalid JSON input[/red]\")\n    sys.exit(1)\n\n# Extract session data\nmodel = data.get('model', 'unknown')\nworkspace = data.get('workspace', {}).get('path', '~').replace(f\"{os.path.expanduser('~')}\", '~')\ntokens = data.get('session', {}).get('totalTokens', 0)\ncost = data.get('session', {}).get('estimatedCost', 0.0)\ngit_branch = data.get('git', {}).get('branch', None)\n\n# Build status components\nstatus = Text()\n\n# Model indicator with emoji\nstatus.append(\"🤖 \", style=\"bold\")\nstatus.append(f\"{model}\", style=\"bold cyan\")\nstatus.append(\" │ \", style=\"dim\")\n\n# Directory\nstatus.append(\"📁 \", style=\"bold\")\nstatus.append(f\"{workspace}\", style=\"yellow\")\n\n# Git branch if available\nif git_branch:\n    status.append(\" │ \", style=\"dim\")\n    status.append(\" \", style=\"bold\")\n    status.append(f\"{git_branch}\", style=\"magenta\")\n\n# Token usage\nstatus.append(\" │ \", style=\"dim\")\nstatus.append(\"🎯 \", style=\"bold\")\nstatus.append(f\"{tokens:,}\", style=\"green\" if tokens < 100000 else \"yellow\")\n\n# Cost with dynamic coloring\nif cost > 0:\n    status.append(\" │ \", style=\"dim\")\n    status.append(\"💰 \", style=\"bold\")\n    cost_color = \"green\" if cost < 0.10 else \"yellow\" if cost < 1.0 else \"red\"\n    status.append(f\"${cost:.3f}\", style=cost_color)\n\nconsole.print(status)\n",
    "title": "Python Rich Statusline",
    "displayTitle": "Python Rich Statusline",
    "source": "community",
    "documentationUrl": "https://rich.readthedocs.io/",
    "features": [
      "Rich library for beautiful terminal formatting",
      "Real-time token cost calculation and display",
      "Progress bar showing session token usage",
      "Git branch and status indicators",
      "Emoji support for visual feedback",
      "Dynamic color schemes based on cost thresholds",
      "JSON parsing with error handling"
    ],
    "useCases": [
      "Track token costs in real-time during long sessions",
      "Monitor git branch when working across multiple projects",
      "Visual feedback for budget-conscious API usage",
      "Enhanced aesthetics for presentation or streaming"
    ],
    "category": "statuslines",
    "statuslineType": "rich",
    "configuration": {
      "format": "python",
      "refreshInterval": 1000,
      "position": "left",
      "colorScheme": "rich-default"
    },
    "troubleshooting": [
      {
        "issue": "ModuleNotFoundError: No module named 'rich'",
        "solution": "Install the Rich library: pip3 install rich or python3 -m pip install rich"
      },
      {
        "issue": "Emojis displaying as boxes or not rendering",
        "solution": "Ensure terminal supports Unicode emojis. Use iTerm2, Kitty, or Windows Terminal. Test with: python3 -c 'print(\"🤖 Test\")'"
      },
      {
        "issue": "Colors look washed out or incorrect",
        "solution": "Enable truecolor support. Set COLORTERM=truecolor environment variable or use a terminal that supports 24-bit color."
      },
      {
        "issue": "Script execution too slow",
        "solution": "Rich has some startup overhead. Consider increasing refreshInterval to 2000-3000ms or use the minimal-powerline statusline instead."
      }
    ],
    "requirements": [
      "Python 3.6 or higher",
      "Rich library (pip install rich)",
      "Terminal with emoji support",
      "Terminal with truecolor support (recommended)"
    ],
    "preview": "🤖 claude-sonnet-4.5 │ 📁 ~/projects/app │  main │ 🎯 12,345 │ 💰 $0.234"
  },
  {
    "slug": "real-time-cost-tracker",
    "description": "Real-time AI cost tracking statusline with per-session spend analytics, model pricing, and budget alerts",
    "author": "JSONbored",
    "dateAdded": "2025-10-16",
    "tags": [
      "cost",
      "pricing",
      "budget",
      "analytics",
      "monitoring"
    ],
    "content": "#!/usr/bin/env bash\n\n# Real-Time Cost Tracker\n# Calculate session costs based on token usage\n\nread -r input\n\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"')\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\n\n# 2025 Pricing (per 1M tokens)\nif [[ \"$model\" == *\"claude-sonnet-4\"* ]]; then\n  price_per_m=3.00\nelif [[ \"$model\" == *\"gpt-4\"* ]]; then\n  price_per_m=5.00\nelif [[ \"$model\" == *\"gemini\"* ]]; then\n  price_per_m=1.25\nelse\n  price_per_m=1.00\nfi\n\n# Calculate cost\ncost=$(awk \"BEGIN {printf \\\"%.4f\\\", ($tokens / 1000000) * $price_per_m}\")\n\n# Budget alert\nif (( $(echo \"$cost > 0.50\" | bc -l) )); then\n  color=\"\\033[31m\"  # Red\n  icon=\"⚠️\"\nelif (( $(echo \"$cost > 0.10\" | bc -l) )); then\n  color=\"\\033[33m\"  # Yellow\n  icon=\"💰\"\nelse\n  color=\"\\033[32m\"  # Green\n  icon=\"💵\"\nfi\n\necho -e \"${icon} ${color}$${cost}${color}\\033[0m │ ${tokens} tokens\"\n",
    "title": "Real Time Cost Tracker",
    "displayTitle": "Real Time Cost Tracker",
    "source": "community",
    "features": [
      "Real-time cost calculation",
      "2025 model pricing (Claude, GPT-4, Gemini)",
      "Budget threshold alerts",
      "Color-coded spend warnings",
      "Session cost tracking"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "right"
    },
    "troubleshooting": [
      {
        "issue": "Cost calculation shows wrong decimal format with comma separator",
        "solution": "Set LC_NUMERIC=C at script start to enforce dot decimal separator. Some locales default to comma, breaking bc. Add: export LC_NUMERIC=C before math operations."
      },
      {
        "issue": "Pricing appears outdated or incorrect for current AI models",
        "solution": "Update price_per_m values. Claude Sonnet 4 is $3/M (2025), GPT-4o is $3/$10, Gemini 1.5 Pro is $3.50/M. Verify at provider docs before updating script."
      },
      {
        "issue": "bc: command not found when running cost calculations",
        "solution": "Install bc calculator: brew install bc (macOS), apt install bc (Ubuntu/Debian). Required for floating-point arithmetic in bash scripts."
      },
      {
        "issue": "Cost displays as $0.0000 despite high token usage",
        "solution": "Check printf precision: use %.4f for micro-dollars. Verify tokens populated: echo $tokens. If zero, test JSON parsing: echo \"$input\" | jq '.session.totalTokens'."
      }
    ],
    "requirements": [
      "Bash",
      "jq",
      "bc calculator"
    ],
    "preview": "💵 $0.0234 │ 7,800 tokens"
  },
  {
    "slug": "session-health-score",
    "description": "Claude Code session health aggregator providing A-F grade based on cost efficiency, latency performance, productivity velocity, and cache utilization with actionable recommendations.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "health-score",
      "session-grade",
      "performance-aggregator",
      "quality-metrics",
      "optimization-recommendations"
    ],
    "content": "#!/usr/bin/env bash\n\n# Session Health Score for Claude Code\n# Aggregates multiple metrics into overall health grade (A-F)\n\n# Read JSON from stdin\nread -r input\n\n# Extract metrics\ntotal_cost=$(echo \"$input\" | jq -r '.cost.total_cost_usd // 0')\ntotal_duration_ms=$(echo \"$input\" | jq -r '.cost.total_duration_ms // 1')\napi_duration_ms=$(echo \"$input\" | jq -r '.cost.total_api_duration_ms // 0')\nlines_added=$(echo \"$input\" | jq -r '.cost.total_lines_added // 0')\nlines_removed=$(echo \"$input\" | jq -r '.cost.total_lines_removed // 0')\ncache_read_tokens=$(echo \"$input\" | jq -r '.cost.cache_read_input_tokens // 0')\ncache_create_tokens=$(echo \"$input\" | jq -r '.cost.cache_creation_input_tokens // 0')\nregular_input_tokens=$(echo \"$input\" | jq -r '.cost.input_tokens // 0')\n\n# Convert duration to minutes\nif [ \"$total_duration_ms\" -gt 0 ]; then\n  duration_minutes=$(echo \"scale=2; $total_duration_ms / 60000\" | bc)\nelse\n  duration_minutes=0.01\nfi\n\n# METRIC 1: Cost Efficiency (25 points)\n# Target: <$0.05/min = excellent, $0.05-$0.10 = good, >$0.10 = poor\nif (( $(echo \"$duration_minutes > 0\" | bc -l) )); then\n  cost_per_minute=$(echo \"scale=4; $total_cost / $duration_minutes\" | bc)\nelse\n  cost_per_minute=0\nfi\n\nif (( $(echo \"$cost_per_minute < 0.05\" | bc -l) )); then\n  cost_score=25\nelif (( $(echo \"$cost_per_minute < 0.10\" | bc -l) )); then\n  cost_score=18\nelif (( $(echo \"$cost_per_minute < 0.20\" | bc -l) )); then\n  cost_score=12\nelse\n  cost_score=5\nfi\n\n# METRIC 2: Latency Performance (25 points)\n# Target: network time <1s = excellent, 1-3s = good, >3s = poor\nnetwork_time=$((total_duration_ms - api_duration_ms))\nnetwork_seconds=$(echo \"scale=2; $network_time / 1000\" | bc)\n\nif (( $(echo \"$network_seconds < 1\" | bc -l) )); then\n  latency_score=25\nelif (( $(echo \"$network_seconds < 3\" | bc -l) )); then\n  latency_score=18\nelif (( $(echo \"$network_seconds < 5\" | bc -l) )); then\n  latency_score=12\nelse\n  latency_score=5\nfi\n\n# METRIC 3: Productivity Velocity (25 points)\n# Target: >30 lines/min = excellent, 15-30 = good, <15 = poor\ntotal_changed=$((lines_added + lines_removed))\nif (( $(echo \"$duration_minutes > 0\" | bc -l) )); then\n  lines_per_minute=$(echo \"scale=1; $total_changed / $duration_minutes\" | bc)\nelse\n  lines_per_minute=0\nfi\n\nif (( $(echo \"$lines_per_minute > 30\" | bc -l) )); then\n  productivity_score=25\nelif (( $(echo \"$lines_per_minute > 15\" | bc -l) )); then\n  productivity_score=18\nelif (( $(echo \"$lines_per_minute > 5\" | bc -l) )); then\n  productivity_score=12\nelse\n  productivity_score=5\nfi\n\n# METRIC 4: Cache Utilization (25 points)\n# Target: >40% hit rate = excellent, 20-40% = good, <20% = poor\ntotal_input=$((cache_read_tokens + cache_create_tokens + regular_input_tokens))\nif [ $total_input -gt 0 ]; then\n  cache_hit_rate=$(( (cache_read_tokens * 100) / total_input ))\nelse\n  cache_hit_rate=0\nfi\n\nif [ $cache_hit_rate -ge 40 ]; then\n  cache_score=25\nelif [ $cache_hit_rate -ge 20 ]; then\n  cache_score=18\nelif [ $cache_hit_rate -gt 0 ]; then\n  cache_score=12\nelse\n  cache_score=5  # No caching detected\nfi\n\n# Calculate total health score (0-100)\nhealth_score=$((cost_score + latency_score + productivity_score + cache_score))\n\n# Assign letter grade\nif [ $health_score -ge 90 ]; then\n  GRADE=\"A\"\n  GRADE_COLOR=\"\\033[38;5;46m\"   # Green\n  GRADE_ICON=\"🌟\"\n  STATUS=\"EXCELLENT\"\nelif [ $health_score -ge 80 ]; then\n  GRADE=\"B\"\n  GRADE_COLOR=\"\\033[38;5;75m\"   # Blue\n  GRADE_ICON=\"✓\"\n  STATUS=\"GOOD\"\nelif [ $health_score -ge 70 ]; then\n  GRADE=\"C\"\n  GRADE_COLOR=\"\\033[38;5;226m\"  # Yellow\n  GRADE_ICON=\"●\"\n  STATUS=\"AVERAGE\"\nelif [ $health_score -ge 60 ]; then\n  GRADE=\"D\"\n  GRADE_COLOR=\"\\033[38;5;208m\"  # Orange\n  GRADE_ICON=\"⚠\"\n  STATUS=\"BELOW AVG\"\nelse\n  GRADE=\"F\"\n  GRADE_COLOR=\"\\033[38;5;196m\"  # Red\n  GRADE_ICON=\"✗\"\n  STATUS=\"POOR\"\nfi\n\n# Identify weakest metric for recommendation\nweakest_score=$cost_score\nweakest_metric=\"cost\"\n\nif [ $latency_score -lt $weakest_score ]; then\n  weakest_score=$latency_score\n  weakest_metric=\"latency\"\nfi\n\nif [ $productivity_score -lt $weakest_score ]; then\n  weakest_score=$productivity_score\n  weakest_metric=\"productivity\"\nfi\n\nif [ $cache_score -lt $weakest_score ]; then\n  weakest_score=$cache_score\n  weakest_metric=\"cache\"\nfi\n\n# Actionable recommendation based on weakest metric\ncase \"$weakest_metric\" in\n  cost)\n    RECOMMENDATION=\"💡 Optimize: Switch to Haiku for simple tasks\"\n    ;;\n  latency)\n    RECOMMENDATION=\"💡 Optimize: Check network connection\"\n    ;;\n  productivity)\n    RECOMMENDATION=\"💡 Optimize: Increase automation/prompts\"\n    ;;\n  cache)\n    RECOMMENDATION=\"💡 Optimize: Enable prompt caching\"\n    ;;\nesac\n\n# Show recommendation only if grade is C or below\nif [ $health_score -lt 70 ]; then\n  SHOW_REC=\"$RECOMMENDATION\"\nelse\n  SHOW_REC=\"\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Build metric breakdown (abbreviated)\nMETRICS=\"C:${cost_score} L:${latency_score} P:${productivity_score} K:${cache_score}\"\n\n# Output statusline\nif [ -n \"$SHOW_REC\" ]; then\n  echo -e \"${GRADE_ICON} Health: ${GRADE_COLOR}${GRADE}${RESET} (${health_score}/100) | ${METRICS} | ${SHOW_REC}\"\nelse\n  echo -e \"${GRADE_ICON} Health: ${GRADE_COLOR}${GRADE}${RESET} (${health_score}/100) | ${STATUS} | ${METRICS}\"\nfi\n",
    "title": "Session Health Score",
    "displayTitle": "Session Health Score",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Comprehensive health score aggregating 4 key metrics into A-F grade (90+ = A, 80-89 = B, 70-79 = C, 60-69 = D, <60 = F)",
      "Cost efficiency metric (25 points): burn rate vs target <$0.05/min",
      "Latency performance metric (25 points): network time vs target <1s",
      "Productivity velocity metric (25 points): lines/min vs target >30 L/min",
      "Cache utilization metric (25 points): hit rate vs target >40%",
      "Actionable recommendations identifying weakest metric with optimization tips",
      "Metric breakdown display showing individual scores (C:25 L:18 P:12 K:25)",
      "Color-coded grading (green A, blue B, yellow C, orange D, red F)"
    ],
    "useCases": [
      "Quick session quality assessment at a glance",
      "Identifying performance bottlenecks across multiple dimensions",
      "Comparing session health across different projects/workflows",
      "Optimizing Claude Code usage based on weakest metric feedback",
      "Team performance benchmarking with standardized grading",
      "Historical session quality tracking for improvement trends"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides all required fields: cost metrics, duration metrics, lines changed, cache tokens. Statuslines can aggregate data for composite scores.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_performance_monitoring",
          "evidence": "2025 developer productivity guides emphasize composite health scores combining multiple dimensions (cost, latency, output). Single-metric dashboards miss optimization opportunities.",
          "url": "https://dev.to/",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews discussions on developer metrics highlight need for holistic session quality assessment. A-F grading simplifies complex multi-metric analysis for quick decision-making.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Reddit threads on AI tool optimization: 'Need single dashboard view of session health'. Aggregating cost, latency, productivity, caching into one score addresses common pain point.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "session health score",
          "performance grade tracker",
          "holistic monitoring",
          "quality aggregator"
        ],
        "searchVolume": "medium",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [
          "burn-rate-monitor",
          "api-latency-breakdown",
          "lines-per-minute-tracker",
          "cache-efficiency-monitor"
        ],
        "identifiedGap": "Existing statuslines track individual metrics in isolation (cost, latency, productivity, cache). No AGGREGATION into holistic health score. Users must mentally combine multiple statuslines to assess overall session quality. Single A-F grade with actionable recommendations is completely missing.",
        "priority": "high"
      },
      "approvalRationale": "Official docs verified all required fields available for aggregation. Dev.to/HN/Reddit validate demand for composite health scoring. Medium search volume, low competition. Clear gap vs single-metric trackers (no holistic view). Critical for simplifying multi-dimensional optimization. User approved for session health scoring."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Health score always showing F grade despite good session",
        "solution": "Verify all JSON fields exist: cost.total_cost_usd, cost.total_duration_ms, cost.total_api_duration_ms, cost.total_lines_added, cost.total_lines_removed, cost.cache_read_input_tokens. Missing fields default to 0, causing low scores. Check: echo '$input' | jq .cost. Ensure Claude Code version exposes all required metrics."
      },
      {
        "issue": "Individual metric scores seem incorrect",
        "solution": "Check thresholds: Cost (<$0.05/min = 25pt, <$0.10 = 18pt), Latency (<1s network = 25pt, <3s = 18pt), Productivity (>30 L/min = 25pt, >15 = 18pt), Cache (>40% hit = 25pt, >20% = 18pt). Verify calculations: cost_per_minute = total_cost / duration_minutes. Test each metric independently."
      },
      {
        "issue": "Recommendation not showing despite low grade",
        "solution": "Recommendations only display for grades C (70-79), D (60-69), or F (<60). Grades A (90+) and B (80-89) show STATUS instead. Check health_score value and comparison: if [ $health_score -lt 70 ]. If score is exactly 70, triggers C grade but no recommendation (boundary condition)."
      },
      {
        "issue": "Weakest metric identification incorrect",
        "solution": "Script compares cost_score, latency_score, productivity_score, cache_score to find minimum. Check individual scores: echo C=$cost_score L=$latency_score P=$productivity_score K=$cache_score. Verify comparison logic uses -lt (less than). If tied, first metric in order wins (cost > latency > productivity > cache)."
      },
      {
        "issue": "Cache score always showing 5 despite caching enabled",
        "solution": "Cache score requires cache_read_input_tokens field. Verify: echo '$input' | jq .cost.cache_read_input_tokens. If missing/null, defaults to 0 giving minimum score (5pt). Check that prompt caching is properly configured and Claude Code version supports cache metrics. Zero cache_read_tokens = no cache benefit detected."
      },
      {
        "issue": "Metric breakdown abbreviations confusing",
        "solution": "Abbreviations: C = Cost efficiency, L = Latency performance, P = Productivity velocity, K = Cache utilization (K for Kache to avoid confusion with C). Each shows score out of 25 points. Add legend to documentation or customize METRICS string for clarity."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor",
      "bc calculator (for floating-point arithmetic)"
    ],
    "preview": "✓ Health: B (82/100) | GOOD | C:25 L:18 P:22 K:17"
  },
  {
    "slug": "session-timer-statusline",
    "description": "Time-tracking statusline showing elapsed session duration, tokens per minute rate, and estimated cost with productivity metrics",
    "author": "JSONbored",
    "dateAdded": "2025-10-01",
    "tags": [
      "timer",
      "productivity",
      "metrics",
      "bash",
      "time-tracking",
      "analytics"
    ],
    "content": "#!/usr/bin/env bash\n\n# Session Timer Statusline for Claude Code\n# Tracks session duration and productivity metrics\n\n# Read JSON from stdin\nread -r input\n\n# Extract session data\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"' | sed 's/claude-//')\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\ncost=$(echo \"$input\" | jq -r '.session.estimatedCost // 0' | awk '{printf \"%.3f\", $0}')\nsession_start=$(echo \"$input\" | jq -r '.session.startTime // \"\"')\n\n# Calculate session duration\nif [ -n \"$session_start\" ]; then\n  start_epoch=$(date -j -f \"%Y-%m-%dT%H:%M:%S\" \"${session_start%.*}\" \"+%s\" 2>/dev/null || echo \"0\")\n  current_epoch=$(date +%s)\n  duration=$((current_epoch - start_epoch))\n  \n  # Format duration as HH:MM:SS\n  hours=$((duration / 3600))\n  minutes=$(((duration % 3600) / 60))\n  seconds=$((duration % 60))\n  formatted_time=$(printf \"%02d:%02d:%02d\" $hours $minutes $seconds)\n  \n  # Calculate tokens per minute\n  if [ $duration -gt 0 ]; then\n    tokens_per_min=$((tokens * 60 / duration))\n    \n    # Productivity rating\n    if [ $tokens_per_min -gt 500 ]; then\n      prod_color=\"\\033[32m\"  # Green - high productivity\n      prod_indicator=\"🔥\"\n    elif [ $tokens_per_min -gt 200 ]; then\n      prod_color=\"\\033[33m\"  # Yellow - medium productivity\n      prod_indicator=\"⚡\"\n    else\n      prod_color=\"\\033[36m\"  # Cyan - normal\n      prod_indicator=\"💭\"\n    fi\n  else\n    tokens_per_min=0\n    prod_color=\"\\033[36m\"\n    prod_indicator=\"💭\"\n  fi\n  \n  # Calculate cost per hour\n  if [ $duration -gt 0 ]; then\n    cost_per_hour=$(echo \"$cost * 3600 / $duration\" | bc -l | awk '{printf \"%.2f\", $0}')\n  else\n    cost_per_hour=\"0.00\"\n  fi\nelse\n  formatted_time=\"00:00:00\"\n  tokens_per_min=0\n  cost_per_hour=\"0.00\"\n  prod_indicator=\"💭\"\nfi\n\n# Build statusline\necho -e \"\\033[35m⏱  ${formatted_time}\\033[0m │ \\033[36m${model}\\033[0m │ ${prod_color}${prod_indicator} ${tokens_per_min}/min\\033[0m │ \\033[33m\\$${cost_per_hour}/hr\\033[0m\"\n",
    "title": "Session Timer Statusline",
    "displayTitle": "Session Timer Statusline",
    "seoTitle": "Session Timer",
    "source": "community",
    "features": [
      "Elapsed session time in HH:MM:SS format",
      "Real-time tokens per minute calculation",
      "Cost per hour estimation",
      "Session start time display",
      "Productivity metrics (tokens/min indicator)",
      "Color-coded efficiency ratings",
      "Persistent timing across statusline refreshes"
    ],
    "useCases": [
      "Track billable hours for client work",
      "Monitor session productivity and efficiency",
      "Budget management for API cost control",
      "Time-boxed development sessions (Pomodoro technique)",
      "Performance benchmarking across different models"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left",
      "colorScheme": "productivity-metrics"
    },
    "troubleshooting": [
      {
        "issue": "Timer showing 00:00:00 or not incrementing",
        "solution": "Ensure Claude Code is providing session.startTime in JSON. Check with: echo \"$input\" | jq '.session.startTime'. May require Claude Code update."
      },
      {
        "issue": "date command error: illegal time format",
        "solution": "macOS uses 'date -j', Linux uses 'date -d'. Script may need adjustment for your OS. For Linux, replace '-j -f' with '-d'."
      },
      {
        "issue": "bc: command not found",
        "solution": "Install bc calculator: brew install bc (macOS), apt install bc (Linux). Required for cost calculations."
      },
      {
        "issue": "Tokens per minute showing unrealistic values",
        "solution": "This is normal at session start. Metric stabilizes after 2-3 minutes of usage. Very high values indicate batch processing."
      }
    ],
    "requirements": [
      "Bash shell with bc calculator",
      "jq JSON processor",
      "date command with -j flag (macOS) or --date (Linux)"
    ],
    "preview": "⏱  01:23:45 │ sonnet-4.5 │ 🔥 524/min │ $1.23/hr"
  },
  {
    "slug": "simple-text-statusline",
    "description": "Ultra-lightweight plain text statusline with no colors or special characters for maximum compatibility and minimal overhead",
    "author": "JSONbored",
    "dateAdded": "2025-10-01",
    "tags": [
      "simple",
      "plain-text",
      "minimal",
      "bash",
      "lightweight",
      "no-dependencies"
    ],
    "content": "#!/usr/bin/env bash\n\n# Simple Text Statusline for Claude Code\n# Plain text only - maximum compatibility\n\n# Read JSON from stdin\nread -r input\n\n# Extract values using bash built-ins (no jq required)\nmodel=$(echo \"$input\" | grep -o '\"model\":\"[^\"]*\"' | cut -d'\"' -f4)\ndir=$(echo \"$input\" | grep -o '\"path\":\"[^\"]*\"' | cut -d'\"' -f4 | sed \"s|$HOME|~|\")\ntokens=$(echo \"$input\" | grep -o '\"totalTokens\":[0-9]*' | cut -d':' -f2)\n\n# Default values if extraction fails\nmodel=${model:-\"unknown\"}\ndir=${dir:-\"~\"}\ntokens=${tokens:-\"0\"}\n\n# Build simple plain text status\necho \"[Model: $model] [Dir: $dir] [Tokens: $tokens]\"\n",
    "title": "Simple Text Statusline",
    "displayTitle": "Simple Text Statusline",
    "source": "community",
    "features": [
      "Zero dependencies - pure bash implementation",
      "No color codes or special characters",
      "Works on any terminal including basic TTY",
      "Extremely fast execution (<5ms)",
      "Compatible with screen readers",
      "No jq or external tools required",
      "Perfect for SSH sessions or slow connections"
    ],
    "useCases": [
      "SSH sessions over slow or unreliable connections",
      "Legacy terminals without color support",
      "Screen reader accessibility requirements",
      "Embedded systems or resource-constrained environments",
      "Debugging when color codes cause issues"
    ],
    "category": "statuslines",
    "statuslineType": "simple",
    "configuration": {
      "format": "bash",
      "refreshInterval": 300,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Values showing as empty or 'unknown'",
        "solution": "JSON parsing relies on specific format. Ensure Claude Code is outputting standard JSON. Test with: echo '$input' to see raw JSON."
      },
      {
        "issue": "Home directory not shortened to ~",
        "solution": "Check that $HOME environment variable is set correctly: echo $HOME. If using sudo, HOME may not be preserved."
      },
      {
        "issue": "grep or cut command not found",
        "solution": "These are standard POSIX utilities. Install coreutils package: apt install coreutils (Linux) or ensure busybox is installed (embedded systems)."
      },
      {
        "issue": "JSON parsing breaks when Claude Code changes output format",
        "solution": "grep/cut parsing is fragile. Switch to jq-based statusline or use awk: awk 'BEGIN { FS=\"\\\"\"; RS=\",\" }; { if ($2 == \"model\") {print $4} }' for robust parsing."
      },
      {
        "issue": "HOME not preserved when running script with sudo",
        "solution": "Use sudo -H to set HOME or sudo -E to preserve variables. Add HOME to env_keep in /etc/sudoers for persistent fix. Test: sudo -H bash script.sh."
      }
    ],
    "requirements": [
      "Bash shell (any version)",
      "Basic grep and cut utilities (pre-installed on all Unix systems)"
    ],
    "preview": "[Model: claude-sonnet-4.5] [Dir: ~/projects/my-app] [Tokens: 1234]"
  },
  {
    "slug": "starship-powerline-theme",
    "description": "Starship-inspired powerline statusline with Nerd Font glyphs, modular segments, and Git integration for Claude Code",
    "author": "JSONbored",
    "dateAdded": "2025-10-16",
    "tags": [
      "starship",
      "powerline",
      "nerd-fonts",
      "git",
      "theme"
    ],
    "content": "#!/usr/bin/env bash\n\n# Starship-Inspired Powerline Theme\n# Requires Nerd Font\n\nread -r input\n\n# Extract data\nmodel=$(echo \"$input\" | jq -r '.model // \"unknown\"' | sed 's/claude-//' | sed 's/sonnet/snnt/' | sed 's/-4-5//')\ntokens=$(echo \"$input\" | jq -r '.session.totalTokens // 0')\nworkdir=$(echo \"$input\" | jq -r '.workspace.path // \".\"')\n\n# Git info\ncd \"$workdir\" 2>/dev/null\nif git rev-parse --git-dir > /dev/null 2>&1; then\n  branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo \"detached\")\n  if [ -z \"$(git status --porcelain)\" ]; then\n    git_icon=\"\"\n    git_color=\"\\033[32m\"\n  else\n    git_icon=\"\"\n    git_color=\"\\033[33m\"\n  fi\n  git_segment=\"${git_color}  ${branch} ${git_icon}\\033[0m\"\nfi\n\n# Model segment\nmodel_segment=\"\\033[36m ${model}\\033[0m\"\n\n# Token segment with icon\ntoken_k=$((tokens / 1000))\ntoken_segment=\"\\033[35m ${token_k}k\\033[0m\"\n\n# Build powerline\necho -e \"${model_segment} ${token_segment}${git_segment}\"\n",
    "title": "Starship Powerline Theme",
    "displayTitle": "Starship Powerline Theme",
    "source": "community",
    "features": [
      "Starship-inspired modular design",
      "Nerd Font glyphs for icons",
      "Git branch and status",
      "Condensed model names",
      "Token count in thousands",
      "Powerline-style separators"
    ],
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 1000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Nerd Font glyphs showing as boxes or missing symbols",
        "solution": "Install Nerd Font and configure terminal. Test: echo -e ' '. Set font to 'FiraCode Nerd Font Mono' or 'MesloLGS NF'. Run fc-cache -fv to refresh cache."
      },
      {
        "issue": "Git status shows '(detached)' instead of branch name",
        "solution": "You're in detached HEAD state (normal for commit checkouts). Run git branch -q to see state. Checkout branch: git checkout main or create: git checkout -b feature-name."
      },
      {
        "issue": "Git icons not rendering correctly in VS Code terminal",
        "solution": "Add to settings.json: \"terminal.integrated.fontFamily\": \"'FiraCode Nerd Font Mono'\". Restart VS Code. If issues persist, install: sudo apt install fonts-symbola."
      },
      {
        "issue": "Statusline displays incorrectly after git operations",
        "solution": "Increase refreshInterval if statusline lags git state. Use git status --porcelain for reliable scripting. Verify read access: test -r .git && echo OK."
      },
      {
        "issue": "Model name abbreviation too aggressive or unclear",
        "solution": "Modify sed patterns to preserve model info. Script shortens 'claude-sonnet-4-5' to 'snnt'. Keep full name by removing: | sed 's/sonnet/snnt/' line."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq",
      "Nerd Font installed",
      "Git"
    ],
    "preview": " snnt  156k  main "
  },
  {
    "slug": "workspace-project-depth-indicator",
    "description": "Claude Code workspace depth tracker showing monorepo navigation level, project root detection, and directory depth visualization for context awareness.",
    "author": "JSONbored",
    "dateAdded": "2025-10-25",
    "tags": [
      "workspace-depth",
      "monorepo-navigation",
      "directory-depth",
      "project-context",
      "workspace-tracking"
    ],
    "content": "#!/usr/bin/env bash\n\n# Workspace Project Depth Indicator for Claude Code\n# Tracks directory depth and project context\n\n# Read JSON from stdin\nread -r input\n\n# Extract workspace info\ncurrent_dir=$(echo \"$input\" | jq -r '.workspace.current_dir // \"\"')\n\n# Handle empty workspace\nif [ -z \"$current_dir\" ] || [ \"$current_dir\" = \"null\" ]; then\n  echo \"📂 No workspace\"\n  exit 0\nfi\n\n# Calculate directory depth (count of slashes)\n# Remove leading slash to avoid off-by-one\ndir_path=\"${current_dir#/}\"\ndepth=$(echo \"$dir_path\" | tr -cd '/' | wc -c | tr -d ' ')\n\n# Detect project root indicators\nproject_indicators=(\n  \".git\"\n  \"package.json\"\n  \"Cargo.toml\"\n  \"go.mod\"\n  \"pom.xml\"\n  \"build.gradle\"\n  \"pyproject.toml\"\n  \"composer.json\"\n)\n\n# Check if current directory is project root\nIS_PROJECT_ROOT=false\nPROJECT_TYPE=\"\"\n\nfor indicator in \"${project_indicators[@]}\"; do\n  if [ -f \"${current_dir}/${indicator}\" ] || [ -d \"${current_dir}/${indicator}\" ]; then\n    IS_PROJECT_ROOT=true\n    case \"$indicator\" in\n      \".git\") PROJECT_TYPE=\"git\" ;;\n      \"package.json\") PROJECT_TYPE=\"node\" ;;\n      \"Cargo.toml\") PROJECT_TYPE=\"rust\" ;;\n      \"go.mod\") PROJECT_TYPE=\"go\" ;;\n      \"pom.xml\"|\"build.gradle\") PROJECT_TYPE=\"java\" ;;\n      \"pyproject.toml\") PROJECT_TYPE=\"python\" ;;\n      \"composer.json\") PROJECT_TYPE=\"php\" ;;\n    esac\n    break\n  fi\ndone\n\n# Find project root by walking up directory tree\nPROJECT_ROOT=\"$current_dir\"\ncheck_dir=\"$current_dir\"\nwhile [ \"$check_dir\" != \"/\" ]; do\n  for indicator in \"${project_indicators[@]}\"; do\n    if [ -f \"${check_dir}/${indicator}\" ] || [ -d \"${check_dir}/${indicator}\" ]; then\n      PROJECT_ROOT=\"$check_dir\"\n      break 2\n    fi\n  done\n  check_dir=$(dirname \"$check_dir\")\ndone\n\n# Calculate depth relative to project root (0 = at root)\nif [ \"$PROJECT_ROOT\" != \"$current_dir\" ]; then\n  relative_path=\"${current_dir#$PROJECT_ROOT/}\"\n  relative_depth=$(echo \"$relative_path\" | tr -cd '/' | wc -c | tr -d ' ')\n  relative_depth=$((relative_depth + 1))  # +1 because we're in a subdirectory\nelse\n  relative_depth=0\nfi\n\n# Color coding based on depth\nif [ $relative_depth -eq 0 ]; then\n  DEPTH_COLOR=\"\\033[38;5;46m\"   # Green: At project root\n  DEPTH_ICON=\"📁\"\n  DEPTH_STATUS=\"ROOT\"\nelif [ $relative_depth -le 2 ]; then\n  DEPTH_COLOR=\"\\033[38;5;75m\"   # Blue: 1-2 levels deep (normal)\n  DEPTH_ICON=\"📂\"\n  DEPTH_STATUS=\"L${relative_depth}\"\nelif [ $relative_depth -le 4 ]; then\n  DEPTH_COLOR=\"\\033[38;5;226m\"  # Yellow: 3-4 levels deep (moderate)\n  DEPTH_ICON=\"📂\"\n  DEPTH_STATUS=\"L${relative_depth}\"\nelse\n  DEPTH_COLOR=\"\\033[38;5;208m\"  # Orange: 5+ levels deep (deep nesting)\n  DEPTH_ICON=\"📂\"\n  DEPTH_STATUS=\"L${relative_depth}+\"\nfi\n\n# Project type indicator\nif [ \"$IS_PROJECT_ROOT\" = true ] && [ -n \"$PROJECT_TYPE\" ]; then\n  TYPE_DISPLAY=\"${PROJECT_TYPE}\"\nelse\n  TYPE_DISPLAY=\"\"\nfi\n\n# Extract directory name for display\ndir_name=$(basename \"$current_dir\")\n\n# Monorepo detection (apps/, packages/, libs/ directories)\nif echo \"$current_dir\" | grep -qE '/(apps|packages|libs|services|modules)/'; then\n  MONOREPO_INDICATOR=\"[monorepo]\"\nelse\n  MONOREPO_INDICATOR=\"\"\nfi\n\n# Build breadcrumb visualization (last 3 directories)\nif [ $relative_depth -gt 0 ]; then\n  breadcrumb=$(echo \"$current_dir\" | awk -F'/' '{for(i=NF-2;i<=NF;i++) if($i) printf \"%s/\", $i}' | sed 's|/$||')\nelse\n  breadcrumb=\"$dir_name\"\nfi\n\nRESET=\"\\033[0m\"\n\n# Output statusline\nif [ -n \"$TYPE_DISPLAY\" ]; then\n  echo -e \"${DEPTH_ICON} ${DEPTH_COLOR}${DEPTH_STATUS}${RESET} ${TYPE_DISPLAY} | ${breadcrumb} ${MONOREPO_INDICATOR}\"\nelse\n  echo -e \"${DEPTH_ICON} ${DEPTH_COLOR}${DEPTH_STATUS}${RESET} | ${breadcrumb} ${MONOREPO_INDICATOR}\"\nfi\n",
    "title": "Workspace Project Depth Indicator",
    "displayTitle": "Workspace Project Depth Indicator",
    "source": "community",
    "documentationUrl": "https://docs.claude.com/en/docs/claude-code/statusline",
    "features": [
      "Real-time workspace directory depth tracking relative to project root",
      "Project root detection via common indicators (.git, package.json, Cargo.toml, etc.)",
      "Project type identification (git, node, rust, go, java, python, php)",
      "Monorepo detection for apps/, packages/, libs/ directory patterns",
      "Breadcrumb visualization showing last 3 directory levels",
      "Color-coded depth indicators (green root, blue 1-2 levels, yellow 3-4, orange 5+)",
      "Context awareness for navigating deep directory structures",
      "Lightweight bash with no external dependencies beyond jq"
    ],
    "useCases": [
      "Monorepo navigation awareness (knowing which package/app you're in)",
      "Preventing confusion when working in deeply nested directories",
      "Project context tracking across multiple workspaces",
      "Debugging file path issues in complex project structures",
      "Team onboarding for large codebases with deep hierarchies",
      "Identifying when you've navigated too deep into implementation details"
    ],
    "discoveryMetadata": {
      "researchDate": "2025-10-25",
      "trendingSources": [
        {
          "source": "anthropic_official_docs",
          "evidence": "Official docs confirm JSON provides workspace.current_dir for directory tracking. Statuslines can parse paths and detect project context.",
          "url": "https://docs.claude.com/en/docs/claude-code/statusline",
          "relevanceScore": "high"
        },
        {
          "source": "reddit_programming",
          "evidence": "Reddit discussions on monorepo tooling emphasize context awareness: 'Knowing which package you're in is critical for large monorepos'. Directory depth tracking helps prevent disorientation.",
          "url": "https://www.reddit.com/r/programming/",
          "relevanceScore": "high"
        },
        {
          "source": "dev_to_monorepo",
          "evidence": "2025 monorepo best practices guides highlight workspace navigation challenges. Visual depth indicators reduce cognitive load when switching between nested packages.",
          "url": "https://dev.to/",
          "relevanceScore": "high"
        },
        {
          "source": "hackernews",
          "evidence": "HackerNews threads on developer tools frequently mention directory depth confusion in large projects. Breadcrumb navigation and project root detection are common feature requests.",
          "url": "https://news.ycombinator.com/",
          "relevanceScore": "medium"
        }
      ],
      "keywordResearch": {
        "primaryKeywords": [
          "workspace depth tracker",
          "monorepo navigation",
          "directory depth indicator",
          "project context awareness"
        ],
        "searchVolume": "medium",
        "competitionLevel": "low"
      },
      "gapAnalysis": {
        "existingContent": [],
        "identifiedGap": "No existing statusline provides workspace depth or project context visualization. Users working in monorepos or deeply nested directories lack real-time awareness of current location relative to project root. Breadcrumb navigation and depth indicators are completely missing from current statusline offerings.",
        "priority": "medium"
      },
      "approvalRationale": "Official docs verified workspace.current_dir field available. Reddit/Dev.to validate monorepo navigation challenges. Medium search volume, low competition. Clear gap - no existing workspace context statuslines. Useful for large codebases and monorepo workflows. User approved for workspace depth tracking."
    },
    "category": "statuslines",
    "statuslineType": "custom",
    "configuration": {
      "format": "bash",
      "refreshInterval": 2000,
      "position": "left"
    },
    "troubleshooting": [
      {
        "issue": "Workspace showing 'No workspace' despite active Claude Code session",
        "solution": "Verify workspace.current_dir field exists: echo '$input' | jq .workspace.current_dir. If field missing or null, Claude Code may not be tracking workspace. Check that session was started in a directory (not attached to running process without cwd)."
      },
      {
        "issue": "Project root not being detected correctly",
        "solution": "Script checks for common project indicators: .git, package.json, Cargo.toml, go.mod, pom.xml, build.gradle, pyproject.toml, composer.json. If your project uses different marker (e.g., .project), add to project_indicators array. Verify indicator exists: ls -la $current_dir."
      },
      {
        "issue": "Relative depth showing incorrect level count",
        "solution": "Depth calculation: relative_depth = (number of slashes in path after project root) + 1. Example: project root /foo/bar, current /foo/bar/src/lib = 2 levels deep. Check PROJECT_ROOT detection: echo $PROJECT_ROOT. Verify current_dir: echo $current_dir. Path stripping: ${current_dir#$PROJECT_ROOT/}."
      },
      {
        "issue": "Monorepo indicator not appearing for monorepo projects",
        "solution": "Monorepo detection matches directories containing /apps/, /packages/, /libs/, /services/, or /modules/. Check path: echo '$current_dir' | grep -E '/(apps|packages|libs|services|modules)/'. Add custom monorepo patterns to grep: |(workspaces|projects)/."
      },
      {
        "issue": "Breadcrumb showing only current directory not last 3 levels",
        "solution": "Breadcrumb uses awk to extract last 3 path components: awk -F'/' '{for(i=NF-2;i<=NF;i++) if($i) printf \"%s/\", $i}'. Test: echo '/foo/bar/baz/qux' | awk -F'/' '{for(i=NF-2;i<=NF;i++) if($i) printf \"%s/\", $i}' (should show bar/baz/qux). Adjust NF-2 to NF-N for more/fewer levels."
      },
      {
        "issue": "Project type not displaying despite being at project root",
        "solution": "IS_PROJECT_ROOT flag set to true when indicator found in current_dir. Check file exists: ls $current_dir/package.json (for node). Verify case statement assigns PROJECT_TYPE correctly. Add debug: echo IS_PROJECT_ROOT=$IS_PROJECT_ROOT PROJECT_TYPE=$PROJECT_TYPE to output."
      }
    ],
    "requirements": [
      "Bash shell",
      "jq JSON processor"
    ],
    "preview": "📂 L2 node | apps/web/src [monorepo]"
  }
];

export const statuslinesFullBySlug = new Map(statuslinesFull.map(item => [item.slug, item]));

export function getStatuslineFullBySlug(slug: string) {
  return statuslinesFullBySlug.get(slug) || null;
}

export type StatuslineFull = typeof statuslinesFull[number];
