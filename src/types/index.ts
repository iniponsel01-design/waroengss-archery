/**
 * Shared application types
 */

// ─── Re-exports from Prisma ────────────────────────────────────
export type {
  Event,
  EventDay,
  Album,
  MediaFile,
  SyncJob,
  AdminUser,
  AuditLog,
  SiteSetting,
  StorageConnection,
} from "@prisma/client";

export {
  EventStatus,
  DayStatus,
  AlbumStatus,
  MediaStatus,
  SyncStatus,
  AdminRole,
  StorageProvider,
} from "@prisma/client";

// ─── API Response Types ────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string;
  };
}

// ─── Event Types ──────────────────────────────────────────────
export interface EventWithStats {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  timezone: string;
  status: string;
  publishedAt: Date | null;
  coverPhotoId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    eventDays: number;
    mediaFiles: number;
  };
}

export interface EventDayWithStats {
  id: string;
  eventId: string;
  dayNumber: number;
  title: string;
  description: string | null;
  date: Date | null;
  coverPhotoId: string | null;
  sortOrder: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    albums: number;
    mediaFiles: number;
  };
  coverPhoto?: MediaFilePublic | null;
}

export interface AlbumWithStats {
  id: string;
  eventDayId: string;
  name: string;
  slug: string;
  description: string | null;
  coverPhotoId: string | null;
  driveFolderId: string | null;
  sortOrder: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    mediaFiles: number;
  };
  coverPhoto?: MediaFilePublic | null;
}

// ─── Public Media Types (safe for visitor) ────────────────────
export interface MediaFilePublic {
  id: string;
  driveFileId: string;
  filename: string;
  mimeType: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  albumId: string;
  eventDayId: string;
  eventId: string;
}

// ─── Storage Provider Types ───────────────────────────────────
export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
  };
}

export interface SyncResult {
  totalFiles: number;
  addedFiles: number;
  updatedFiles: number;
  deletedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  errors: string[];
}

// ─── Admin Session ────────────────────────────────────────────
export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// ─── Search & Filter ──────────────────────────────────────────
export interface PhotoSearchParams {
  q?: string;
  eventSlug?: string;
  dayNumber?: number;
  albumSlug?: string;
  page?: number;
  pageSize?: number;
  cursor?: string;
}

// ─── QR Code ──────────────────────────────────────────────────
export interface QRCodeOptions {
  url: string;
  label?: string;
  size?: number;
  color?: string;
  background?: string;
}

// ─── Site Branding ────────────────────────────────────────────
export interface SiteBranding {
  brandName: string;
  brandTagline: string;
  brandWebsite: string;
  primaryColor: string;
  logoUrl: string | null;
  footerText: string;
}
