import { Router, Request, Response, NextFunction } from 'express';
import * as vendorService from '../services/vendor.service';
import { authenticate } from '../middleware/auth';
import { csvUpload } from '../middleware/upload';
import { parseCsv } from '../utils/csv-parser';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vendorService.listVendors(req);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.getVendor(req.params.id as string);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.createVendor(req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.id as string, req.body);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await vendorService.deleteVendor(req.params.id as string);
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk', csvUpload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No CSV file uploaded' });
      return;
    }
    const rows = parseCsv<{ vendorCode: string; name: string; address?: string; taxId?: string }>(
      req.file.buffer
    );
    const result = await vendorService.bulkCreateVendors(rows);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
