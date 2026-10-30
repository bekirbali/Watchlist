import { NextRequest, NextResponse } from "next/server";
import { searchTMDB } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query")?.trim();
  const type = (searchParams.get("type") as "all" | "movie" | "tv") || "all";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTMDB(query, type);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to search TMDB" }, { status: 500 });
  }
}

