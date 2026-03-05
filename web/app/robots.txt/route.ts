import { NextResponse } from "next/server";

export function GET() {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bondus.vercel.app";
  const body = [
    `User-agent: *`,
    `Allow: /`,
    ``,
    `Sitemap: ${site}/sitemap.xml`,
  ].join("\n");
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
