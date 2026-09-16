/**
 * Zod Validation Schemas
 * Used for API input validation and form validation
 */

import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Event ────────────────────────────────────────────────────
export const createEventSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  timezone: z.string().default("Asia/Jakarta"),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// ─── Event Day ────────────────────────────────────────────────
export const createEventDaySchema = z.object({
  eventId: z.string().cuid(),
  dayNumber: z.number().int().min(1).max(365),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  date: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const updateEventDaySchema = createEventDaySchema
  .omit({ eventId: true, dayNumber: true })
  .partial();

// ─── Album ────────────────────────────────────────────────────
export const createAlbumSchema = z.object({
  eventDayId: z.string().cuid(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000).optional(),
  driveFolderId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const updateAlbumSchema = createAlbumSchema
  .omit({ eventDayId: true })
  .partial();

// ─── Search ───────────────────────────────────────────────────
export const searchSchema = z.object({
  q: z.string().max(100).optional(),
  eventSlug: z.string().optional(),
  dayNumber: z.coerce.number().int().optional(),
  albumSlug: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(48),
});

// ─── Site Settings ────────────────────────────────────────────
export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
});

// ─── Admin User ───────────────────────────────────────────────
export const createAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]).default("EDITOR"),
  setupToken: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateEventDayInput = z.infer<typeof createEventDaySchema>;
export type UpdateEventDayInput = z.infer<typeof updateEventDaySchema>;
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
