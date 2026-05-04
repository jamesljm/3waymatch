import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { classifyDocument, extractDocument } from './gemini.service';
import { resolveVendor, resolveItem } from './entityResolution.service';

export async function processDocumentInline(documentId: string, filePath: string): Promise<void> {
  console.log(`[Processor] Processing document ${documentId}`);

  try {
    // Stage 1: Classify
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'CLASSIFYING' },
    });

    const classification = await classifyDocument(filePath);
    console.log(`[Processor] Classified ${documentId}: ${classification.documentType} (${classification.confidence})`);

    const docType = classification.documentType === 'INVOICE' ? 'INVOICE' : 'DO';
    await prisma.document.update({
      where: { id: documentId },
      data: { type: docType },
    });

    // Stage 2: Extract
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'EXTRACTING' },
    });

    const extraction = await extractDocument(filePath);
    console.log(`[Processor] Extracted ${documentId}: ${extraction.lineItems.length} line items, confidence=${extraction.confidence}`);

    // Stage 3: Entity Resolution
    const vendorMatch = await resolveVendor(
      extraction.header.vendorName,
      extraction.header.vendorCode,
      extraction.header.vendorAddress,
    );

    const resolvedLineItems = await Promise.all(
      extraction.lineItems.map(async (li) => {
        const itemMatch = await resolveItem(li.itemCode, li.description);
        return { ...li, resolvedItemId: itemMatch?.itemId || null, itemMatchConfidence: itemMatch?.confidence };
      }),
    );

    // Stage 4: Save
    await prisma.documentLineItem.deleteMany({ where: { documentId } });

    let documentDate: Date | null = null;
    if (extraction.header.documentDate) {
      const parsed = new Date(extraction.header.documentDate);
      if (!isNaN(parsed.getTime())) documentDate = parsed;
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'EXTRACTED',
        documentNumber: extraction.header.documentNumber || null,
        documentDate,
        vendorId: vendorMatch?.vendorId || null,
        vendorName: extraction.header.vendorName || null,
        vendorAddress: extraction.header.vendorAddress || null,
        currency: extraction.header.currency || 'MYR',
        subtotal: extraction.header.subtotal ?? null,
        taxAmount: extraction.header.taxAmount ?? null,
        totalAmount: extraction.header.totalAmount ?? null,
        discount: extraction.header.discount ?? null,
        rawOcrText: extraction.rawText || null,
        extractionConfidence: extraction.confidence,
        extractedData: JSON.parse(JSON.stringify({
          classification,
          extraction: { header: extraction.header, fieldConfidences: extraction.fieldConfidences },
          vendorMatch: vendorMatch || undefined,
        })),
        lineItems: {
          create: resolvedLineItems.map((li, idx) => ({
            lineNumber: li.lineNumber || idx + 1,
            itemCode: li.itemCode || null,
            description: li.description || null,
            quantity: li.quantity ?? null,
            uom: li.uom || null,
            unitPrice: li.unitPrice ?? null,
            amount: li.amount ?? null,
            discount: li.discount ?? null,
            taxCode: li.taxCode || null,
            taxAmount: li.taxAmount ?? null,
            resolvedItemId: li.resolvedItemId,
            fieldConfidence: li.itemMatchConfidence != null
              ? JSON.parse(JSON.stringify({ itemMatch: li.itemMatchConfidence }))
              : Prisma.JsonNull,
          })),
        },
      },
    });

    console.log(`[Processor] Document ${documentId} processed successfully → EXTRACTED`);
  } catch (err: any) {
    console.error(`[Processor] Error processing document ${documentId}:`, err.message);

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'UPLOADED',
          extractedData: JSON.parse(JSON.stringify({ error: err.message, failedAt: new Date().toISOString() })),
        },
      });
    } catch {
      // Ignore DB error during error handling
    }
  }
}
