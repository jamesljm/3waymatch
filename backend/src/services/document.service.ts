import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { getPagination, paginatedResult } from '../utils/pagination';
import { Request } from 'express';

export async function listDocuments(req: Request) {
  const pagination = getPagination(req);
  const { type, status, vendorId, search } = req.query;

  const where: Prisma.DocumentWhereInput = {};
  if (type) where.type = type as any;
  if (status) where.status = status as any;
  if (vendorId) where.vendorId = vendorId as string;
  if (search) {
    where.OR = [
      { documentNumber: { contains: search as string, mode: 'insensitive' } },
      { originalFileName: { contains: search as string, mode: 'insensitive' } },
      { vendorName: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { vendor: true, lineItems: true },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.document.count({ where }),
  ]);

  return paginatedResult(data, total, pagination);
}

export async function getDocument(id: string) {
  return prisma.document.findUniqueOrThrow({
    where: { id },
    include: { vendor: true, lineItems: { orderBy: { lineNumber: 'asc' } } },
  });
}

export async function createPO(data: {
  documentNumber: string;
  documentDate: string;
  vendorId: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  discount?: number;
  lineItems: {
    lineNumber: number;
    itemCode?: string;
    description?: string;
    quantity?: number;
    uom?: string;
    unitPrice?: number;
    amount?: number;
    discount?: number;
    taxCode?: string;
    taxAmount?: number;
  }[];
}) {
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: data.vendorId } });

  return prisma.document.create({
    data: {
      type: 'PO',
      status: 'EXTRACTED', // POs entered manually are already structured
      vendorId: data.vendorId,
      documentNumber: data.documentNumber,
      documentDate: new Date(data.documentDate),
      originalFileName: `PO-${data.documentNumber}.manual`,
      filePath: '',
      vendorName: vendor.name,
      currency: data.currency || 'MYR',
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      discount: data.discount,
      lineItems: {
        create: data.lineItems.map((li) => ({
          lineNumber: li.lineNumber,
          itemCode: li.itemCode,
          description: li.description,
          quantity: li.quantity,
          uom: li.uom,
          unitPrice: li.unitPrice,
          amount: li.amount,
          discount: li.discount,
          taxCode: li.taxCode,
          taxAmount: li.taxAmount,
        })),
      },
    },
    include: { lineItems: true, vendor: true },
  });
}

export async function bulkCreatePOs(
  rows: {
    documentNumber: string;
    documentDate: string;
    vendorCode: string;
    lineNumber: string;
    itemCode?: string;
    description?: string;
    quantity?: string;
    uom?: string;
    unitPrice?: string;
    amount?: string;
  }[]
) {
  // Group rows by PO number
  const poMap = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.documentNumber) continue;
    const existing = poMap.get(row.documentNumber) || [];
    existing.push(row);
    poMap.set(row.documentNumber, existing);
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const [poNumber, poRows] of poMap) {
    try {
      const vendorCode = poRows[0].vendorCode;
      const vendor = await prisma.vendor.findUnique({ where: { vendorCode } });
      if (!vendor) {
        results.errors.push(`Vendor ${vendorCode} not found for PO ${poNumber}`);
        results.skipped++;
        continue;
      }

      // Check if PO already exists
      const existing = await prisma.document.findFirst({
        where: { documentNumber: poNumber, type: 'PO' },
      });
      if (existing) {
        results.errors.push(`PO ${poNumber} already exists`);
        results.skipped++;
        continue;
      }

      await prisma.document.create({
        data: {
          type: 'PO',
          status: 'EXTRACTED',
          vendorId: vendor.id,
          documentNumber: poNumber,
          documentDate: poRows[0].documentDate ? new Date(poRows[0].documentDate) : new Date(),
          originalFileName: `PO-${poNumber}.csv`,
          filePath: '',
          vendorName: vendor.name,
          lineItems: {
            create: poRows.map((r, idx) => ({
              lineNumber: parseInt(r.lineNumber) || idx + 1,
              itemCode: r.itemCode,
              description: r.description,
              quantity: r.quantity ? parseFloat(r.quantity) : undefined,
              uom: r.uom,
              unitPrice: r.unitPrice ? parseFloat(r.unitPrice) : undefined,
              amount: r.amount ? parseFloat(r.amount) : undefined,
            })),
          },
        },
      });
      results.created++;
    } catch (err: any) {
      results.errors.push(`Error creating PO ${poNumber}: ${err.message}`);
      results.skipped++;
    }
  }

  return results;
}

export async function uploadDocuments(files: Express.Multer.File[]) {
  const docs = [];
  for (const file of files) {
    const doc = await prisma.document.create({
      data: {
        type: 'DO', // default, will be classified later
        status: 'UPLOADED',
        originalFileName: file.originalname,
        filePath: file.path,
      },
    });
    docs.push(doc);
  }
  return docs;
}

export async function getDashboardStats() {
  const [totalDocuments, totalVendors, totalInventoryItems, statusCounts, typeCounts, recentDocuments] =
    await Promise.all([
      prisma.document.count(),
      prisma.vendor.count(),
      prisma.inventoryItem.count(),
      prisma.document.groupBy({ by: ['status'], _count: true }),
      prisma.document.groupBy({ by: ['type'], _count: true }),
      prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { vendor: true },
      }),
    ]);

  const byStatus: Record<string, number> = {};
  for (const s of statusCounts) {
    byStatus[s.status] = s._count;
  }

  const byType: Record<string, number> = {};
  for (const t of typeCounts) {
    byType[t.type] = t._count;
  }

  return {
    totalDocuments,
    byStatus,
    byType,
    totalVendors,
    totalInventoryItems,
    recentDocuments,
  };
}
