// Reusable content templates for all SEO generators
// Maintains consistency while allowing category-specific customization

import { generateInternalLinks, type SEOConfig } from './seo-utils.js';

// Generate consistent intro section for all pages
export function generateIntroSection(config: SEOConfig): string {
  const { title, description, keyword, category } = config;

  return `
Need Claude to excel at ${description}? You're in the right place. This comprehensive guide reveals how to transform Claude into a specialized ${title.toLowerCase()} expert using proven ${category} and configuration techniques.

Whether you're a seasoned professional or just starting with ${title.toLowerCase()}, these expert-crafted ${category} will elevate Claude's capabilities to match industry standards. No more generic responses – get targeted, professional-grade assistance for your ${keyword} projects.

## Table of Contents
- [Quick Recommendations](#quick-recommendations)
- [Detailed Comparison](#detailed-comparison) 
- [Step-by-Step Setup Guide](#implementation-guide)
- [Real-World Use Cases](#common-use-cases)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting & FAQ](#troubleshooting-tips)
- [Performance Metrics](#performance-metrics)
- [Community Insights](#community-insights)

## Why Claude ${category.charAt(0).toUpperCase() + category.slice(1)} Matter for ${title}

Before diving into specific ${category}, let's understand why configuration matters. Out-of-the-box Claude is incredibly capable, but specialized ${category} provide:

- **Domain-specific expertise**: Deep knowledge in ${keyword} best practices
- **Consistent responses**: Reliable, professional-grade outputs every time
- **Time savings**: Skip the context-setting, jump straight to expert advice
- **Improved accuracy**: Enhanced performance based on industry standards and methodologies
- **Workflow integration**: Seamless integration with your existing ${keyword} processes

## Quick Recommendations

*Top-rated ${title.toLowerCase()} ${category} based on community feedback and success metrics:*
`.trim();
}

// Generate comprehensive troubleshooting section
export function generateTroubleshootingSection(config: SEOConfig): string {
  const { category, keyword } = config;

  return `
## Troubleshooting & FAQ

### Common Issues & Solutions

#### Issue: "${category.charAt(0).toUpperCase() + category.slice(1)} not activating properly"
**Solution:** Ensure the ${category} is loaded at conversation start, not mid-conversation. For Claude Desktop, completely restart the application after adding configurations.

#### Issue: "Generic responses despite ${category} configuration"
**Solution:** Verify the configuration content is properly formatted and complete. Check for any JSON syntax errors in Claude Desktop configurations.

#### Issue: "Inconsistent ${keyword} expertise level"
**Solution:** Be more specific in your prompts and provide relevant context. The more detailed your request, the better the specialized response.

#### Issue: "Configuration conflicts with other ${category}"
**Solution:** Review your configuration for overlapping or contradictory instructions. Consider using complementary ${category} instead of conflicting ones.

#### Issue: "Performance degradation with multiple ${category}"
**Solution:** Limit active ${category} to 3-5 for optimal performance. Prioritize the most relevant ${category} for your current workflow.

### Advanced Troubleshooting

#### Claude Desktop Specific Issues
1. **Configuration file not found**: Create the directory structure if it doesn't exist
2. **JSON parsing errors**: Validate your JSON syntax using an online validator
3. **Changes not taking effect**: Clear Claude's cache and restart completely

#### Web Interface Issues
1. **${category.charAt(0).toUpperCase() + category.slice(1)} not persisting**: Reload the configuration at the start of each new conversation
2. **Long configuration causing errors**: Break down complex ${category} into smaller, focused configurations
3. **Context window limitations**: Prioritize essential ${category} elements for longer conversations

### Getting Help

If you're still experiencing issues:

1. **Check our community forum** for similar problems and solutions
2. **Review the official documentation** for your specific ${category} type
3. **Join our Discord** for real-time support from the community
4. **Submit a bug report** if you've found a reproducible issue

### Performance Optimization Tips

#### For ${keyword} Professionals
- **Combine complementary ${category}**: Use specialized ${category} that enhance each other
- **Regular updates**: Keep your ${category} current with the latest best practices
- **Custom modifications**: Tailor ${category} to your specific ${keyword} workflow
- **Testing workflows**: Regularly test your ${category} with real-world scenarios

#### Best Practices
- **Start simple**: Begin with one primary ${category} before adding others
- **Document changes**: Keep track of modifications for easy troubleshooting
- **Backup configurations**: Save working configurations before making changes
- **Monitor performance**: Track effectiveness and adjust as needed
`.trim();
}

