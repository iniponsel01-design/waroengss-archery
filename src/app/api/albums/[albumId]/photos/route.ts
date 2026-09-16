import { NextRequest, NextResponse } from "next/server";
import { mediaRepository } from "@/repositories/media.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;
  const { searchParams } = new URL(request.url);

  const cursor = searchParams.get("cursor") ?? undefined;
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") ?? "48"),
    100
  );

  const result = await mediaRepository.listForGallery({
    albumId,
    cursor,
    pageSize,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
