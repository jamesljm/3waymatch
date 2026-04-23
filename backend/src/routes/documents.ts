import { Router, Request, Response, NextFunction } from 'express';
import * as documentService from '../services/document.service';
import { authenticate } from '../middleware/auth';
import { upload, csvUpload } from '../middleware/upload';
import { parseCsv } from '../utils/csv-parser';

const router = Router();
router.use(authenticate);

// Dashboard stats
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await documentService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// List documents with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await documentService.listDocuments(req);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Get single document detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await documentService.getDocument(req.params.id as string);
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// Upload document files (PDFs/images)
router.post('/upload', upload.array('files', 50), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ success: false, error: 'No files uploaded' });
      return;
    }
    const docs = await documentService.uploadDocuments(files);
    res.status(201).json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
});

// Create PO manually
router.post('/po', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await documentService.createPO(req.body);
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
});

// Bulk upload POs via CSV
router.post(
  '/po/bulk',
  csvUpload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No CSV file uploaded' });
        return;
      }
      const rows = parseCsv<{
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
      }>(req.file.buffer);
      const result = await documentService.bulkCreatePOs(rows);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
