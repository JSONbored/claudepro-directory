# Claude Pro Directory 🚀

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff)](https://vitejs.dev/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](.github/CONTRIBUTING.md)

**The Ultimate Community-Driven Collection of Claude AI Configurations**

[🌐 Live Site](https://claudepro.directory) | [📖 Documentation](#documentation) | [🤝 Contributing](#contributing) | [💬 Community](#community)

</div>

## 🎯 About

Claude Pro Directory is an open-source platform that serves as the comprehensive hub for Claude AI configurations, MCP servers, agents, commands, hooks, and rules. Built by the community, for the community, we're making AI workflows more accessible and powerful for everyone.

> **Note**: This project is actively under development. Core browsing features are fully functional, while community features and backend integrations are coming soon.

### ✨ Features

- **🤖 AI Agents** - Discover specialized Claude agents for every use case
- **⚙️ MCP Servers** - Browse Model Context Protocol server configurations
- **📜 Rules** - Find and share Claude rules to enhance AI interactions
- **🔧 Commands** - Explore custom commands for Claude Pro
- **🪝 Hooks** - Integrate powerful hooks into your workflows
- **💼 Jobs Board** - Connect with AI opportunities
- **📈 Trending** - Stay updated with popular configurations
- **🔍 Advanced Search** - Find exactly what you need with powerful filters

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/JSONbored/claudepro-directory.git

# Navigate to project directory
cd claudepro-directory

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080` (or 8081 if 8080 is in use).

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
claudepro-directory/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Utility functions
│   └── generated/      # Auto-generated content files
├── content/            # Configuration content (JSON)
│   ├── agents/
│   ├── commands/
│   ├── hooks/
│   ├── mcp/
│   └── rules/
├── scripts/            # Build and generation scripts
└── public/            # Static assets
```

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.3 with TypeScript 5.0+
- **Build Tool**: Vite 7.1
- **Styling**: Tailwind CSS with shadcn/ui components
- **Syntax Highlighting**: Shiki
- **SEO**: Custom meta tags and structured data
- **Performance**: Code splitting, lazy loading, and optimized builds

## 📝 Content Management

### Adding New Configurations

1. Navigate to the appropriate content folder (`content/agents/`, `content/rules/`, etc.)
2. Create a new JSON file following the naming convention: `kebab-case-name.json`
3. Follow the schema for that content type:

```json
{
  "title": "Configuration Title",
  "description": "Brief description",
  "author": "Your Name",
  "githubUsername": "yourusername",
  "tags": ["tag1", "tag2"],
  "content": "Full configuration content",
  "dateAdded": "2024-01-01",
  "popularity": 0
}
```

4. Run `npm run build:content` to regenerate content files
5. Submit a pull request

## 🤝 Contributing

We welcome contributions from the community! This project follows a structured development workflow to ensure quality and stability.

### Quick Contribution Steps

1. **Fork** the repository
2. **Create a feature branch** from the `dev` branch
3. **Make your changes** and test locally
4. **Submit a PR** targeting the `dev` branch (not `main`)

### Ways to Contribute

- **Submit Configurations**: Share your Claude configurations
- **Report Bugs**: Open an issue if you find any bugs
- **Request Features**: Suggest new features or improvements
- **Improve Documentation**: Help us improve our docs
- **Code Contributions**: Submit pull requests with improvements

### Important Notes

- All PRs must target the `dev` branch
- The `main` branch is protected and only receives stable releases from `dev`
- Content additions go in the `content/` directory
- Run `npm run build:content` after adding new content

For detailed contribution guidelines, please see our [Contributing Guide](.github/CONTRIBUTING.md).

## 📖 Documentation

### API Routes

The application uses client-side routing with React Router:

#### ✅ Fully Functional
- `/` - Home page with search
- `/agents` - AI Agents directory
- `/mcp` - MCP Servers directory
- `/rules` - Claude Rules collection
- `/commands` - Commands library
- `/hooks` - Hooks repository

#### 🚧 Under Construction
- `/jobs` - Jobs board (demo listings shown, but actively accepting paid job postings - [contact us](mailto:partners@claudepro.directory))
- `/trending` - Trending configurations (using static popularity data, not real-time metrics)
- `/community` - Community hub (placeholder stats and links)
- `/submit` - Submit new configurations (UI only, backend integration pending)

### Content Schema

Each content type has a specific schema. See the [Content Schema Documentation](docs/CONTENT_SCHEMA.md) for detailed information.

## 🔒 Security

- All user submissions are reviewed before publication
- No sensitive data or API keys should be included in configurations
- Report security vulnerabilities to security@claudepro.directory

## 📊 Performance

- Lighthouse Score: 95+ (Performance)
- First Contentful Paint: < 1.2s
- Time to Interactive: < 2.5s
- Code splitting for optimal bundle sizes
- Lazy loading for heavy components

## 💬 Community

Join our growing community of Claude AI enthusiasts:

- **Discord**: [Join our server](https://discord.gg/claude)
- **GitHub Discussions**: [Start a discussion](https://github.com/JSONbored/claudepro-directory/discussions)
- **Twitter**: [@claudeprodirectory](https://twitter.com/claudeprodirectory)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all our contributors and the Claude AI community
- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- Syntax highlighting by [Shiki](https://shiki.matsu.io/)

## 🚧 Roadmap

- [ ] User authentication and profiles
- [ ] Configuration versioning
- [ ] API for programmatic access
- [ ] Configuration testing playground
- [ ] AI-powered configuration recommendations
- [ ] Mobile application
- [ ] Browser extension

## 📞 Contact

- **Website**: [claudepro.directory](https://claudepro.directory)
- **General Inquiries**: [hi@claudepro.directory](mailto:hi@claudepro.directory)
- **Partnerships & Advertising**: [partners@claudepro.directory](mailto:partners@claudepro.directory)
- **GitHub**: [@JSONbored/claudepro-directory](https://github.com/JSONbored/claudepro-directory)

## 💼 Partner With Us

Interested in reaching the Claude AI community? We offer:
- **Featured Job Listings** - Connect with top AI talent
- **Sponsored Content** - Showcase your tools and services
- **Premium Placement** - Get visibility for your configurations

[Contact our partnerships team](mailto:partners@claudepro.directory) to learn more about advertising opportunities.

---

<div align="center">

**Made with ❤️ by [JSONbored](https://github.com/JSONbored)**

[GitHub](https://github.com/JSONbored) | [Twitter](https://twitter.com/JSONbored)

[⬆ Back to Top](#claude-pro-directory-)

</div>