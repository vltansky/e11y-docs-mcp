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
  relevanceScore?: number;
  matchReason?: string;
  snippet?: string;
}

export interface AccessibilityIndex {
  [title: string]: string;
}

// Enhanced search result with content analysis
interface SearchResult {
  title: string;
  path: string;
  relevanceScore: number;
  matchReason: string;
  snippet?: string;
}

// Input schemas - keeping it simple with practical parameters
const searchQuerySchema = z.object({
  query: z.string().describe('Search query to find relevant accessibility articles (supports fuzzy matching)'),
  maxResults: z.number().min(1).max(20).optional().default(10).describe('Maximum number of results to return (1-20)'),
  includeContent: z.boolean().optional().default(true).describe('Search within article content for better results')
});

const fetchArticleSchema = z.object({
  path: z.string().describe('Path to the accessibility article (from search results)'),
  includeMetadata: z.boolean().optional().default(true).describe('Include article metadata in the response')
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type FetchArticleInput = z.infer<typeof fetchArticleSchema>;

// Cache for article content to avoid repeated fetches
const contentCache = new Map<string, string>();

/**
 * Calculate fuzzy similarity between two strings using a simple algorithm
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match gets highest score
  if (s1 === s2) return 1.0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Simple character overlap scoring
  const chars1 = new Set(s1.split(''));
  const chars2 = new Set(s2.split(''));
  const intersection = new Set([...chars1].filter(x => chars2.has(x)));
  const union = new Set([...chars1, ...chars2]);

  return intersection.size / union.size;
}

/**
 * Extract relevant snippet from content around the match
 */
function extractSnippet(content: string, query: string, maxLength: number = 200): string {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  // Find the position of the query in the content
  const index = contentLower.indexOf(queryLower);
  if (index === -1) {
    // If not found, return beginning of content
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }

  // Extract context around the match
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 150);
  let snippet = content.substring(start, end);

  // Add ellipsis if we're not at the beginning/end
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

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
 * Fetch article content with caching
 */
async function fetchArticleContent(path: string): Promise<string> {
  if (contentCache.has(path)) {
    return contentCache.get(path)!;
  }

  const rawUrl = `https://raw.githubusercontent.com/vltansky/e11y-mcp/master/${path}`;

  try {
    const response = await fetch(rawUrl);
    if (!response.ok) {
      return ''; // Return empty string if content can't be fetched
    }

    const content = await response.text();
    contentCache.set(path, content);
    return content;
  } catch (error) {
    return ''; // Return empty string on error
  }
}

/**
 * Enhanced search for relevant accessibility articles with fuzzy matching and content search
 */
export async function searchAccessibilityArticles(input: SearchQueryInput): Promise<{
  articles: AccessibilityArticle[];
  totalFound: number;
  query: string;
}> {
  const index = await fetchAccessibilityIndex();
  const query = input.query.toLowerCase();
  const results: SearchResult[] = [];

  // Search through titles and paths first
  for (const [title, path] of Object.entries(index)) {
    const titleLower = title.toLowerCase();
    const pathLower = path.toLowerCase();

    let relevanceScore = 0;
    let matchReason = '';
    let snippet = '';

    // Title matching (highest priority)
    const titleSimilarity = calculateSimilarity(query, titleLower);
    if (titleSimilarity > 0.3) {
      relevanceScore = titleSimilarity * 1.0; // Full weight for title matches
      matchReason = 'Title match';
    }

    // Path matching (medium priority)
    const pathSimilarity = calculateSimilarity(query, pathLower);
    if (pathSimilarity > 0.3 && pathSimilarity > titleSimilarity) {
      relevanceScore = pathSimilarity * 0.7; // Reduced weight for path matches
      matchReason = 'Path match';
    }

    // Content search if enabled and no strong title/path match
    if (input.includeContent && (relevanceScore < 0.6)) {
      const content = await fetchArticleContent(path);
      if (content) {
        const contentLower = content.toLowerCase();

        // Check for exact query match in content
        if (contentLower.includes(query)) {
          const contentScore = 0.5; // Base score for content match
          if (contentScore > relevanceScore) {
            relevanceScore = contentScore;
            matchReason = 'Content match';
            snippet = extractSnippet(content, query);
          }
        }

        // Check for individual words in content
        const queryWords = query.split(/\s+/).filter(word => word.length > 2);
        if (queryWords.length > 0) {
          const wordMatches = queryWords.filter(word => contentLower.includes(word));
          if (wordMatches.length > 0) {
            const wordScore = (wordMatches.length / queryWords.length) * 0.4;
            if (wordScore > relevanceScore) {
              relevanceScore = wordScore;
              matchReason = `Content match (${wordMatches.length}/${queryWords.length} words)`;
              snippet = extractSnippet(content, wordMatches[0]);
            }
          }
        }
      }
    }

    // Include results with minimum relevance threshold
    if (relevanceScore > 0.2) {
      results.push({
        title,
        path,
        relevanceScore,
        matchReason,
        snippet
      });
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Apply limit and convert to output format
  const limitedResults = results.slice(0, input.maxResults);
  const articles: AccessibilityArticle[] = limitedResults.map(result => ({
    title: result.title,
    path: result.path,
    url: `https://github.com/vltansky/e11y-mcp/blob/master/${result.path}`,
    relevanceScore: Math.round(result.relevanceScore * 100) / 100, // Round to 2 decimal places
    matchReason: result.matchReason,
    snippet: result.snippet
  }));

  return {
    articles,
    totalFound: results.length,
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

    // Cache the content for future searches
    contentCache.set(input.path, content);

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