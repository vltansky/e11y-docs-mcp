/*
 * E11y (Accessibility) Documentation Tools
 *
 * Tools for searching and fetching accessibility documentation from the e11y-mcp repository.
 * These tools provide access to W3C WAI-ARIA patterns and accessibility best practices.
 */

import { z } from 'zod';

// Types for accessibility documentation
export interface AccessibilityArticle {
  title: string;
  path: string;
  url?: string;
  source?: string;
  lastUpdated?: string;
}

export interface AccessibilityIndex {
  [title: string]: string;
}

// Input schemas
const searchQuerySchema = z.object({
  query: z.string().describe('Search query to find relevant accessibility articles'),
  maxResults: z.number().min(1).max(20).optional().default(10).describe('Maximum number of results to return (1-20)')
});

const fetchArticleSchema = z.object({
  path: z.string().describe('Path to the accessibility article (from the index.json)'),
  includeMetadata: z.boolean().optional().default(true).describe('Include article metadata in the response')
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type FetchArticleInput = z.infer<typeof fetchArticleSchema>;

/**
 * Fetch the accessibility documentation index from the remote repository
 */
async function fetchAccessibilityIndex(): Promise<AccessibilityIndex> {
  try {
    const response = await fetch('https://raw.githubusercontent.com/vltansky/e11y-mcp/master/docs/index.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch index: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch accessibility index: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search for relevant accessibility articles based on a query
 */
export async function searchAccessibilityArticles(input: SearchQueryInput): Promise<{
  articles: AccessibilityArticle[];
  totalFound: number;
  query: string;
}> {
  const index = await fetchAccessibilityIndex();
  const query = input.query.toLowerCase();

  // Search through titles and paths
  const matches: AccessibilityArticle[] = [];

  for (const [title, path] of Object.entries(index)) {
    const titleLower = title.toLowerCase();
    const pathLower = path.toLowerCase();

    // Check if query matches title or path
    if (titleLower.includes(query) || pathLower.includes(query)) {
      matches.push({
        title,
        path,
        url: `https://github.com/vltansky/e11y-mcp/blob/master/${path}`
      });
    }
  }

  // Sort by relevance (title matches first, then path matches)
  matches.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const aTitleMatch = aTitle.includes(query);
    const bTitleMatch = bTitle.includes(query);

    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;

    // If both or neither match title, sort alphabetically
    return aTitle.localeCompare(bTitle);
  });

  // Apply limit
  const limitedMatches = matches.slice(0, input.maxResults);

  return {
    articles: limitedMatches,
    totalFound: matches.length,
    query: input.query
  };
}

/**
 * Fetch the content of a specific accessibility article
 */
export async function fetchAccessibilityArticle(input: FetchArticleInput): Promise<{
  title?: string;
  path: string;
  content: string;
  metadata?: {
    url?: string;
    source?: string;
    lastUpdated?: string;
    contentType: string;
    size: number;
  };
}> {
  // Construct the raw GitHub URL
  const rawUrl = `https://raw.githubusercontent.com/vltansky/e11y-mcp/master/${input.path}`;

  try {
    const response = await fetch(rawUrl);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Article not found: ${input.path}`);
      }
      throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    // Extract title from markdown frontmatter or first heading
    let title: string | undefined;
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const titleMatch = frontmatterMatch[1].match(/title:\s*["']?([^"'\n]+)["']?/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }

    // If no frontmatter title, try to get first heading
    if (!title) {
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
    }

    const result: any = {
      path: input.path,
      content
    };

    if (title) {
      result.title = title;
    }

    if (input.includeMetadata) {
      result.metadata = {
        url: `https://github.com/vltansky/e11y-mcp/blob/master/${input.path}`,
        contentType: 'text/markdown',
        size: content.length
      };

      // Try to extract source URL from frontmatter
      if (frontmatterMatch) {
        const sourceMatch = frontmatterMatch[1].match(/url:\s*["']?([^"'\n]+)["']?/);
        if (sourceMatch) {
          result.metadata.source = sourceMatch[1].trim();
        }

        const dateMatch = frontmatterMatch[1].match(/date:\s*["']?([^"'\n]+)["']?/);
        if (dateMatch) {
          result.metadata.lastUpdated = dateMatch[1].trim();
        }
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to fetch article content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all available accessibility articles from the index
 */
export async function listAccessibilityArticles(): Promise<{
  articles: AccessibilityArticle[];
  totalCount: number;
}> {
  const index = await fetchAccessibilityIndex();

  const articles: AccessibilityArticle[] = Object.entries(index).map(([title, path]) => ({
    title,
    path,
    url: `https://github.com/vltansky/e11y-mcp/blob/master/${path}`
  }));

  return {
    articles: articles.sort((a, b) => a.title.localeCompare(b.title)),
    totalCount: articles.length
  };
}