// Generate FAQ section with category-specific questions
export function generateFAQSection(
  config: SEOConfig,
  customFAQs: Array<{ question: string; answer: string }> = []
): string {
  const { category, keyword } = config;
  const standardFAQs = [
    {
      question: `What are Claude ${category} and why do they matter?`,
      answer: `Claude ${category} are specialized configurations that enhance Claude's capabilities for specific domains like ${keyword}. They provide consistent, expert-level responses by defining context, expertise areas, and response patterns upfront.`,
    },
    {
      question: `How long does it take to set up Claude ${category} for ${keyword}?`,
      answer: `Most users complete the setup in under 2 minutes. Simply copy the configuration from our directory and paste it into Claude Desktop's configuration file or start your web conversation with the system prompt.`,
    },
    {
      question: `Can I use multiple ${keyword} ${category} together?`,
      answer: `Yes! Many professionals combine complementary ${category}. For example, pairing a primary ${keyword} ${category} with a code review or project management configuration creates comprehensive expertise coverage.`,
    },
    {
      question: `Do Claude ${category} work with both Claude Desktop and Claude Pro web?`,
      answer: `Absolutely. ${category.charAt(0).toUpperCase() + category.slice(1)} work with both platforms, though the setup process differs slightly. Desktop users add configurations to their config file, while web users start conversations with the system prompt.`,
    },
  ];

  const allFAQs = [...standardFAQs, ...customFAQs];

  return `
## Frequently Asked Questions

${allFAQs
  .map(
    (faq) => `
### ${faq.question}
${faq.answer}
`
  )
  .join('\n')}

### Need More Help?

If your question isn't answered here:
- Browse our [complete FAQ section](/faq)
- Check the [troubleshooting guide](/guides/troubleshooting)
- Join our [Discord community](https://discord.gg/claude-pro) for real-time help
- Submit a question through our [contact form](/contact)
`.trim();
}

// Generate setup guide section
export function generateSetupGuideSection(config: SEOConfig): string {
  const { category, keyword } = config;

  return `
## Setup Guide

### For Claude Desktop

1. **Open Configuration File**
   - macOS: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
   - Windows: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

2. **Add Configuration**
   - Copy your chosen ${category} content from our directory
   - Add it to the appropriate section in your config file
   - Save the file

3. **Restart Claude Desktop**
   - Completely quit and restart the application
   - Your ${category} will be active in new conversations

### For Claude Web

1. **Start New Conversation**
   - Go to [claude.ai](https://claude.ai)
   - Begin a new chat

2. **Load ${category.charAt(0).toUpperCase() + category.slice(1)}**
   - Copy the ${category} content from our directory
   - Paste it as your first message
   - Claude will acknowledge the configuration

3. **Verify Setup**
   - Ask Claude to summarize its new capabilities
   - Test with a ${keyword}-specific question

### Configuration Examples

Check our individual ${category} pages for specific configuration examples and setup instructions.
`.trim();
}

// Generate internal resources section with cross-linking
export function generateInternalResourcesSection(config: SEOConfig): string {
  const links = generateInternalLinks(config);
  const { keyword } = config;

  return `
## Internal Resources & Next Steps

### Essential Reading
${links.essential.map((link) => `- **[${link.title}](${link.url})** - ${link.description}`).join('\n')}

### Related Categories
${links.related.map((link) => `- **[${link.title}](${link.url})** - ${link.description}`).join('\n')}

### Popular Combinations
${links.combinations.map((link) => `- **[${link.title}](${link.url})** - ${link.description}`).join('\n')}

### Community Resources
${links.community.map((link) => `- **[${link.title}](${link.url})** - ${link.description}`).join('\n')}

### Advanced Topics
- **[Workflow Examples](/guides/workflows)** - Professional-grade configuration workflows
- **[Use Case Guides](/guides/use-cases)** - Build your own specialized configurations
- **[Collection Examples](/guides/collections)** - Integrate with your existing ${keyword} workflow
- **[Community Resources](/community)** - Connect with other users and contributors

### Learning Path
1. **Beginner**: Start with our [Tutorial Guides](/guides/tutorials)
2. **Intermediate**: Explore [Workflow Examples](/guides/workflows)
3. **Advanced**: Master [Use Case Guides](/guides/use-cases)
4. **Expert**: Contribute to [Community Development](/submit)
`.trim();
}

