import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Stream Movies & TV Shows";
    const year = searchParams.get("year") || "2024";
    const rating = searchParams.get("rating") || "8.5";
    const type = searchParams.get("type") === "tv" ? "TV Series" : "Movie";
    const bgImage = searchParams.get("image") || "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0a0a0b",
            position: "relative",
            padding: "50px 60px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "white",
          }}
        >
          {/* Backdrop image */}
          {bgImage && (
            <img
              src={bgImage}
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.35,
              }}
            />
          )}

          {/* Vignette Gradients */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to right, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.7) 60%, rgba(10,10,11,0.4) 100%)",
            }}
          />

          {/* Top Brand Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "#e50914",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 25px rgba(229,9,20,0.6)",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "9px solid transparent",
                    borderBottom: "9px solid transparent",
                    borderLeft: "14px solid white",
                    marginLeft: "3px",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  textTransform: "uppercase",
                  fontStyle: "italic",
                }}
              >
                Cine<span style={{ color: "#e50914" }}>Stream</span>
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(229, 9, 20, 0.2)",
                  border: "1px solid rgba(229, 9, 20, 0.5)",
                  color: "#ff6b72",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Hindi Dubbed &amp; Multi-Audio
              </div>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                1080p Full HD
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxWidth: "850px",
              zIndex: 10,
            }}
          >
            {/* Meta Tags */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span
                style={{
                  backgroundColor: "#e50914",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {type}
              </span>
              <span
                style={{
                  color: "#eab308",
                  fontSize: "18px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ★ {rating} / 10
              </span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", fontWeight: 700 }}>
                {year}
              </span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", fontWeight: 700 }}>
                • Free Streaming
              </span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: "58px",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-2px",
                textTransform: "uppercase",
                fontStyle: "italic",
                textShadow: "0 4px 20px rgba(0,0,0,0.8)",
              }}
            >
              {title}
            </div>

            <p
              style={{
                fontSize: "20px",
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.4,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Watch in Full HD with Hindi Dubbed audio and multi-language subtitles on CineStream. Zero ads, ultra-fast streaming.
            </p>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 10,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "20px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
              }}
            >
              cinestream-mo.vercel.app
            </span>

            <div
              style={{
                backgroundColor: "white",
                color: "black",
                padding: "10px 24px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 900,
                textTransform: "uppercase",
                fontStyle: "italic",
                letterSpacing: "0.5px",
              }}
            >
              ▶ Watch Free in HD
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate OpenGraph image", { status: 500 });
  }
}
