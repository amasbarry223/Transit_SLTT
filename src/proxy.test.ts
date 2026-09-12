import { describe, expect, it, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/");
}

describe("proxy (CSP)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it("dérive connect-src/img-src/frame-src de NEXT_PUBLIC_API_URL en prod", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/api";
    const res = proxy(makeRequest());
    const csp = res.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("connect-src 'self' https://api.example.com blob:");
    expect(csp).toContain("img-src 'self' data: blob: https://api.example.com");
    expect(csp).toContain("frame-src 'self' blob: https://api.example.com");
    expect(csp).not.toContain("localhost");
    expect(csp).not.toContain("ws://");
  });

  it("retombe sur localhost:3001 si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const res = proxy(makeRequest());
    const csp = res.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("http://localhost:3001");
    expect(csp).not.toContain("ws://");
  });
});
