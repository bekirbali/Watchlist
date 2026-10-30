import { NextRequest, NextResponse } from "next/server";
import https from "https";

// Fallback IP list for image.tmdb.org (BunnyCDN edges)
const IMAGE_IPS = ["79.127.134.229", "79.127.134.131", "143.244.56.51"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");
  const size = searchParams.get("size") || "w500";

  if (!path) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const tmdbPath = `/t/p/${size}${cleanPath}`;

  return new Promise<NextResponse>((resolve) => {
    const tryFetch = (ipIndex: number) => {
      if (ipIndex >= IMAGE_IPS.length) {
        resolve(new NextResponse("Image not found", { status: 404 }));
        return;
      }

      const ip = IMAGE_IPS[ipIndex];
      const req = https.request(
        {
          hostname: ip,
          port: 443,
          path: tmdbPath,
          method: "GET",
          headers: {
            Host: "image.tmdb.org",
            "User-Agent": "Mozilla/5.0",
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          },
          servername: "image.tmdb.org",
          timeout: 6000,
        },
        (res) => {
          if (res.statusCode === 200) {
            const chunks: Buffer[] = [];
            res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            res.on("end", () => {
              const buffer = Buffer.concat(chunks);
              const contentType = res.headers["content-type"] || "image/jpeg";
              resolve(
                new NextResponse(buffer, {
                  status: 200,
                  headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=31536000, immutable",
                  },
                })
              );
            });
          } else {
            tryFetch(ipIndex + 1);
          }
        }
      );

      req.on("error", () => tryFetch(ipIndex + 1));
      req.on("timeout", () => {
        req.destroy();
        tryFetch(ipIndex + 1);
      });
      req.end();
    };

    tryFetch(0);
  });
}

