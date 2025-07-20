# MCP Server Examples

This document provides practical examples of common MCP server patterns and implementations using the boilerplate template.

## Basic Tool Examples

### 1. Data Retrieval Tool

The boilerplate includes a simple data retrieval tool that demonstrates the basic pattern:

```typescript
// src/tools/example-tools.ts
server.tool(
  'get_data',
  'Retrieve data from your custom data source with optional filtering and pagination.',
  {
    limit: z.number().min(1).max(100).optional().default(10).describe('Maximum number of items to return (1-100)'),
    filter: z.string().optional().describe('Filter criteria for the data'),
    includeMetadata: z.boolean().optional().default(false).describe('Include additional metadata in the response'),
    outputMode: z.enum(['json', 'compact-json']).optional().default('json').describe('Output format')
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
```

**Key Features:**
- Type-safe parameter validation with Zod
- Error handling with try/catch
- Configurable output format
- Optional parameters with defaults

### 2. System Information Tool

A utility tool for system information and context:

```typescript
server.tool(
  'get_system_info',
  'Get system information and utilities. Provides current date, timezone, and other helpful context.',
  {
    info: z.enum(['date', 'timezone', 'version', 'all']).optional().default('all').describe('Type of system information to retrieve')
  },
  async (input) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
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
```

**Key Features:**
- Simple enum-based parameter selection
- Switch-case logic for different response types
- System utilities integration
- Consistent response format

## Customizing Your Tools

### 1. Replace Example Data

To customize the data retrieval tool for your use case:

1. **Update the data source** in `src/tools/example-tools.ts`:
   ```typescript
   // Replace the mock data with your actual data source
   const allItems = await fetchFromYourDatabase(input);
   ```

2. **Modify the data structure** to match your needs:
   ```typescript
   export interface YourDataType {
     id: string;
     name: string;
     customField: string;
     // ... your fields
   }
   ```

3. **Update filtering logic**:
   ```typescript
   if (input.filter) {
     filteredItems = allItems.filter(item =>
       // Your custom filtering logic
       item.name.toLowerCase().includes(input.filter!.toLowerCase())
     );
   }
   ```

### 2. Add New Tools

Follow this pattern to add new tools:

```typescript
server.tool(
  'your_tool_name',
  'Description of what your tool does',
  {
    // Define your parameters with Zod schemas
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional().default(10)
  },
  async (input) => {
    try {
      // Your business logic here
      const result = await yourCustomOperation(input);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);
```

## Testing Your Tools

The boilerplate includes comprehensive tests. To test your custom tools:

1. **Unit tests** in `src/tools/example-tools.test.ts`:
   ```typescript
   describe('yourCustomOperation', () => {
     it('should handle your specific case', async () => {
       const result = await yourCustomOperation({ param: 'value' });
       expect(result).toHaveProperty('expectedProperty');
     });
   });
   ```

2. **Integration tests** in `src/server.test.ts`:
   ```typescript
   it('should call your_tool_name successfully', async () => {
     const response = await sendRequest(server, {
       method: 'tools/call',
       params: {
         name: 'your_tool_name',
         arguments: { param1: 'test' }
       }
     });

     expect(response.result.content[0]).toHaveProperty('text');
   });
   ```

## Best Practices

1. **Use descriptive tool names** and clear descriptions
2. **Validate inputs** with Zod schemas
3. **Handle errors gracefully** with try/catch blocks
4. **Provide consistent response formats** using the formatter utility
5. **Add comprehensive tests** for all your tools
6. **Document your parameters** with clear descriptions

This simplified structure makes it easy to start with the essentials and expand as needed.