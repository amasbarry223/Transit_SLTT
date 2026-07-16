import { NextRequest, NextResponse } from "next/server";

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Le proxy de confiance ajoute l'IP réelle en dernier ; les segments
    // précédents sont fournis par le client et donc falsifiables.
    const parts = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "127.0.0.1";
}

export function GET(request: NextRequest) {
  return NextResponse.json({ ip: extractClientIp(request) });
}
