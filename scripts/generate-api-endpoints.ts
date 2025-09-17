import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all content from the content directory
const contentDir = path.join(__dirname, '../content');
const publicDir = path.join(__dirname, '../public');
const apiDir = path.join(publicDir, 'api');

// Ensure API directory exists
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Function to read all JSON files from a directory
function readContentFromDir(dirName: string) {
  const dirPath = path.join(contentDir, dirName);
  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.json'));

  return files.map((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'));
    const slug = file.replace('.json', '');
    return {
      ...content,
      slug,
      type: dirName.replace(/s$/, ''), // Remove 's' from plural
      url: `https://claudepro.directory/${dirName}/${slug}`,
    };
  });
}

// Read all content types
const agents = readContentFromDir('agents');
const mcp = readContentFromDir('mcp');
const rules = readContentFromDir('rules');
const commands = readContentFromDir('commands');
const hooks = readContentFromDir('hooks');

// Create individual API endpoints
fs.writeFileSync(
  path.join(apiDir, 'agents.json'),
  JSON.stringify({ agents, count: agents.length, lastUpdated: new Date().toISOString() }, null, 2)
);

fs.writeFileSync(
  path.join(apiDir, 'mcp.json'),
  JSON.stringify({ mcp, count: mcp.length, lastUpdated: new Date().toISOString() }, null, 2)
);

fs.writeFileSync(
  path.join(apiDir, 'rules.json'),
  JSON.stringify({ rules, count: rules.length, lastUpdated: new Date().toISOString() }, null, 2)
);

fs.writeFileSync(
  path.join(apiDir, 'commands.json'),
  JSON.stringify(
    { commands, count: commands.length, lastUpdated: new Date().toISOString() },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(apiDir, 'hooks.json'),
  JSON.stringify({ hooks, count: hooks.length, lastUpdated: new Date().toISOString() }, null, 2)
);

// Create combined endpoint for AI crawlers
const allConfigurations = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Claude Pro Directory - All Configurations',
  description: 'Complete database of Claude AI configurations',
  license: 'MIT',
  lastUpdated: new Date().toISOString(),
  statistics: {
    totalConfigurations: agents.length + mcp.length + rules.length + commands.length + hooks.length,
    agents: agents.length,
    mcp: mcp.length,
    rules: rules.length,
    commands: commands.length,
    hooks: hooks.length,
  },
  data: {
    agents,
    mcp,
    rules,
    commands,
    hooks,
  },
  endpoints: {
    agents: 'https://claudepro.directory/api/agents.json',
    mcp: 'https://claudepro.directory/api/mcp.json',
    rules: 'https://claudepro.directory/api/rules.json',
    commands: 'https://claudepro.directory/api/commands.json',
    hooks: 'https://claudepro.directory/api/hooks.json',
  },
};

fs.writeFileSync(
  path.join(apiDir, 'all-configurations.json'),
  JSON.stringify(allConfigurations, null, 2)
);

// Create a simple text-based sitemap for AI crawlers
const textSitemap = [
  'https://claudepro.directory/',
  'https://claudepro.directory/agents',
  'https://claudepro.directory/mcp',
  'https://claudepro.directory/rules',
  'https://claudepro.directory/commands',
  'https://claudepro.directory/hooks',
  'https://claudepro.directory/trending',
  'https://claudepro.directory/community',
  'https://claudepro.directory/jobs',
  ...agents.map((a) => `https://claudepro.directory/agents/${a.slug}`),
  ...mcp.map((m) => `https://claudepro.directory/mcp/${m.slug}`),
  ...rules.map((r) => `https://claudepro.directory/rules/${r.slug}`),
  ...commands.map((c) => `https://claudepro.directory/commands/${c.slug}`),
  ...hooks.map((h) => `https://claudepro.directory/hooks/${h.slug}`),
].join('\n');

fs.writeFileSync(path.join(publicDir, 'sitemap.txt'), textSitemap);
