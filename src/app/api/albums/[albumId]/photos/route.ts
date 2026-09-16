import { NextRequest, NextResponse } from "next/server";
import { mediaRepository } from "@/repositories/media.repository";

/**
 * Safely serialize data that may contain BigInt (file_size field)
 */
function serializeSafe(data: unknown): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value
  );
}

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

  try {
    const result = await mediaRepository.listForGallery({
      albumId,
      cursor,
      pageSize,
    });

    return new NextResponse(serializeSafe(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json(
      { error: "Failed to load photos" },
      { status: 500 }
    );
  }
}
