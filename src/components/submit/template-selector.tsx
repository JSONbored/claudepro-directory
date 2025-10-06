'use client';

import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { ChevronDown, FileText } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Curated templates (top 3 per type)
const TEMPLATES = {
  agents: [
    {
      id: 'code-reviewer',
      name: 'Code Reviewer',
      description: 'Reviews code for quality and best practices',
      systemPrompt:
        'You are a senior code reviewer with expertise across multiple languages and frameworks. Your reviews are thorough, constructive, and educational.\n\n## Review Process\n\n### 1. Code Quality Review\n- Clear, descriptive variable and function names\n- Consistent formatting and style\n- Proper abstraction levels\n- Modular, testable code\n\n### 2. Security Review\n- Input validation\n- Authentication & authorization\n- Data protection\n\n### 3. Performance Review\n- Algorithm complexity\n- Database query optimization\n- Resource management',
      category: 'Development',
      tags: 'code-review, quality, best-practices',
      temperature: 0.4,
      maxTokens: 8000,
    },
    {
      id: 'technical-writer',
      name: 'Technical Documentation Writer',
      description: 'Creates clear, comprehensive technical documentation',
      systemPrompt:
        'You are an expert technical writer who creates clear, accurate documentation. You excel at explaining complex concepts simply while maintaining technical accuracy.\n\nYour documentation includes:\n- Clear purpose and scope\n- Step-by-step instructions\n- Code examples with explanations\n- Common pitfalls and troubleshooting\n- Best practices and recommendations',
      category: 'Productivity',
      tags: 'documentation, writing, technical',
      temperature: 0.5,
      maxTokens: 8000,
    },
    {
      id: 'debugging-assistant',
      name: 'Debugging Assistant',
      description: 'Helps identify and fix bugs systematically',
      systemPrompt:
        'You are a debugging expert who helps developers identify and resolve issues systematically.\n\nYour process:\n1. Understand the problem and expected behavior\n2. Analyze error messages and stack traces\n3. Identify root causes\n4. Suggest fixes with explanations\n5. Recommend prevention strategies',
      category: 'Development',
      tags: 'debugging, troubleshooting, fixes',
      temperature: 0.6,
      maxTokens: 8000,
    },
  ],
  mcp: [
    {
      id: 'github-mcp',
      name: 'GitHub MCP Server',
      npmPackage: '@modelcontextprotocol/server-github',
      serverType: 'stdio',
      installCommand: 'npm install -g @modelcontextprotocol/server-github',
      configCommand: 'mcp-server-github',
      description: 'Search repositories, manage issues, and read files',
      category: 'Development',
      tags: 'github, git, version-control',
      toolsDescription:
        'Access GitHub repositories, search code, manage issues, read file contents',
    },
    {
      id: 'postgres-mcp',
      name: 'PostgreSQL MCP Server',
      npmPackage: '@modelcontextprotocol/server-postgres',
      serverType: 'stdio',
      installCommand: 'npm install -g @modelcontextprotocol/server-postgres',
      configCommand: 'mcp-server-postgres',
      description: 'Query and manage PostgreSQL databases',
      category: 'Development',
      tags: 'postgres, database, sql',
      envVars: 'POSTGRES_CONNECTION_STRING=postgresql://user:password@localhost:5432/dbname',
      toolsDescription: 'Execute SQL queries, manage schemas, inspect database structure',
    },
  ],
  rules: [
    {
      id: 'python-expert',
      name: 'Python Expert',
      rulesContent:
        'You are an expert in Python, FastAPI, and scalable API development.\n\nKey Principles:\n- Write concise, idiomatic Python code\n- Use type hints for all function signatures\n- Follow PEP 8 style guidelines\n- Prefer Pydantic models for data validation\n- Use async/await for I/O operations\n- Implement proper error handling\n- Write comprehensive docstrings',
      description: 'Python and FastAPI expertise for backend development',
      category: 'Development',
      tags: 'python, fastapi, backend',
      temperature: 0.5,
      maxTokens: 8000,
    },
    {
      id: 'react-expert',
      name: 'React Expert',
      rulesContent:
        'You are an expert in React, Next.js, and modern frontend development.\n\nKey Principles:\n- Use functional components and hooks\n- Implement proper TypeScript typing\n- Follow React best practices and patterns\n- Optimize for performance (memoization, lazy loading)\n- Use Server Components where appropriate\n- Implement proper error boundaries\n- Write accessible, semantic HTML',
      description: 'React and Next.js expertise for frontend development',
      category: 'Development',
      tags: 'react, nextjs, frontend',
      temperature: 0.5,
      maxTokens: 8000,
    },
  ],
  commands: [
    {
      id: 'refactor-code',
      name: 'Refactor Code',
      commandContent:
        '---\ndescription: Refactor code for better readability and maintainability\nmodel: claude-3-5-sonnet-20241022\n---\n\nAnalyze the provided code and suggest refactorings to improve:\n1. Code readability and clarity\n2. Maintainability and extensibility\n3. Performance and efficiency\n4. Adherence to best practices\n\nProvide specific examples and explain the benefits of each refactoring.',
      description: 'Refactoring assistant for code quality',
      category: 'Development',
      tags: 'refactor, code-quality, improvement',
    },
  ],
  hooks: [],
  statuslines: [],
} as const;

type ContentType = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines';

interface TemplateSelectorProps {
  contentType: ContentType;
  // biome-ignore lint/suspicious/noExplicitAny: Templates have dynamic fields based on content type
  onSelect: (template: any) => void;
}

export function TemplateSelector({ contentType, onSelect }: TemplateSelectorProps) {
  const templates = TEMPLATES[contentType] || [];

  if (templates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between" type="button">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Use Template
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] sm:w-[320px]">
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template)}
            className="flex-col items-start py-3 cursor-pointer"
          >
            <div className={UI_CLASSES.FONT_MEDIUM}>{template.name}</div>
            <div className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-0.5`}>
              {template.description}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
