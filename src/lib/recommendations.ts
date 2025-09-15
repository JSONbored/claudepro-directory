import { Rule } from '@/data/rules';
import { MCPServer } from '@/data/mcp';

export type RecommendationItem = (Rule | MCPServer) & { 
  type: 'rule' | 'mcp';
  similarity?: number;
};

export const getRelatedConfigs = (
  item: Rule | MCPServer,
  allRules: Rule[],
  allMcpServers: MCPServer[],
  maxResults: number = 4
): RecommendationItem[] => {
  const allItems: RecommendationItem[] = [
    ...allRules.map(r => ({ ...r, type: 'rule' as const })),
    ...allMcpServers.map(m => ({ ...m, type: 'mcp' as const }))
  ];

  // Remove the current item
  const otherItems = allItems.filter(other => other.id !== item.id);

  // Calculate similarity scores
  const scoredItems = otherItems.map(other => {
    let score = 0;

    // Category match (high weight)
    if (other.category === item.category) {
      score += 0.4;
    }

    // Tag overlap (medium weight)
    const commonTags = other.tags.filter(tag => item.tags.includes(tag));
    score += (commonTags.length / Math.max(item.tags.length, other.tags.length)) * 0.3;

    // Author match (low weight)
    if (other.author === item.author) {
      score += 0.1;
    }

    // Popularity similarity (low weight)
    const popularityDiff = Math.abs(other.popularity - item.popularity);
    score += (1 - popularityDiff / 100) * 0.1;

    // Recent items get slight boost
    const daysDiff = Math.abs(
      new Date(other.createdAt).getTime() - new Date(item.createdAt).getTime()
    ) / (1000 * 3600 * 24);
    
    if (daysDiff < 30) {
      score += 0.1;
    }

    return {
      ...other,
      similarity: score
    };
  });

  // Sort by similarity and return top results
  return scoredItems
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, maxResults);
};

export const getTrendingConfigs = (
  allRules: Rule[],
  allMcpServers: MCPServer[],
  maxResults: number = 6
): RecommendationItem[] => {
  const allItems: RecommendationItem[] = [
    ...allRules.map(r => ({ ...r, type: 'rule' as const })),
    ...allMcpServers.map(m => ({ ...m, type: 'mcp' as const }))
  ];

  // Simple trending algorithm based on popularity and recency
  const scoredItems = allItems.map(item => {
    const daysSinceCreated = Math.abs(
      new Date().getTime() - new Date(item.createdAt).getTime()
    ) / (1000 * 3600 * 24);

    // Boost score for recent items
    const recencyBoost = Math.max(0, 1 - daysSinceCreated / 365) * 0.2;
    const trendingScore = (item.popularity / 100) + recencyBoost;

    return {
      ...item,
      similarity: trendingScore
    };
  });

  return scoredItems
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, maxResults);
};