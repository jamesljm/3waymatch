import { Router, Request, Response, NextFunction } from 'express';
import * as inventoryItemService from '../services/inventoryItem.service';
import { authenticate } from '../middleware/auth';
import { csvUpload } from '../middleware/upload';
import { parseCsv } from '../utils/csv-parser';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await inventoryItemService.listInventoryItems(req);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryItemService.getInventoryItem(req.params.id as string);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryItemService.createInventoryItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryItemService.updateInventoryItem(req.params.id as string, req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryItemService.deleteInventoryItem(req.params.id as string);
    res.json({ success: true, message: 'Inventory item deleted' });
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
    const rows = parseCsv<{ itemCode: string; description: string; uom?: string }>(req.file.buffer);
    const result = await inventoryItemService.bulkCreateInventoryItems(rows);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
