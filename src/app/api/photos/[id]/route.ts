import { NextRequest, NextResponse } from "next/server";
import { mediaRepository } from "@/repositories/media.repository";

function serializeSafe(data: unknown): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value
  );
}

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

  return new NextResponse(serializeSafe({ success: true, data: photo }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
