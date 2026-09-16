/**
 * Event Repository
 * All database operations for events
 */

import { prisma } from "@/lib/db/client";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validation/schemas";
import type { EventWithStats } from "@/types";

export const eventRepository = {
  /**
   * Find published event by slug (public)
   */
  async findPublishedBySlug(slug: string) {
    return prisma.event.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        _count: {
          select: {
            eventDays: { where: { status: "ACTIVE" } },
            mediaFiles: { where: { status: "ACTIVE" } },
          },
        },
      },
    });
  },

  /**
   * Find any event by slug (admin)
   */
  async findBySlug(slug: string) {
    return prisma.event.findUnique({ where: { slug } });
  },

  /**
   * Find event by ID (admin)
   */
  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { eventDays: true, mediaFiles: true },
        },
      },
    });
  },

  /**
   * List published events (public homepage)
   */
  async listPublished(options?: { page?: number; pageSize?: number }) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [data, total] = await prisma.$transaction([
      prisma.event.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { startDate: "desc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              eventDays: { where: { status: "ACTIVE" } },
              mediaFiles: { where: { status: "ACTIVE" } },
            },
          },
        },
      }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
    ]);

    return { data, total, page, pageSize };
  },

  /**
   * List all events (admin)
   */
  async listAll(options?: { page?: number; pageSize?: number; search?: string }) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = options?.search
      ? {
          OR: [
            { title: { contains: options.search, mode: "insensitive" as const } },
            { slug: { contains: options.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { eventDays: true, mediaFiles: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { data, total, page, pageSize };
  },

  /**
   * Create event
   */
  async create(data: CreateEventInput) {
    return prisma.event.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        timezone: data.timezone,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        status: "DRAFT",
      },
    });
  },

  /**
   * Update event
   */
  async update(id: string, data: UpdateEventInput) {
    return prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        publishedAt:
          data.status === "PUBLISHED"
            ? new Date()
            : data.status === "DRAFT"
            ? null
            : undefined,
      },
    });
  },

  /**
   * Delete event
   */
  async delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const event = await prisma.event.findFirst({
      where: { slug, id: excludeId ? { not: excludeId } : undefined },
    });
    return !!event;
  },
};
