#!/usr/bin/env node

/*
 * WORKFLOW GUIDANCE FOR AI ASSISTANTS:
 *

* **ALWAYS START WITH PROJECT FILTERING** for project-specific analysis:
 * 1. DISCOVERY: Use list_conversations with projectPath parameter to find project-specific conversations
 * 2. ANALYTICS: Use get_conversation_analytics with projectPath and ["files", "languages"] breakdowns
 *    - Files/languages breakdowns contain conversation IDs in their arrays!
 * 3. DEEP DIVE: Use get_conversation with specific conversation IDs from step 1 or 2
 * 4. ANALYSIS: Use analytics tools (find_related, extract_elements) for insights
 * 5. DATE FILTERING: Use get_system_info first when applying date filters to search_conversations
 *
 * RECOMMENDED PATTERN FOR PROJECT ANALYSIS:
 * - list_conversations(projectPath: "project-name", startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD")
 * - get_conversation_analytics(projectPath: "project-name", includeBreakdowns: ["files", "languages"])
 * - Extract conversation IDs from files/languages.conversations arrays
 * - get_conversation(conversationId: "id-from-breakdown") for each relevant conversation
 *
 * PROJECT PATH EXAMPLES:
 * - "my-app" (project name)
 * - "/Users/name/Projects/my-app" (full path)
 * - "editor-elements" (project name from path like /Users/name/Projects/editor-elements)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { z } from 'zod';
import { formatResponse } from './utils/formatter.js';
import { exampleDataOperation } from './tools/example-tools.js';

const server = new McpServer({
  name: 'mcp-server-boilerplate',
  version: '0.1.0',
});

// Tool 1: Simple data retrieval
server.tool(
  'get_data',
  'Retrieve data from your custom data source with optional filtering and pagination.',
  {
    limit: z.number().min(1).max(100).optional().default(10).describe('Maximum number of items to return (1-100)'),
    filter: z.string().optional().describe('Filter criteria for the data'),
    includeMetadata: z.boolean().optional().default(false).describe('Include additional metadata in the response'),
    outputMode: z.enum(['json', 'compact-json']).optional().default('json').describe('Output format: "json" for formatted JSON (default), "compact-json" for minified JSON')
  },
  async (input) => {
    try {
      const result = await exampleDataOperation({
        limit: input.limit,
        filter: input.filter,
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
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }
);

// Tool 2: System utilities
server.tool(
  'get_system_info',
  'Get system information and utilities. Provides current date, timezone, and other helpful context.',
  {
    info: z.enum(['date', 'timezone', 'version', 'all']).optional().default('all').describe('Type of system information to retrieve')
  },
  async (input) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const version = '0.1.0';

    let response = '';

    switch (input.info) {
      case 'date':
        response = `Current date: ${currentDate}`;
        break;
      case 'timezone':
        response = `Timezone: ${timezone}`;
        break;
      case 'version':
        response = `Server version: ${version}`;
        break;
      default:
        response = [
          `Current date: ${currentDate}`,
          `Current time: ${currentTime}`,
          `Timezone: ${timezone}`,
          `Server version: ${version}`,
          ``,
          `Use this information for date filtering and context.`
        ].join('\n');
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
