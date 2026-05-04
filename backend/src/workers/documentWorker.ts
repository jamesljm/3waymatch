import { Worker, Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { config } from '../config';
import { QUEUE_NAME, getWorkerConnection, DocumentJobData, ProcessingStage } from '../queues/documentQueue';
import { classifyDocument, extractDocument } from '../services/gemini.service';
import { resolveVendor, resolveItem } from '../services/entityResolution.service';

let worker: Worker<DocumentJobData> | null = null;

async function processDocument(job: Job<DocumentJobData>): Promise<void> {
  const { documentId, filePath } = job.data;
  console.log(`[Worker] Processing document ${documentId}: ${job.data.originalFileName}`);

  // Stage 1: Classify
  await job.updateProgress({ stage: ProcessingStage.CLASSIFYING });
  await prisma.document.update({
    where: { id: documentId },
    data: { status: 'CLASSIFYING' },
  });

  const classification = await classifyDocument(filePath);
  console.log(`[Worker] Classified ${documentId}: ${classification.documentType} (${classification.confidence})`);

  const docType = classification.documentType === 'INVOICE' ? 'INVOICE' : 'DO';
  await prisma.document.update({
    where: { id: documentId },
    data: { type: docType },
  });

  // Stage 2: Extract
  await job.updateProgress({ stage: ProcessingStage.EXTRACTING });
  await prisma.document.update({
    where: { id: documentId },
    data: { status: 'EXTRACTING' },
  });

  const extraction = await extractDocument(filePath);
  console.log(`[Worker] Extracted ${documentId}: ${extraction.lineItems.length} line items, confidence=${extraction.confidence}`);

  // Stage 3: Entity Resolution
  await job.updateProgress({ stage: ProcessingStage.RESOLVING });

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
  await job.updateProgress({ stage: ProcessingStage.SAVING });

  // Delete old line items first
  await prisma.documentLineItem.deleteMany({ where: { documentId } });

  // Parse date
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

  console.log(`[Worker] Document ${documentId} processed successfully → EXTRACTED`);
}

export function startDocumentWorker(): Worker<DocumentJobData> {
  worker = new Worker<DocumentJobData>(
    QUEUE_NAME,
    async (job) => {
      try {
        await processDocument(job);
      } catch (err: any) {
        console.error(`[Worker] Error processing document ${job.data.documentId}:`, err.message);

        // Reset status to UPLOADED with error info
        try {
          await prisma.document.update({
            where: { id: job.data.documentId },
            data: {
              status: 'UPLOADED',
              extractedData: JSON.parse(JSON.stringify({ error: err.message, failedAt: new Date().toISOString() })),
            },
          });
        } catch {
          // Ignore DB error during error handling
        }

        throw err; // Re-throw for BullMQ retry
      }
    },
    {
      connection: getWorkerConnection(),
      concurrency: config.workerConcurrency,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}):`, err.message);
  });

  console.log('[Worker] Document processing worker started');
  return worker;
}

export function getWorker(): Worker<DocumentJobData> | null {
  return worker;
}
