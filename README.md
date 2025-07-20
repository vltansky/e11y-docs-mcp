# E11y Documentation MCP Server

**A Model Context Protocol (MCP) server for accessing web accessibility documentation.**

This MCP server provides AI assistants with access to web accessibility documentation from the [e11y-mcp repository](https://github.com/vltansky/e11y-mcp). It allows searching for and fetching W3C WAI-ARIA patterns and accessibility best practices documentation.

## Features

- **Search Accessibility Articles**: Find relevant W3C WAI-ARIA patterns and accessibility documentation
- **Fetch Article Content**: Retrieve complete markdown documentation with metadata
- **List All Articles**: Get an overview of all available accessibility documentation
- **Real-time Access**: Fetches documentation directly from the remote repository
- **Metadata Support**: Includes source URLs, last updated dates, and content information

## Available Tools

### 1. `search_accessibility_articles`
Search for relevant web accessibility articles from the e11y-mcp documentation repository.

**Parameters:**
- `query` (string): Search query to find relevant accessibility articles (e.g., "accordion", "button", "dialog")
- `maxResults` (number, optional): Maximum number of results to return (1-20, default: 10)
- `outputMode` (enum, optional): Output format - "json" or "compact-json" (default: "json")

**Example:**
```json
{
  "query": "accordion",
  "maxResults": 5
}
```

### 2. `fetch_accessibility_article`
Fetch the complete content of a specific accessibility article from the e11y-mcp repository.

**Parameters:**
- `path` (string): Path to the accessibility article (from search results)
- `includeMetadata` (boolean, optional): Include article metadata (default: true)
- `outputMode` (enum, optional): Output format - "json" or "compact-json" (default: "json")

**Example:**
```json
{
  "path": "docs/www.w3.org_WAI_ARIA_apg_patterns_accordion.md",
  "includeMetadata": true
}
```

### 3. `list_accessibility_articles`
List all available accessibility articles in the e11y-mcp documentation repository.

**Parameters:**
- `outputMode` (enum, optional): Output format - "json" or "compact-json" (default: "json")

## Installation

### Install from NPM

### For Cursor IDE

```json
{
  "mcpServers": {
    "e11y-docs-mcp": {
      "command": "npx",
      "args": ["e11y-docs-mcp@latest"]
    }
  }
}
```

### For Claude Code

`claude mcp add e11y-docs-mcp npx 'e11y-docs-mcp@latest'`
## Quick Start

### 1. Development Installation
```bash
git clone <your-repo-url>
cd e11y-docs-mcp
yarn install
yarn build
```

### 2. Configure MCP Client for Development
Add to your `.cursor/mcp.json` or other MCP client configuration:

```json
{
  "mcpServers": {
    "e11y-docs-mcp": {
      "command": "node",
      "args": ["path/to/your/dist/server.js"]
    }
  }
}
```

### 3. Start Using
```bash
yarn start  # Start the server
```

### 4. Test Your Tools
Use the MCP inspector to test your tools:
```bash
yarn inspector
```

## Example Usage

### Search for Accessibility Patterns
```json
{
  "tool": "search_accessibility_articles",
  "parameters": {
    "query": "button",
    "maxResults": 5
  }
}
```

### Fetch Complete Documentation
```json
{
  "tool": "fetch_accessibility_article",
  "parameters": {
    "path": "docs/www.w3.org_WAI_ARIA_apg_patterns_button.md",
    "includeMetadata": true
  }
}
```

### List All Available Articles
```json
{
  "tool": "list_accessibility_articles",
  "parameters": {}
}
```

## Documentation Structure

The server accesses documentation from the [vltansky/e11y-mcp](https://github.com/vltansky/e11y-mcp) repository, which contains:

- **W3C WAI-ARIA Patterns**: Implementation guides for common UI patterns
- **Accessibility Best Practices**: Guidelines for creating accessible web interfaces
- **Live Examples**: Interactive demonstrations of accessible components
- **Implementation Details**: ARIA roles, states, properties, and keyboard interactions

### Available Documentation

The documentation currently includes patterns such as:
- Accordion Pattern (Sections With Show/Hide Functionality)
- Breadcrumb Pattern
- Date Picker Dialog Example
- And more...

## Development

### Available Scripts

- `yarn build` - Compile TypeScript to JavaScript
- `yarn watch` - Watch mode for development
- `yarn start` - Run the compiled server
- `yarn test` - Run unit tests
- `yarn test:ui` - Run tests with UI
- `yarn inspector` - Start MCP inspector for testing tools

### Project Structure

```
src/
├── server.ts              # Main MCP server setup and tool registration
├── tools/
│   ├── e11y-tools.ts      # Accessibility documentation tools
│   └── e11y-tools.test.ts # Unit tests for tools
└── utils/
    └── formatter.ts       # Response formatting utilities

docs/                      # Local documentation and examples
package.json              # Dependencies and scripts
tsconfig.json             # TypeScript configuration
```

### Testing

The server includes comprehensive tests for all tools:

```bash
yarn test        # Run all tests
yarn test:ui     # Run tests with interactive UI
```

## Use Cases

### For AI Assistants
- **Code Review**: Check accessibility compliance in web applications
- **Implementation Guidance**: Get specific ARIA patterns for UI components
- **Best Practices**: Access current W3C accessibility guidelines
- **Pattern Discovery**: Find the right accessibility pattern for specific use cases

### For Developers
- **Quick Reference**: Access accessibility documentation without leaving your IDE
- **Implementation Examples**: Get working code examples for accessible components
- **Standards Compliance**: Ensure your code follows W3C accessibility guidelines
- **Learning Resource**: Understand accessibility principles and implementation

## Architecture

The server follows a simple architecture:

1. **Tool Registration**: MCP tools are registered with the server
2. **Remote Data Access**: Documentation is fetched from the GitHub repository
3. **Search Functionality**: Text-based search across article titles and paths
4. **Content Retrieval**: Full markdown content with metadata extraction
5. **Response Formatting**: Consistent JSON output with optional compact mode

## Contributing

1. Fork this repository
2. Create your feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - feel free to use this server for your accessibility documentation needs.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [W3C Web Accessibility Initiative](https://www.w3.org/WAI/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [E11y MCP Repository](https://github.com/vltansky/e11y-mcp)