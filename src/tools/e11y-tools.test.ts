/*
 * Tests for E11y (Accessibility) Documentation Tools
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchAccessibilityArticles,
  fetchAccessibilityArticle,
  listAccessibilityArticles,
  type SearchQueryInput,
  type FetchArticleInput
} from './e11y-tools.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('E11y Documentation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockIndex = {
    "Accordion Pattern (Sections With Show/Hide Functionality)": "docs/www.w3.org_WAI_ARIA_apg_patterns_accordion.md",
    "Breadcrumb Pattern": "docs/www.w3.org_WAI_ARIA_apg_patterns_breadcrumb.md",
    "Date Picker Dialog Example": "docs/www.w3.org_WAI_ARIA_apg_patterns_dialog-modal_examples_datepicker-dialog.md"
  };

  const mockArticleContent = `---
title: Accordion Pattern
url: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
date: 2025-07-20
---

# Accordion Pattern (Sections With Show/Hide Functionality)

An accordion is a vertically stacked set of interactive headings that each contain a title, content snippet, or thumbnail representing a section of content.

## Example

[View live example](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/)

## Keyboard Interaction

- **Tab**: Moves focus to the next focusable element
- **Space or Enter**: When focus is on an accordion header, toggles the display of the associated panel
`;

  describe('searchAccessibilityArticles', () => {
    it('should search articles successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'accordion',
        maxResults: 10
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Accordion Pattern (Sections With Show/Hide Functionality)');
      expect(result.articles[0].path).toBe('docs/www.w3.org_WAI_ARIA_apg_patterns_accordion.md');
      expect(result.totalFound).toBe(1);
      expect(result.query).toBe('accordion');
    });

    it('should search case-insensitively', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'BREADCRUMB',
        maxResults: 10
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Breadcrumb Pattern');
    });

    it('should limit results based on maxResults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'pattern',
        maxResults: 1
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles).toHaveLength(1);
      expect(result.totalFound).toBe(3); // Should find all three articles containing "pattern"
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const input: SearchQueryInput = {
        query: 'accordion',
        maxResults: 10
      };

      await expect(searchAccessibilityArticles(input)).rejects.toThrow('Failed to fetch accessibility index');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const input: SearchQueryInput = {
        query: 'accordion',
        maxResults: 10
      };

      await expect(searchAccessibilityArticles(input)).rejects.toThrow('Failed to fetch index: 404 Not Found');
    });
  });

  describe('fetchAccessibilityArticle', () => {
    it('should fetch article content successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockArticleContent)
      });

      const input: FetchArticleInput = {
        path: 'docs/www.w3.org_WAI_ARIA_apg_patterns_accordion.md',
        includeMetadata: true
      };

      const result = await fetchAccessibilityArticle(input);

      expect(result.title).toBe('Accordion Pattern');
      expect(result.path).toBe('docs/www.w3.org_WAI_ARIA_apg_patterns_accordion.md');
      expect(result.content).toBe(mockArticleContent);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.source).toBe('https://www.w3.org/WAI/ARIA/apg/patterns/accordion/');
      expect(result.metadata?.lastUpdated).toBe('2025-07-20');
      expect(result.metadata?.contentType).toBe('text/markdown');
    });

    it('should extract title from first heading if no frontmatter', async () => {
      const contentWithoutFrontmatter = `# Button Pattern

This describes the button pattern.`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(contentWithoutFrontmatter)
      });

      const input: FetchArticleInput = {
        path: 'docs/button.md',
        includeMetadata: false
      };

      const result = await fetchAccessibilityArticle(input);

      expect(result.title).toBe('Button Pattern');
      expect(result.metadata).toBeUndefined();
    });

    it('should handle 404 errors with specific message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const input: FetchArticleInput = {
        path: 'docs/nonexistent.md',
        includeMetadata: true
      };

      await expect(fetchAccessibilityArticle(input)).rejects.toThrow('Article not found: docs/nonexistent.md');
    });

    it('should handle other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const input: FetchArticleInput = {
        path: 'docs/accordion.md',
        includeMetadata: true
      };

      await expect(fetchAccessibilityArticle(input)).rejects.toThrow('Failed to fetch article: 500 Internal Server Error');
    });
  });

  describe('listAccessibilityArticles', () => {
    it('should list all articles successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const result = await listAccessibilityArticles();

      expect(result.articles).toHaveLength(3);
      expect(result.totalCount).toBe(3);

      // Should be sorted alphabetically by title
      expect(result.articles[0].title).toBe('Accordion Pattern (Sections With Show/Hide Functionality)');
      expect(result.articles[1].title).toBe('Breadcrumb Pattern');
      expect(result.articles[2].title).toBe('Date Picker Dialog Example');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(listAccessibilityArticles()).rejects.toThrow('Failed to fetch accessibility index');
    });
  });
});