import { Router, Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});

export default router;