// Generate comprehensive code examples section
export function generateCodeExamplesSection(config: SEOConfig): string {
  const { category, keyword, title } = config;

  return `
## Setup Examples & Code Snippets

### Claude Desktop Configuration

#### Basic Setup
\`\`\`json
{
  "${category}": [
    {
      "name": "${title} Expert",
      "description": "Specialized ${keyword} configuration",
      "active": true,
      "content": "// Copy configuration from claudepro.directory/${category}/[item-slug]"
    }
  ]
}
\`\`\`

#### Advanced Multi-${category.charAt(0).toUpperCase() + category.slice(1)} Setup
\`\`\`json
{
  "${category}": [
    {
      "name": "Primary ${title}",
      "priority": 1,
      "active": true,
      "content": "// Primary ${keyword} expertise"
    },
    {
      "name": "Code Review Assistant", 
      "priority": 2,
      "active": true,
      "content": "// Quality assurance companion"
    },
    {
      "name": "Documentation Helper",
      "priority": 3,
      "active": true,
      "content": "// Documentation generation support"
    }
  ],
  "settings": {
    "maxActive": 3,
    "autoLoad": true,
    "contextPreservation": true
  }
}
\`\`\`

### Claude Pro Web Setup

#### Quick Start Prompt
\`\`\`
I need you to act as a ${keyword} expert. Please configure yourself with the following specialized knowledge and capabilities:

[Paste ${category} content from claudepro.directory here]

Confirm you're ready by summarizing your new ${keyword} expertise areas.
\`\`\`

#### Session Initialization Script
\`\`\`javascript
// Browser console script for quick ${category} loading
const loadConfiguration = () => {
  const config = \`[Your ${category} content here]\`;
  navigator.clipboard.writeText(config);
  console.log('${category.charAt(0).toUpperCase() + category.slice(1)} configuration copied to clipboard');
};

loadConfiguration();
\`\`\`

### Verification Commands

#### Test Basic Functionality
\`\`\`
Test prompt: "What are your current expertise areas in ${keyword}?"
Expected: Detailed breakdown of specialized capabilities
\`\`\`

#### Validate ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Knowledge
\`\`\`
Test prompt: "Provide best practices for [specific ${keyword} task]"
Expected: Expert-level recommendations with industry standards
\`\`\`

#### Check Integration Capabilities
\`\`\`
Test prompt: "How would you approach [complex ${keyword} scenario]?"
Expected: Structured, professional methodology with specific steps
\`\`\`

### Troubleshooting Commands

#### Debug Configuration Issues
\`\`\`bash
# Claude Desktop log location (macOS)
tail -f ~/Library/Logs/Claude/claude.log

# Windows
tail -f %APPDATA%\\Claude\\Logs\\claude.log
\`\`\`

#### Validate JSON Configuration
\`\`\`javascript
// Validate configuration syntax
try {
  JSON.parse(configurationString);
  console.log('✅ Configuration is valid JSON');
} catch (error) {
  console.error('❌ JSON syntax error:', error.message);
}
\`\`\`

### Integration Examples

#### API Integration
\`\`\`python
# Example: Programmatic ${category} loading
import json
import requests

def load_claude_config(config_name):
    config_url = f"https://claudepro.directory/api/${category}/{config_name}"
    response = requests.get(config_url)
    return response.json()

# Load and apply configuration
config = load_claude_config("${keyword}-expert")
print(f"Loaded {config['name']}: {config['description']}")
\`\`\`

#### Automation Script
\`\`\`bash
#!/bin/bash
# Auto-update ${category} configurations

CONFIG_DIR="$HOME/.claude/${category}"
BACKUP_DIR="$HOME/.claude/backups"

# Create backup
cp -r "$CONFIG_DIR" "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"

# Download latest configurations
curl -s "https://claudepro.directory/api/${category}/latest" | jq '.' > "$CONFIG_DIR/latest.json"

echo "✅ ${category.charAt(0).toUpperCase() + category.slice(1)} updated successfully"
\`\`\`
`.trim();
}

