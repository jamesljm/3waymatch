import { prisma } from '../index';

function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));

  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[la][lb];
}

function similarity(a: string, b: string): number {
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  if (al === bl) return 1;
  const maxLen = Math.max(al.length, bl.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(al, bl) / maxLen;
}

export interface ResolvedVendor {
  vendorId: string;
  vendorName: string;
  matchMethod: 'exact_code' | 'exact_name' | 'alias' | 'fuzzy';
  confidence: number;
}

export async function resolveVendor(
  name?: string,
  code?: string,
  address?: string,
): Promise<ResolvedVendor | null> {
  const vendors = await prisma.vendor.findMany();

  // 1. Exact code match
  if (code) {
    const match = vendors.find((v) => v.vendorCode.toLowerCase() === code.toLowerCase());
    if (match) {
      return { vendorId: match.id, vendorName: match.name, matchMethod: 'exact_code', confidence: 1.0 };
    }
  }

  if (!name) return null;

  // 2. Exact name match
  const exactName = vendors.find((v) => v.name.toLowerCase() === name.toLowerCase());
  if (exactName) {
    return { vendorId: exactName.id, vendorName: exactName.name, matchMethod: 'exact_name', confidence: 1.0 };
  }

  // 3. Alias match
  for (const v of vendors) {
    for (const alias of v.aliases) {
      if (alias.toLowerCase() === name.toLowerCase()) {
        return { vendorId: v.id, vendorName: v.name, matchMethod: 'alias', confidence: 0.95 };
      }
    }
  }

  // 4. Fuzzy match (Levenshtein)
  let bestMatch: { vendor: typeof vendors[0]; score: number } | null = null;
  const threshold = 0.6;

  for (const v of vendors) {
    const nameScore = similarity(name, v.name);
    if (nameScore > threshold && (!bestMatch || nameScore > bestMatch.score)) {
      bestMatch = { vendor: v, score: nameScore };
    }
    // Also check aliases
    for (const alias of v.aliases) {
      const aliasScore = similarity(name, alias);
      if (aliasScore > threshold && (!bestMatch || aliasScore > bestMatch.score)) {
        bestMatch = { vendor: v, score: aliasScore };
      }
    }
  }

  if (bestMatch) {
    return {
      vendorId: bestMatch.vendor.id,
      vendorName: bestMatch.vendor.name,
      matchMethod: 'fuzzy',
      confidence: parseFloat(bestMatch.score.toFixed(3)),
    };
  }

  return null;
}

export interface ResolvedItem {
  itemId: string;
  itemCode: string;
  matchMethod: 'exact_code' | 'exact_description' | 'alias' | 'fuzzy';
  confidence: number;
}

export async function resolveItem(
  code?: string,
  description?: string,
): Promise<ResolvedItem | null> {
  const items = await prisma.inventoryItem.findMany();

  // 1. Exact code match
  if (code) {
    const match = items.find((i) => i.itemCode.toLowerCase() === code.toLowerCase());
    if (match) {
      return { itemId: match.id, itemCode: match.itemCode, matchMethod: 'exact_code', confidence: 1.0 };
    }
  }

  if (!description) return null;

  // 2. Exact description match
  const exactDesc = items.find((i) => i.description.toLowerCase() === description.toLowerCase());
  if (exactDesc) {
    return { itemId: exactDesc.id, itemCode: exactDesc.itemCode, matchMethod: 'exact_description', confidence: 1.0 };
  }

  // 3. Alias match
  for (const item of items) {
    for (const alias of item.aliases) {
      if (alias.toLowerCase() === (code || description).toLowerCase()) {
        return { itemId: item.id, itemCode: item.itemCode, matchMethod: 'alias', confidence: 0.9 };
      }
    }
  }

  // 4. Fuzzy match
  let bestMatch: { item: typeof items[0]; score: number } | null = null;
  const threshold = 0.5;

  for (const item of items) {
    const descScore = similarity(description, item.description);
    if (descScore > threshold && (!bestMatch || descScore > bestMatch.score)) {
      bestMatch = { item, score: descScore };
    }
    for (const alias of item.aliases) {
      const aliasScore = similarity(description, alias);
      if (aliasScore > threshold && (!bestMatch || aliasScore > bestMatch.score)) {
        bestMatch = { item, score: aliasScore };
      }
    }
  }

  if (bestMatch) {
    return {
      itemId: bestMatch.item.id,
      itemCode: bestMatch.item.itemCode,
      matchMethod: 'fuzzy',
      confidence: parseFloat(bestMatch.score.toFixed(3)),
    };
  }

  return null;
}
