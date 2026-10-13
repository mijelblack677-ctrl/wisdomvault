// src/lib/validation.ts
import { z } from 'zod';

export const userIdSchema = z.string().uuid();
export const amountSchema = z.number().min(6000).max(1000000);
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(6).max(100);

export const withdrawSchema = z.object({
  userId: userIdSchema,
  amount: amountSchema,
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/),
  cardholderName: z.string().min(2).max(50),
});

export const coursePurchaseSchema = z.object({
  userId: userIdSchema,
  packId: userIdSchema,
});

export const contentSchema = z.object({
  title: z.string().min(1).max(200),
  category_id: userIdSchema,
  content_type: z.enum(['book', 'teaching', 'guide', 'counsel', 'article']),
  link_type: z.enum(['youtube', 'vimeo', 'pdf', 'audio', 'article', 'url']),
  file_url: z.string().url().optional(),
  description: z.string().max(5000).optional(),
});
