import { describe, it, expect } from 'vitest';
import {
  exampleDataOperation,
  type DataOperationInput
} from './example-tools.js';

/**
 * Unit tests for example tools
 *
 * These tests demonstrate how to test MCP tool functions.
 * Replace these with tests for your actual business logic.
 */

describe('Example Tools', () => {
  describe('exampleDataOperation', () => {
    it('should return data with correct structure', async () => {
      const input: DataOperationInput = {
        limit: 5,
        filter: 'sample',
        includeMetadata: true
      };

      const result = await exampleDataOperation(input);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalFound');
      expect(result).toHaveProperty('filters');
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeLessThanOrEqual(5);
      expect(result.filters).toEqual(input);
    });

    it('should filter results correctly', async () => {
      const input: DataOperationInput = {
        limit: 10,
        filter: 'sample',
        includeMetadata: false
      };

      const result = await exampleDataOperation(input);

      // Should only return items that match the filter
      result.items.forEach(item => {
        const itemText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        expect(itemText).toContain('sample');
      });
    });

    it('should apply limit correctly', async () => {
      const input: DataOperationInput = {
        limit: 2,
        includeMetadata: false
      };

      const result = await exampleDataOperation(input);

      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it('should include metadata when requested', async () => {
      const input: DataOperationInput = {
        limit: 5,
        includeMetadata: true
      };

      const result = await exampleDataOperation(input);

      result.items.forEach(item => {
        if (item.metadata) {
          expect(item.metadata).toHaveProperty('processingTime');
          expect(item.metadata).toHaveProperty('source');
        }
      });
    });

    it('should handle no filter', async () => {
      const input: DataOperationInput = {
        limit: 10,
        includeMetadata: false
      };

      const result = await exampleDataOperation(input);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalFound).toBeGreaterThan(0);
    });

    // Performance test
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();

      const input: DataOperationInput = {
        limit: 10,
        includeMetadata: true
      };

      await exampleDataOperation(input);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});