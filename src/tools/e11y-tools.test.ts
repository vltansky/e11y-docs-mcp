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

## ARIA Roles and Properties

- **button**: The accordion header acts as a button
- **aria-expanded**: Indicates if the panel is expanded
- **aria-controls**: Associates the button with its panel

## Keyboard Interaction

- **Tab**: Moves focus to the next focusable element
- **Space or Enter**: When focus is on an accordion header, toggles the display of the associated panel
`;

  const mockBreadcrumbContent = `---
title: Breadcrumb Pattern
url: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
date: 2025-07-20
---

# Breadcrumb Pattern

A breadcrumb trail consists of a list of links to the parent pages of the current page in hierarchical order.

## ARIA Roles

- **navigation**: Applied to the breadcrumb container
- **link**: Each breadcrumb item is a link
`;

  describe('searchAccessibilityArticles', () => {
    it('should search articles with exact title match', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'accordion',
        maxResults: 10,
        includeContent: false
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles.length).toBeGreaterThan(0);
      // The first result should be the best match (accordion pattern)
      expect(result.articles[0].title).toBe('Accordion Pattern (Sections With Show/Hide Functionality)');
      expect(result.articles[0].relevanceScore).toBeGreaterThan(0.5);
      expect(result.articles[0].matchReason).toBe('Title match');
    });

    it('should handle fuzzy matching for typos', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'acordion', // typo in accordion
        maxResults: 10,
        includeContent: false
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles.length).toBeGreaterThan(0);
      // Should find the accordion pattern as the most relevant match
      const accordionResult = result.articles.find(article =>
        article.title.includes('Accordion'));
      expect(accordionResult).toBeDefined();
      expect(accordionResult!.matchReason).toContain('match');
    });

    it('should search within content when includeContent is true', async () => {
      // Mock index fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      // Mock content fetches for each article
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockArticleContent) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockBreadcrumbContent) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('Some other content') });

      const input: SearchQueryInput = {
        query: 'aria-expanded',
        maxResults: 10,
        includeContent: true
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles.length).toBeGreaterThan(0);
      expect(result.articles[0].matchReason).toBe('Content match');
      expect(result.articles[0].snippet).toContain('aria-expanded');
    });

    it('should search for multiple words in content', async () => {
      // Mock index fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      // Mock content fetches
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockArticleContent) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockBreadcrumbContent) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('Some other content') });

      const input: SearchQueryInput = {
        query: 'keyboard interaction',
        maxResults: 10,
        includeContent: true
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles.length).toBeGreaterThan(0);
      // Should find content matches or title matches
      const hasContentMatch = result.articles.some(article =>
        article.matchReason?.includes('Content match') || article.matchReason?.includes('Title match'));
      expect(hasContentMatch).toBe(true);
    });

            it('should limit results based on maxResults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'pattern',
        maxResults: 1,
        includeContent: false
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles).toHaveLength(1);
      expect(result.totalFound).toBeGreaterThan(1); // Should find multiple but only return 1
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const input: SearchQueryInput = {
        query: 'accordion',
        maxResults: 10,
        includeContent: false
      };

      await expect(searchAccessibilityArticles(input)).rejects.toThrow('Failed to fetch accessibility index');
    });



    it('should include all expected fields in results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      });

      const input: SearchQueryInput = {
        query: 'accordion',
        maxResults: 10,
        includeContent: false
      };

      const result = await searchAccessibilityArticles(input);

      expect(result.articles[0]).toHaveProperty('title');
      expect(result.articles[0]).toHaveProperty('path');
      expect(result.articles[0]).toHaveProperty('url');
      expect(result.articles[0]).toHaveProperty('relevanceScore');
      expect(result.articles[0]).toHaveProperty('matchReason');
      expect(result.query).toBe('accordion');
      expect(typeof result.totalFound).toBe('number');
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
  });

    describe('listAccessibilityArticles', () => {
    it('should list all articles successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
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