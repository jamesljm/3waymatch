import { prisma } from '../index';
import { getPagination, paginatedResult } from '../utils/pagination';
import { Request } from 'express';

export async function listInventoryItems(req: Request) {
  const pagination = getPagination(req);
  const search = req.query.search as string | undefined;

  const where = search
    ? {
        OR: [
          { itemCode: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { itemCode: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return paginatedResult(data, total, pagination);
}

export async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
}

export async function createInventoryItem(data: {
  itemCode: string;
  description: string;
  uom?: string;
}) {
  return prisma.inventoryItem.create({ data });
}

export async function updateInventoryItem(
  id: string,
  data: { itemCode?: string; description?: string; uom?: string }
) {
  return prisma.inventoryItem.update({ where: { id }, data });
}

export async function deleteInventoryItem(id: string) {
  return prisma.inventoryItem.delete({ where: { id } });
}

export async function bulkCreateInventoryItems(
  rows: { itemCode: string; description: string; uom?: string }[]
) {
  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    if (!row.itemCode || !row.description) {
      results.errors.push(`Missing itemCode or description: ${JSON.stringify(row)}`);
      results.skipped++;
      continue;
    }
    try {
      await prisma.inventoryItem.upsert({
        where: { itemCode: row.itemCode },
        update: { description: row.description, uom: row.uom },
        create: {
          itemCode: row.itemCode,
          description: row.description,
          uom: row.uom,
        },
      });
      results.created++;
    } catch (err: any) {
      results.errors.push(`Error for ${row.itemCode}: ${err.message}`);
      results.skipped++;
    }
  }

  return results;
}
