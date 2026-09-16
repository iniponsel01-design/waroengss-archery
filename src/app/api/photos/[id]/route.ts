import { NextRequest, NextResponse } from "next/server";
import { mediaRepository } from "@/repositories/media.repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const photo = await mediaRepository.findPublicById(id);

  if (!photo) {
    return NextResponse.json(
      { success: false, error: "Photo not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: photo });
}
