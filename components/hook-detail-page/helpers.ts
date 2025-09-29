/**
 * Hook Detail Page Helper Functions
 * Utility functions for generating requirements, troubleshooting, and other hook-specific data
 */

import type { HookContent } from '@/lib/schemas/content.schema';

/**
 * Generate requirements list based on hook configuration and script content
 */
export const generateRequirements = (item: HookContent): string[] => {
  const baseRequirements = ['Claude Desktop or Claude Code'];
  const scriptContent =
    typeof item.configuration?.scriptContent === 'string' ? item.configuration.scriptContent : '';
  const detectedRequirements: string[] = [];

  // Detect common tools and dependencies from script content
  const detections = [
    { pattern: /jq\s/, requirement: 'jq command-line tool for JSON parsing' },
    { pattern: /prettier\s|npx prettier/, requirement: 'Prettier code formatter' },
    { pattern: /black\s|python.*black/, requirement: 'Black Python formatter' },
    { pattern: /gofmt\s/, requirement: 'Go formatting tools (gofmt)' },
    { pattern: /rustfmt\s/, requirement: 'Rust formatting tools (rustfmt)' },
    { pattern: /ruff\s/, requirement: 'Ruff Python linter and formatter' },
    { pattern: /npm\s|npx\s/, requirement: 'Node.js and npm' },
    { pattern: /pip\s|python\s/, requirement: 'Python 3.x' },
    { pattern: /axe-core/, requirement: 'Node.js dependencies (axe-core)' },
    { pattern: /curl\s/, requirement: 'curl command-line tool' },
    { pattern: /git\s/, requirement: 'Git version control' },
    { pattern: /docker\s/, requirement: 'Docker container runtime' },
    { pattern: /kubectl\s/, requirement: 'Kubernetes CLI (kubectl)' },
    { pattern: /terraform\s/, requirement: 'Terraform CLI' },
    { pattern: /chmod\s/, requirement: 'Execute permissions on hook scripts' },
  ];

  // Check script content for patterns
  detections.forEach(({ pattern, requirement }) => {
    if (pattern.test(scriptContent) && !detectedRequirements.includes(requirement)) {
      detectedRequirements.push(requirement);
    }
  });

  // Add manual requirements if they exist, filtering out duplicates
  const manualRequirements = (item.requirements || []).filter(
    (req: string) =>
      !(
        req.toLowerCase().includes('claude desktop') ||
        req.toLowerCase().includes('claude code') ||
        detectedRequirements.some(
          (detected) =>
            detected.toLowerCase().includes(req.toLowerCase()) ||
            req.toLowerCase().includes(detected.toLowerCase())
        )
      )
  );

  return [...baseRequirements, ...detectedRequirements, ...manualRequirements];
};

/**
 * Generate troubleshooting guide based on hook configuration
 */
export const generateTroubleshooting = (
  item: HookContent
): Array<{ issue: string; solution: string }> => {
  const scriptContent =
    typeof item.configuration?.scriptContent === 'string' ? item.configuration.scriptContent : '';
  const generatedTroubleshooting: Array<{ issue: string; solution: string }> = [];

  // Common troubleshooting patterns based on detected tools
  const troubleshootingPatterns = [
    {
      pattern: /chmod\s/,
      issue: 'Script permission denied',
      solution: `Run chmod +x .claude/hooks/${item.slug}.sh to make script executable`,
    },
    {
      pattern: /jq\s/,
      issue: 'jq command not found',
      solution: 'Install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)',
    },
    {
      pattern: /prettier\s|npx prettier/,
      issue: 'Prettier not found in PATH',
      solution: 'Install Prettier: npm install -g prettier',
    },
    {
      pattern: /black\s|python.*black/,
      issue: 'Black formatter not found',
      solution: 'Install Black: pip install black',
    },
    {
      pattern: /ruff\s/,
      issue: 'Ruff not found',
      solution: 'Install Ruff: pip install ruff',
    },
    {
      pattern: /npm\s|npx\s/,
      issue: 'npm/npx command not found',
      solution: 'Install Node.js from nodejs.org or use a version manager like nvm',
    },
    {
      pattern: /python\s|python3\s/,
      issue: 'Python not found',
      solution: 'Install Python 3.x from python.org or use a version manager like pyenv',
    },
  ];

  // Check script content for patterns
  troubleshootingPatterns.forEach(({ pattern, issue, solution }) => {
    if (pattern.test(scriptContent) && !generatedTroubleshooting.some((t) => t.issue === issue)) {
      generatedTroubleshooting.push({ issue, solution });
    }
  });

  // Add generic troubleshooting
  if (!generatedTroubleshooting.some((t) => t.issue.includes('permission'))) {
    generatedTroubleshooting.push({
      issue: 'Hook not executing',
      solution: 'Check that the script file exists in ~/.claude/hooks/ and has execute permissions',
    });
  }

  // Add manual troubleshooting if it exists
  const manualTroubleshooting = item.troubleshooting || [];
  manualTroubleshooting.forEach((trouble) => {
    if (typeof trouble === 'string') {
      // Handle string troubleshooting items
      if (!generatedTroubleshooting.some((t) => typeof t === 'string' && t === trouble)) {
        generatedTroubleshooting.push({
          issue: trouble,
          solution: 'Follow the documentation for resolution',
        });
      }
    } else if (
      !generatedTroubleshooting.some(
        (t) => typeof t === 'object' && t.issue === trouble.issue && t.solution === trouble.solution
      )
    ) {
      generatedTroubleshooting.push(trouble);
    }
  });

  return generatedTroubleshooting;
};

