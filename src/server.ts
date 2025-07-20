#!/usr/bin/env node

/*
 * E11y Documentation MCP Server
 *
 * Provides access to web accessibility documentation from the e11y-mcp repository.
 * This server allows AI assistants to search for and fetch W3C WAI-ARIA patterns
 * and accessibility best practices documentation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { z } from 'zod';
import { formatResponse } from './utils/formatter.js';
import {
  searchAccessibilityArticles,
  fetchAccessibilityArticle,
  listAccessibilityArticles
} from './tools/e11y-tools.js';

const server = new McpServer({
  name: 'e11y-docs-mcp',
  version: '0.1.0',
});

// Tool 1: Search for relevant accessibility articles
server.tool(
  'search_accessibility_articles',
  'Search for relevant web accessibility articles from the e11y-mcp documentation repository. Find W3C WAI-ARIA patterns and accessibility implementation guidance.',
  {
    query: z.string().describe('Search query to find relevant accessibility articles (e.g., "accordion", "button", "dialog")'),
    maxResults: z.number().min(1).max(20).optional().default(10).describe('Maximum number of results to return (1-20)'),
    outputMode: z.enum(['json', 'compact-json']).optional().default('json').describe('Output format: "json" for formatted JSON (default), "compact-json" for minified JSON')
  },
  async (input) => {
    try {
      const result = await searchAccessibilityArticles({
        query: input.query,
        maxResults: input.maxResults
      });

      return {
        content: [{
          type: 'text',
          text: formatResponse(result, input.outputMode)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error searching accessibility articles: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }
);

// Tool 2: Fetch specific accessibility article content
server.tool(
  'fetch_accessibility_article',
  'Fetch the complete content of a specific accessibility article from the e11y-mcp repository. Use the path from search results to retrieve the full markdown documentation.',
  {
    path: z.string().describe('Path to the accessibility article (from search results, e.g., "docs/www.w3.org_WAI_ARIA_apg_patterns_accordion.md")'),
    includeMetadata: z.boolean().optional().default(true).describe('Include article metadata such as source URL and last updated date'),
    outputMode: z.enum(['json', 'compact-json']).optional().default('json').describe('Output format: "json" for formatted JSON (default), "compact-json" for minified JSON')
  },
  async (input) => {
    try {
      const result = await fetchAccessibilityArticle({
        path: input.path,
        includeMetadata: input.includeMetadata
      });

      return {
        content: [{
          type: 'text',
          text: formatResponse(result, input.outputMode)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching accessibility article: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }
);

// Tool 3: List all available accessibility articles
server.tool(
  'list_accessibility_articles',
  'List all available accessibility articles in the e11y-mcp documentation repository. Get an overview of all W3C WAI-ARIA patterns and accessibility guidance available.',
  {
    outputMode: z.enum(['json', 'compact-json']).optional().default('json').describe('Output format: "json" for formatted JSON (default), "compact-json" for minified JSON')
  },
  async (input) => {
    try {
      const result = await listAccessibilityArticles();

      return {
        content: [{
          type: 'text',
          text: formatResponse(result, input.outputMode)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing accessibility articles: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
