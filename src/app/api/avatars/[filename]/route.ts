import { NextRequest, NextResponse } from "next/server";
import { readAvatar } from "@/lib/storage/avatars";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const buf = await readAvatar(filename);
  if (!buf) return new NextResponse("not found", { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
