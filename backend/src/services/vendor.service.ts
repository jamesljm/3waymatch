import { prisma } from '../index';
import { getPagination, paginatedResult } from '../utils/pagination';
import { Request } from 'express';

export async function listVendors(req: Request) {
  const pagination = getPagination(req);
  const search = req.query.search as string | undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { vendorCode: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.vendor.count({ where }),
  ]);

  return paginatedResult(data, total, pagination);
}

export async function getVendor(id: string) {
  return prisma.vendor.findUniqueOrThrow({ where: { id } });
}

export async function createVendor(data: {
  vendorCode: string;
  name: string;
  address?: string;
  taxId?: string;
}) {
  return prisma.vendor.create({ data });
}

export async function updateVendor(
  id: string,
  data: { vendorCode?: string; name?: string; address?: string; taxId?: string }
) {
  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: string) {
  return prisma.vendor.delete({ where: { id } });
}

export async function bulkCreateVendors(
  rows: { vendorCode: string; name: string; address?: string; taxId?: string }[]
) {
  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    if (!row.vendorCode || !row.name) {
      results.errors.push(`Missing vendorCode or name: ${JSON.stringify(row)}`);
      results.skipped++;
      continue;
    }
    try {
      await prisma.vendor.upsert({
        where: { vendorCode: row.vendorCode },
        update: { name: row.name, address: row.address, taxId: row.taxId },
        create: {
          vendorCode: row.vendorCode,
          name: row.name,
          address: row.address,
          taxId: row.taxId,
        },
      });
      results.created++;
    } catch (err: any) {
      results.errors.push(`Error for ${row.vendorCode}: ${err.message}`);
      results.skipped++;
    }
  }

  return results;
}
