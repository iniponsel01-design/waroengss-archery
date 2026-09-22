/**
 * Media File Repository
 */

import { prisma } from "@/lib/db/client";
import type { SearchInput } from "@/lib/validation/schemas";

export const mediaRepository = {
  /**
   * List photos for public gallery with pagination
   */
  async listForGallery(options: {
    albumId: string;
    cursor?: string;
    pageSize?: number;
  }) {
    const pageSize = options.pageSize ?? 48;

    const items = await prisma.mediaFile.findMany({
      where: { albumId: options.albumId, status: "ACTIVE" },
      select: {
        id: true,
        driveFileId: true,
        filename: true,
        displayName: true,
        mimeType: true,
        fileSize: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        previewUrl: true,
        albumId: true,
        eventDayId: true,
        eventId: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { filename: "asc" }],
      take: pageSize + 1,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      skip: options.cursor ? 1 : 0,
    });

    const hasNextPage = items.length > pageSize;
    const data = hasNextPage ? items.slice(0, pageSize) : items;
    const nextCursor = hasNextPage ? data[data.length - 1]?.id : undefined;

    return { data, hasNextPage, nextCursor };
  },

  /**
   * Search photos across an event
   */
  async search(params: SearchInput & { eventId: string }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 48;
    const skip = (page - 1) * pageSize;

    const where = {
      eventId: params.eventId,
      status: "ACTIVE" as const,
      // Filter per hari
      ...(params.dayNumber
        ? { eventDay: { dayNumber: params.dayNumber } }
        : {}),
      // Filter per album (via slug)
      ...(params.albumSlug
        ? { album: { slug: params.albumSlug } }
        : {}),
      // Full-text: cocokkan filename ATAU displayName
      ...(params.q
        ? {
            OR: [
              { filename:    { contains: params.q, mode: "insensitive" as const } },
              { displayName: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.mediaFile.findMany({
        where,
        select: {
          id: true,
          driveFileId: true,
          filename: true,
          displayName: true,
          mimeType: true,
          fileSize: true,
          width: true,
          height: true,
          thumbnailUrl: true,
          previewUrl: true,
          albumId: true,
          eventDayId: true,
          eventId: true,
        },
        orderBy: [{ sortOrder: "asc" }, { filename: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.mediaFile.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: skip + pageSize < total,
      hasPrevPage: page > 1,
    };
  },

  /**
   * Get single media file for public viewing
   */
  async findPublicById(id: string) {
    return prisma.mediaFile.findFirst({
      where: { id, status: "ACTIVE" },
      select: {
        id: true,
        driveFileId: true,
        filename: true,
        displayName: true,
        mimeType: true,
        fileSize: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        previewUrl: true,
        albumId: true,
        eventDayId: true,
        eventId: true,
        album: {
          select: {
            id: true,
            name: true,
            slug: true,
            eventDay: {
              select: {
                id: true,
                dayNumber: true,
                title: true,
                event: {
                  select: { id: true, slug: true, title: true },
                },
              },
            },
          },
        },
      },
    });
  },

  /**
   * Get album photo count
   */
  async countByAlbum(albumId: string): Promise<number> {
    return prisma.mediaFile.count({
      where: { albumId, status: "ACTIVE" },
    });
  },

  /**
   * Get first active photo in album (for cover fallback)
   */
  async findFirstInAlbum(albumId: string) {
    return prisma.mediaFile.findFirst({
      where: { albumId, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { filename: "asc" }],
      select: {
        id: true,
        driveFileId: true,
        thumbnailUrl: true,
        previewUrl: true,
        width: true,
        height: true,
      },
    });
  },
};