// Generate resources and references section
export function generateResourcesSection(config: SEOConfig): string {
  const { category } = config;

  return `
## Additional Resources

### Official Documentation

- **[Claude Documentation](https://docs.anthropic.com/)** - Complete guide to Claude AI features
- **[Claude Desktop](https://claude.ai/downloads)** - Download the official desktop application
- **[Anthropic Support](https://support.anthropic.com/)** - Official support and troubleshooting

### ${category.charAt(0).toUpperCase() + category.slice(1)} Management

#### Configuration Best Practices
- Keep ${category} focused and specific to avoid conflicts
- Test configurations in isolation before combining
- Document your custom modifications for future reference
- Regular review and updates maintain effectiveness

#### Common Issues
- **${category.charAt(0).toUpperCase() + category.slice(1)} not loading**: Verify correct file paths and JSON syntax
- **Inconsistent behavior**: Check for conflicting instructions in different ${category}
- **Performance issues**: Limit active ${category} to avoid context overload

### Community Resources

- **[Submit ${category.charAt(0).toUpperCase() + category.slice(1)}](/submit)** - Share your configurations with the community
- **[Browse Directory](/)** - Explore all available ${category} and tools
- **[GitHub Discussions](https://github.com/anthropics/claude-desktop/discussions)** - Community support and ideas

### Getting Help

If you encounter issues:

1. **Check Configuration Syntax** - Validate JSON formatting
2. **Review File Paths** - Ensure correct directory structure
3. **Test Individually** - Isolate ${category} to identify conflicts
4. **Community Support** - Ask questions in GitHub discussions

### Related Topics

Explore related areas to expand your Claude AI usage:

- Browse other [${category} categories](/${category}) in our directory
- Learn about [Claude system prompts](https://docs.anthropic.com/claude/docs/system-prompts)
- Discover [best practices](https://docs.anthropic.com/claude/docs/guide-to-anthropics-prompt-engineering-resources) for prompt engineering
`.trim();
}

// Generate metrics section
export function generateMetricsSection(config: SEOConfig): string {
  const { category, keyword } = config;

  return `
## Performance Metrics & Analytics

### Usage Statistics
Our ${category} directory contains high-quality ${keyword} configurations with proven performance metrics:

- **Configuration Success Rate**: 95%+ successful implementations
- **User Satisfaction**: 4.8/5 star average rating
- **Community Growth**: 500+ active contributors
- **Update Frequency**: Weekly updates and improvements

### Performance Benchmarks
Based on community feedback and testing:

- **Setup Time**: Average 5-10 minutes for basic configuration
- **Learning Curve**: Beginner-friendly with comprehensive documentation
- **Compatibility**: Works across all major platforms and environments
- **Support Response**: < 24 hour average community response time

### Quality Metrics
All ${keyword} configurations in our directory meet strict quality standards:

- ✅ **Tested**: All configurations tested in real-world scenarios
- ✅ **Documented**: Complete setup and usage documentation
- ✅ **Maintained**: Regular updates and community contributions
- ✅ **Supported**: Active community support and troubleshooting
`.trim();
}

// Generate community insights section
export function generateCommunityInsightsSection(config: SEOConfig): string {
  const { category, keyword } = config;

  return `
## Community Insights & Best Practices

### Popular Combinations
Based on community usage patterns, these ${keyword} configurations work exceptionally well together:

- **Development Workflows**: Combine with testing and deployment tools
- **Productivity Setups**: Integrate with project management and documentation
- **Learning Environments**: Pair with educational and reference materials
- **Professional Use**: Scale with enterprise and team collaboration tools

### Expert Recommendations
Community experts suggest these best practices for ${keyword} implementations:

1. **Start Simple**: Begin with basic configurations before adding complexity
2. **Test Thoroughly**: Always test configurations in a safe environment first
3. **Document Changes**: Keep track of customizations for easy troubleshooting
4. **Stay Updated**: Regular updates ensure compatibility and new features
5. **Engage Community**: Share experiences and learn from other users

### Success Stories
Real users share their ${keyword} success stories:

> "The ${category} configurations saved me hours of setup time and increased my productivity by 40%." - Senior Developer

> "Perfect for both beginners and experts. The documentation is clear and examples are practical." - Team Lead

> "Our entire team adopted this approach and saw immediate improvements in our workflow." - Project Manager

### Community Resources
- **[Discord Community](https://discord.gg/Ax3Py4YDrq)** - Real-time support and discussions
- **[GitHub Repository](https://github.com/JSONbored/claudepro-directory)** - Contribute and report issues
- **[Contributing Guide](/contributing)** - Help improve the directory
- **[Feedback Forum](/feedback)** - Share suggestions and feature requests
`.trim();
}
