import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.webp': 'image/webp',
};

function getFilePart(filePath: string): Part {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_MAP[ext] || 'application/pdf';
  const data = fs.readFileSync(filePath);
  return {
    inlineData: {
      mimeType,
      data: data.toString('base64'),
    },
  };
}

function getModel() {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  return genAI.getGenerativeModel({ model: config.geminiModel });
}

export interface ClassificationResult {
  documentType: 'DO' | 'INVOICE' | 'UNKNOWN';
  confidence: number;
  reasoning: string;
}

export async function classifyDocument(filePath: string): Promise<ClassificationResult> {
  const model = getModel();
  const filePart = getFilePart(filePath);

  const result = await model.generateContent([
    filePart,
    {
      text: `You are a document classification expert. Analyze this document and classify it as either a "DO" (Delivery Order / Delivery Note / Goods Receipt) or "INVOICE" (Invoice / Tax Invoice / Bill).

Respond ONLY with valid JSON in this exact format:
{
  "documentType": "DO" or "INVOICE" or "UNKNOWN",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

Key indicators:
- DO/Delivery Order: mentions delivery, goods receipt, packing list, shipping, "delivery order", "DO", items delivered
- INVOICE: mentions invoice number, payment terms, tax, billing, "invoice", amount due, total payable

Do NOT include markdown code fences. Return raw JSON only.`,
    },
  ]);

  const text = result.response.text().trim();
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as ClassificationResult;
  } catch {
    return { documentType: 'UNKNOWN', confidence: 0, reasoning: `Failed to parse: ${text.slice(0, 200)}` };
  }
}

export interface ExtractedHeader {
  documentNumber?: string;
  documentDate?: string;
  vendorName?: string;
  vendorCode?: string;
  vendorAddress?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  discount?: number;
  paymentTerms?: string;
  poReference?: string;
}

export interface ExtractedLineItem {
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
}

export interface ExtractionResult {
  rawText: string;
  header: ExtractedHeader;
  lineItems: ExtractedLineItem[];
  confidence: number;
  fieldConfidences: Record<string, number>;
}

export async function extractDocument(filePath: string): Promise<ExtractionResult> {
  const model = getModel();
  const filePart = getFilePart(filePath);

  const result = await model.generateContent([
    filePart,
    {
      text: `You are a document data extraction expert. Extract ALL structured data from this document.

Respond ONLY with valid JSON in this exact format (no markdown code fences):
{
  "rawText": "full OCR text of the document",
  "header": {
    "documentNumber": "the document/invoice/DO number",
    "documentDate": "YYYY-MM-DD format",
    "vendorName": "supplier/vendor company name",
    "vendorCode": "vendor/supplier code if visible",
    "vendorAddress": "vendor address if visible",
    "currency": "MYR, USD, SGD, etc. Default MYR if not specified",
    "subtotal": numeric or null,
    "taxAmount": numeric or null,
    "totalAmount": numeric or null,
    "discount": numeric or null,
    "paymentTerms": "e.g. NET 30",
    "poReference": "PO number referenced in document"
  },
  "lineItems": [
    {
      "lineNumber": 1,
      "itemCode": "item/part code",
      "description": "item description",
      "quantity": numeric,
      "uom": "unit of measure",
      "unitPrice": numeric,
      "amount": numeric,
      "discount": numeric or null,
      "taxCode": "tax code if any",
      "taxAmount": numeric or null
    }
  ],
  "confidence": 0.0 to 1.0,
  "fieldConfidences": {
    "documentNumber": 0.0 to 1.0,
    "documentDate": 0.0 to 1.0,
    "vendorName": 0.0 to 1.0,
    "lineItems": 0.0 to 1.0,
    "totalAmount": 0.0 to 1.0
  }
}

Rules:
- Extract every line item visible in the document
- Use null for fields you cannot find
- Numbers should be raw numeric values, not strings
- Dates in YYYY-MM-DD format
- rawText should be the full readable text from the document
- Do NOT include markdown code fences. Return raw JSON only.`,
    },
  ]);

  const text = result.response.text().trim();
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as ExtractionResult;
  } catch {
    return {
      rawText: text,
      header: {},
      lineItems: [],
      confidence: 0,
      fieldConfidences: {},
    };
  }
}
