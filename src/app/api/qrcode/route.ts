import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { config } from "@/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get("slug");
  const format = searchParams.get("format") ?? "svg"; // svg | png

  if (!eventSlug) {
    return NextResponse.json(
      { error: "slug parameter is required" },
      { status: 400 }
    );
  }

  const url = `${config.app.url}/e/${eventSlug}`;

  try {
    if (format === "png") {
      const buffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: "H",
        width: 512,
        margin: 2,
        color: {
          dark: "#111827",
          light: "#ffffff",
        },
      });

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="qr-${eventSlug}.png"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // SVG
    const svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
