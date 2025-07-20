/*
 * Example Tools for MCP Server Boilerplate
 *
 * This is a template function that demonstrates basic MCP tool patterns.
 * Replace this with your own business logic and data operations.
 */

import { z } from 'zod';

// Example types for demonstration
export interface ExampleItem {
  id: string;
  title: string;
  description: string;
  category: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Input type schema
const dataOperationInputSchema = z.object({
  limit: z.number().optional().default(10),
  filter: z.string().optional(),
  includeMetadata: z.boolean().optional().default(false)
});

// Type inference from schema
export type DataOperationInput = z.infer<typeof dataOperationInputSchema>;

/**
 * Example data retrieval operation
 * Replace this with your actual data fetching logic
 */
export async function exampleDataOperation(input: DataOperationInput): Promise<{
  items: ExampleItem[];
  totalFound: number;
  filters: DataOperationInput;
}> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  // Example data - replace with actual data source
  const allItems: ExampleItem[] = [
    {
      id: '1',
      title: 'Example Item 1',
      description: 'This is a sample item for demonstration',
      category: 'sample',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Example Item 2',
      description: 'Another sample item with different category',
      category: 'demo',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      title: 'Example Item 3',
      description: 'Third sample item for testing filters',
      category: 'test',
      metadata: { tags: ['important', 'featured'] },
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    }
  ];

  // Apply filtering
  let filteredItems = allItems;
  if (input.filter) {
    filteredItems = allItems.filter(item =>
      item.title.toLowerCase().includes(input.filter!.toLowerCase()) ||
      item.description.toLowerCase().includes(input.filter!.toLowerCase()) ||
      item.category.toLowerCase().includes(input.filter!.toLowerCase())
    );
  }

  // Apply limit
  const limitedItems = filteredItems.slice(0, input.limit);

  // Add metadata if requested
  const finalItems = limitedItems.map(item => ({
    ...item,
    metadata: input.includeMetadata ? {
      ...item.metadata,
      processingTime: new Date().toISOString(),
      source: 'example-data-source'
    } : item.metadata
  }));

  return {
    items: finalItems,
    totalFound: filteredItems.length,
    filters: input
  };
}