/**
 * Extract available hooks from documentation content
 */
export const extractAvailableHooks = (documentation: string): string[] => {
  const hooks = [];
  if (/pre-tool-use|PreToolUse/.test(documentation)) {
    hooks.push('Pre-Tool Use Hook - Runs before any tool is executed');
  }
  if (/post-tool-use|PostToolUse/.test(documentation)) {
    hooks.push('Post-Tool Use Hook - Runs after tool execution completes');
  }
  if (/pre-message|PreMessage/.test(documentation)) {
    hooks.push('Pre-Message Hook - Runs before message processing');
  }
  if (/post-message|PostMessage/.test(documentation)) {
    hooks.push('Post-Message Hook - Runs after message processing');
  }
  if (/pre-file-write|PreFileWrite/.test(documentation)) {
    hooks.push('Pre-File Write Hook - Runs before file write operations');
  }
  if (/post-file-write|PostFileWrite/.test(documentation)) {
    hooks.push('Post-File Write Hook - Runs after file write operations');
  }
  return hooks;
};

/**
 * Generate use cases for a hook based on its type and tags
 */
export const generateUseCases = (item: HookContent): string[] => {
  // If manual use cases exist, use them (they're usually more specific and valuable)
  if (item.useCases && item.useCases.length > 0) {
    return [...item.useCases];
  }

  const generatedUseCases: string[] = [];
  const tags = item.tags || [];
  const hookType = item.hookType;

  // Generate base use cases based on hook type
  if (hookType === 'PostToolUse') {
    generatedUseCases.push('Automate post-processing tasks after Claude modifies files');
    generatedUseCases.push('Maintain code quality and consistency across projects');
  } else if (hookType === 'PreToolUse') {
    generatedUseCases.push('Validate inputs before Claude processes files');
    generatedUseCases.push('Implement safety checks and permissions validation');
  }

  // Add tag-specific use cases
  const tagBasedUseCases: Record<string, string[]> = {
    formatting: [
      'Enforce consistent code style across team projects',
      'Reduce code review friction by handling formatting automatically',
    ],
    testing: ['Automated testing in CI/CD pipelines', 'Real-time feedback during development'],
    security: ['Continuous security monitoring', 'Automated vulnerability detection'],
    documentation: [
      'Keep documentation synchronized with code changes',
      'Generate comprehensive project documentation',
    ],
    git: ['Streamline version control workflows', 'Automate commit and branch management'],
    automation: ['Reduce manual development tasks', 'Improve development workflow efficiency'],
  };

  // Add use cases based on tags
  tags.forEach((tag: string) => {
    const tagUseCases = tagBasedUseCases[tag.toLowerCase()];
    if (tagUseCases) {
      tagUseCases.forEach((useCase) => {
        if (!generatedUseCases.includes(useCase)) {
          generatedUseCases.push(useCase);
        }
      });
    }
  });

  // Ensure we have at least some generic use cases
  if (generatedUseCases.length === 0) {
    generatedUseCases.push('Automate repetitive development tasks');
    generatedUseCases.push('Improve code quality and consistency');
    generatedUseCases.push('Streamline development workflows');
  }

  return generatedUseCases.slice(0, 5); // Limit to 5 use cases max
};

/**
 * Generate installation steps from hook configuration
 */
export const generateInstallationSteps = (
  item: HookContent
): Array<{ step: number; instruction: string; command?: string }> => {
  const steps: Array<{ step: number; instruction: string; command?: string }> = [];

  // Step 1: Create hooks directory
  steps.push({
    step: 1,
    instruction: "Create the Claude hooks directory if it doesn't exist",
    command: 'mkdir -p ~/.claude/hooks',
  });

  // Step 2: Create the hook script file
  const scriptPath = `~/.claude/hooks/${item.slug}.sh`;
  steps.push({
    step: 2,
    instruction: `Create the hook script file at ${scriptPath}`,
    command: `cat > ${scriptPath} << 'EOF'\n${item.configuration?.scriptContent || '# Hook script content'}\nEOF`,
  });

  // Step 3: Make executable
  steps.push({
    step: 3,
    instruction: 'Make the script executable',
    command: `chmod +x ${scriptPath}`,
  });

  // Step 4: Configure Claude settings
  steps.push({
    step: 4,
    instruction: 'Configure the hook in Claude settings',
  });

  // Add any custom installation steps from the item
  if (
    item.installation?.claudeCode &&
    typeof item.installation.claudeCode === 'object' &&
    item.installation.claudeCode.steps
  ) {
    item.installation.claudeCode.steps.forEach((customStep: string) => {
      steps.push({
        step: steps.length + 1,
        instruction: customStep,
      });
    });
  }

  return steps;
};
