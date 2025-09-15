export interface Command {
  id: string;
  title: string;
  description: string;
  author: string;
  category: 'productivity' | 'development' | 'analysis' | 'creative' | 'automation' | 'utility' | 'other';
  tags: string[];
  content: string;
  slug: string;
  popularity: number;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  syntax: string;
  parameters: CommandParameter[];
  examples: CommandExample[];
  platforms?: string[];
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
}

export interface CommandExample {
  title: string;
  command: string;
  description: string;
  output?: string;
}

export const commands: Command[] = [
  {
    id: '1',
    title: '/analyze-code',
    description: 'Performs comprehensive code analysis including complexity, security, and performance assessment.',
    author: 'DevTools Pro',
    category: 'development',
    tags: ['code-analysis', 'security', 'performance', 'debugging'],
    content: `The /analyze-code command provides deep insights into your codebase with comprehensive analysis including:

**Features:**
- Cyclomatic complexity analysis
- Security vulnerability scanning
- Performance bottleneck identification
- Code smell detection
- Dependency analysis
- Test coverage assessment

**Analysis Types:**
1. **Structural Analysis** - Code organization and architecture
2. **Quality Metrics** - Maintainability and readability scores
3. **Security Scan** - Common vulnerability patterns
4. **Performance Review** - Optimization opportunities

**Output Format:**
- Detailed report with scores and recommendations
- Visual complexity graphs
- Prioritized action items
- Best practice suggestions

Perfect for code reviews, technical debt assessment, and continuous improvement.`,
    slug: 'analyze-code',
    popularity: 91,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-16',
    featured: true,
    syntax: '/analyze-code [file-path] [--options]',
    parameters: [
      {
        name: 'file-path',
        type: 'string',
        required: true,
        description: 'Path to the code file or directory to analyze'
      },
      {
        name: 'depth',
        type: 'number',
        required: false,
        description: 'Analysis depth level (1-5)',
        default: 3
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Output format (json, markdown, html)',
        default: 'markdown'
      },
      {
        name: 'include-security',
        type: 'boolean',
        required: false,
        description: 'Include security vulnerability scan',
        default: true
      }
    ],
    examples: [
      {
        title: 'Basic Analysis',
        command: '/analyze-code src/main.py',
        description: 'Analyze a single Python file with default settings'
      },
      {
        title: 'Deep Directory Analysis',
        command: '/analyze-code src/ --depth=5 --format=json',
        description: 'Perform deep analysis on entire src directory with JSON output'
      },
      {
        title: 'Security-Focused Scan',
        command: '/analyze-code app/ --include-security=true --depth=4',
        description: 'Focus on security vulnerabilities with detailed scanning'
      }
    ],
    platforms: ['VS Code', 'GitHub', 'GitLab', 'CLI']
  },
  {
    id: '2',
    title: '/summarize',
    description: 'Intelligently summarizes long documents, articles, or conversations with configurable detail levels.',
    author: 'Productivity Plus',
    category: 'productivity',
    tags: ['summarization', 'reading', 'productivity', 'analysis'],
    content: `The /summarize command transforms lengthy content into concise, actionable summaries:

**Capabilities:**
- Multi-format support (documents, URLs, conversations)
- Adjustable summary length and detail
- Key points extraction
- Action items identification
- Topic categorization

**Summary Types:**
1. **Executive Summary** - High-level overview for decision makers
2. **Detailed Summary** - Comprehensive with supporting details
3. **Bullet Points** - Quick scannable format
4. **Abstract** - Academic-style summary

**Smart Features:**
- Maintains context and relationships
- Preserves critical information
- Identifies contradictions or gaps
- Suggests follow-up questions

Ideal for research, meeting notes, long articles, and document review.`,
    slug: 'summarize',
    popularity: 87,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-14',
    featured: true,
    syntax: '/summarize [content] [--options]',
    parameters: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Text content, file path, or URL to summarize'
      },
      {
        name: 'length',
        type: 'string',
        required: false,
        description: 'Summary length (brief, medium, detailed)',
        default: 'medium'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Output format (bullets, paragraphs, executive)',
        default: 'paragraphs'
      },
      {
        name: 'focus',
        type: 'array',
        required: false,
        description: 'Topics to focus on in the summary'
      }
    ],
    examples: [
      {
        title: 'Document Summary',
        command: '/summarize report.pdf --length=brief --format=bullets',
        description: 'Create a brief bullet-point summary of a PDF report'
      },
      {
        title: 'URL Summary',
        command: '/summarize https://example.com/article --focus=["key findings", "recommendations"]',
        description: 'Summarize a web article focusing on specific topics'
      },
      {
        title: 'Executive Summary',
        command: '/summarize meeting-notes.txt --format=executive --length=detailed',
        description: 'Generate an executive summary from meeting notes'
      }
    ]
  },
  {
    id: '3',
    title: '/generate-tests',
    description: 'Automatically generates comprehensive test suites for your code with multiple testing strategies.',
    author: 'TestMaster',
    category: 'development',
    tags: ['testing', 'unit-tests', 'automation', 'quality-assurance'],
    content: `The /generate-tests command creates comprehensive test suites automatically:

**Test Types Generated:**
- Unit tests for individual functions
- Integration tests for component interactions
- Edge case testing
- Error handling validation
- Performance benchmarks

**Supported Frameworks:**
- Jest/Mocha (JavaScript/TypeScript)
- PyTest (Python)
- JUnit (Java)
- RSpec (Ruby)
- Go testing package

**Features:**
- Mocking and stubbing setup
- Test data generation
- Coverage analysis
- Parameterized testing
- Async/await testing patterns

**Best Practices:**
- Follows AAA pattern (Arrange, Act, Assert)
- Descriptive test names
- Proper test isolation
- Comprehensive assertions

Perfect for TDD workflows and improving code coverage.`,
    slug: 'generate-tests',
    popularity: 79,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-12',
    featured: false,
    syntax: '/generate-tests [source-file] [--options]',
    parameters: [
      {
        name: 'source-file',
        type: 'string',
        required: true,
        description: 'Path to the source code file to test'
      },
      {
        name: 'framework',
        type: 'string',
        required: false,
        description: 'Testing framework to use',
        default: 'auto-detect'
      },
      {
        name: 'coverage-target',
        type: 'number',
        required: false,
        description: 'Target code coverage percentage',
        default: 90
      },
      {
        name: 'include-edge-cases',
        type: 'boolean',
        required: false,
        description: 'Generate edge case tests',
        default: true
      }
    ],
    examples: [
      {
        title: 'Basic Test Generation',
        command: '/generate-tests src/utils.js --framework=jest',
        description: 'Generate Jest tests for a utility file'
      },
      {
        title: 'High Coverage Tests',
        command: '/generate-tests calculator.py --coverage-target=95 --include-edge-cases=true',
        description: 'Generate comprehensive tests with 95% coverage target'
      }
    ]
  }
];

export const getCommandBySlug = (slug: string): Command | undefined => {
  return commands.find(command => command.slug === slug);
};

export const getCommandsByCategory = (category: string): Command[] => {
  return commands.filter(command => command.category === category);
};

export const getFeaturedCommands = (): Command[] => {
  return commands.filter(command => command.featured);
};

export const getCommandsByAuthor = (author: string): Command[] => {
  return commands.filter(command => command.author === author);
};