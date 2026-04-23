import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { AuthPayload } from '../middleware/auth';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}
