import { toApiErrorResponse, apiSuccessResponse } from "@/lib/errors";
import type { NextRequest } from "next/server";

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "127.0.0.1";
}

export function GET(request: NextRequest) {
  try {
    return apiSuccessResponse({ ip: extractClientIp(request) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
