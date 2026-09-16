import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { googleDriveProvider } from "@/lib/storage/google-drive/provider";

// GET /api/admin/drive/connect — test connection and list root folders
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") ?? undefined;

    try {
      const [connectionTest, folders] = await Promise.all([
        googleDriveProvider.testConnection(),
        googleDriveProvider.listFolders(parentId),
      ]);

      return NextResponse.json({
        success: true,
        data: { connection: connectionTest, folders },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to connect to Google Drive",
        },
        { status: 500 }
      );
    }
  });
}
