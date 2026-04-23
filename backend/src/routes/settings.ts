import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all tolerance configs
router.get('/tolerance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await prisma.toleranceConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });
    res.json({ success: true, data: configs });
  } catch (err) {
    next(err);
  }
});

// Create tolerance config
router.post('/tolerance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.isDefault) {
      await prisma.toleranceConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    const config = await prisma.toleranceConfig.create({ data: req.body });
    res.status(201).json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

// Update tolerance config
router.patch('/tolerance/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (req.body.isDefault) {
      await prisma.toleranceConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    const config = await prisma.toleranceConfig.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

export default router;
