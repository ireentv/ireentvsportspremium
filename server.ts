import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Hardcoded headers requested by the user
const PROXY_HEADERS = {
  "Referer": "https://cdnlivetv.tv/api/v1/channels/player/?name=ABC&code=us&user=streamsports99&plan=vip",
  "Origin": "https://cdnlivetv.tv/api/v1/channels/player/?name=ABC&code=us&user=streamsports99&plan=vip",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  "x-forwarded-for": "109.236.88.82",
};

// CORS Setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// In-memory cache for the playlist to avoid hitting rate limits and speed up client loading
let cachedPlaylist: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

async function fetchPlaylistFromRemote(): Promise<any> {
  const sources = [
    {
      url: "https://api.github.com/repos/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/contents/Live_Sports.json",
      headers: {
        "User-Agent": "IreenTV-Live-Stream-App/1.0",
        "Accept": "application/vnd.github.v3.raw",
      }
    },
    {
      url: "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json",
      headers: {
        "User-Agent": PROXY_HEADERS["User-Agent"],
      }
    },
    {
      url: "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/Live_Sports.json",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      }
    }
  ];

  let lastError = null;
  for (const source of sources) {
    try {
      const response = await fetch(source.url, { headers: source.headers });
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().startsWith("{")) {
          const data = JSON.parse(text);
          if (data && Array.isArray(data.channels) && data.channels.length > 0) {
            return data;
          }
        }
      } else {
        lastError = new Error(`Source ${source.url} returned status ${response.status}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to fetch playlist from all sources");
}

function slugifyName(str: string): string {
  if (!str) return "";
  return str.trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "").toLowerCase();
}

function cleanSlugName(name: string): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

function findMatchingChannelInList(channels: any[], query: string): any | null {
  if (!channels || !query) return null;
  const clean = query.replace(/\.m3u8?$/i, "").trim();
  
  // Exact match
  const exact = channels.find(c => c.name.trim().toLowerCase() === clean.toLowerCase());
  if (exact) return exact;

  // Slug match
  const qSlug = slugifyName(clean);
  const slugMatch = channels.find(c => slugifyName(c.name) === qSlug);
  if (slugMatch) return slugMatch;

  // Partial match
  const partial = channels.find(c => slugifyName(c.name).includes(qSlug) || qSlug.includes(slugifyName(c.name)));
  if (partial) return partial;

  return null;
}

// Full M3U / M3U8 Playlist Generator Endpoint
app.get(["/playlist.m3u", "/playlist.m3u8"], async (req, res) => {
  try {
    const data = cachedPlaylist || await fetchPlaylistFromRemote();
    const channels = data?.channels || [];
    const host = req.get("host") || "ireentvsportspremium.pages.dev";
    const protocol = req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;

    let customLogos: Record<string, string> = {};
    try {
      const logosPath = path.join(process.cwd(), "custom_logos.json");
      if (fs.existsSync(logosPath)) {
        customLogos = JSON.parse(fs.readFileSync(logosPath, "utf-8"));
      }
    } catch (e) {}

    const lastUpdate = new Date().toUTCString();
    const channelsCount = channels.length;

    let m3u = `#EXTM3U x-tvg-url="https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/epg.xml"\n`;
    m3u += `# Playlist Name: Ireen TV Sports Premium\n`;
    m3u += `# Telegram: https://t.me/ireentv\n`;
    m3u += `# Website: https://anamul.pages.dev\n`;
    m3u += `# Developer: MD ANAMUL HOQUE\n`;
    m3u += `# Version: 1.0\n`;
    m3u += `# Channels Amount: ${channelsCount}\n`;
    m3u += `# Last Update: ${lastUpdate}\n\n`;

    for (const ch of channels) {
      const slug = cleanSlugName(ch.name);
      const channelName = ch.name.trim();
      const group = ch.group || "Sports";
      const channelStreamUrl = `${baseUrl}/${slug}.m3u8`;

      let logo = customLogos[channelName] || customLogos[slug] || `/logos/${slug}.png`;
      if (logo.startsWith("/")) {
        logo = `${baseUrl}${logo}`;
      }

      m3u += `#EXTINF:-1 tvg-id="${slug}" tvg-name="${channelName}" tvg-logo="${logo}" group-title="${group}",${channelName}\n`;
      m3u += `${channelStreamUrl}\n\n`;
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="ireentv_playlist.m3u"');
    res.send(m3u);
  } catch (error: any) {
    res.status(500).send(`#EXTM3U\n# Error: ${error.message}`);
  }
});

// Dynamic Channel M3U8 Handler (e.g. /LaLigaTV.m3u8 or /channel/LaLigaTV.m3u8)
app.get(["/:channelName.m3u8", "/channel/:channelName.m3u8"], async (req, res) => {
  const channelParam = req.params.channelName;
  if (!channelParam) {
    res.status(400).send("Missing channel name");
    return;
  }

  try {
    const data = cachedPlaylist || await fetchPlaylistFromRemote();
    const channels = data?.channels || [];
    const matched = findMatchingChannelInList(channels, channelParam);

    if (!matched || !matched.url) {
      res.status(404).send(`Channel "${channelParam}" not found in playlist.`);
      return;
    }

    const mode = req.query.mode;
    if (mode === "proxy") {
      res.redirect(`/api/stream?url=${encodeURIComponent(matched.url)}`);
      return;
    }

    // Direct 302 Found redirect to the live stream
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.redirect(302, matched.url);
  } catch (error: any) {
    res.status(500).send(`Error resolving stream: ${error.message}`);
  }
});

// JSON API proxy to get the Live Sports playlist with caching
app.get("/api/playlist", async (req, res) => {
  const now = Date.now();
  const forceRefresh = req.query.refresh === "true";

  // Return cached version if still fresh
  if (!forceRefresh && cachedPlaylist && (now - lastCacheTime < CACHE_TTL_MS)) {
    return res.json(cachedPlaylist);
  }

  try {
    const data = await fetchPlaylistFromRemote();
    cachedPlaylist = data;
    lastCacheTime = Date.now();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching playlist:", error.message);
    if (cachedPlaylist) {
      console.warn("Serving stale cached playlist due to fetch error");
      return res.json(cachedPlaylist);
    }
    res.status(500).json({ error: "Failed to load playlist", details: error.message });
  }
});

// HLS Stream proxy with URI rewriting to support playing restricted streams in browser
app.get("/api/stream", async (req, res) => {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    res.status(400).send("Missing 'url' query parameter");
    return;
  }

  try {
    // Get headers from query params, falling back to defaults if not provided
    const referer = (req.query.referer as string) || PROXY_HEADERS["Referer"];
    const origin = (req.query.origin as string) || PROXY_HEADERS["Origin"];
    const userAgent = (req.query.userAgent as string) || PROXY_HEADERS["User-Agent"];
    const xff = (req.query.xff as string) || PROXY_HEADERS["x-forwarded-for"];

    const headers: Record<string, string> = {
      "User-Agent": userAgent,
      "Referer": referer,
      "Origin": origin,
      "x-forwarded-for": xff,
    };

    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      res.status(response.status).send(`Failed to fetch remote stream asset. Status: ${response.status}`);
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Check if it's an M3U8 playlist or manifest
    const isPlaylist = 
      contentType.includes("mpegurl") || 
      contentType.includes("mpegURL") || 
      targetUrl.includes(".m3u8") || 
      targetUrl.includes(".m3u");

    if (isPlaylist) {
      const text = await response.text();
      const parentUrl = targetUrl;
      const lines = text.split("\n");

      // Pass along the query parameters to subsequent segment files in the playlist
      const queryParams = new URLSearchParams();
      queryParams.set("referer", referer);
      queryParams.set("origin", origin);
      queryParams.set("userAgent", userAgent);
      queryParams.set("xff", xff);

      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite absolute/relative URLs (lines not starting with #)
        if (!trimmed.startsWith("#")) {
          try {
            const absoluteUrl = new URL(trimmed, parentUrl).href;
            queryParams.set("url", absoluteUrl);
            return `/api/stream?${queryParams.toString()}`;
          } catch (e) {
            return line;
          }
        }

        // Rewrite tags containing URI references (e.g., #EXT-X-KEY, #EXT-X-MEDIA, #EXT-X-STREAM-INF)
        if (trimmed.startsWith("#")) {
          let updatedLine = line;
          
          // Match URI="some_url"
          const uriRegex = /URI="([^"]+)"/g;
          updatedLine = updatedLine.replace(uriRegex, (match, p1) => {
            try {
              const absoluteUrl = new URL(p1, parentUrl).href;
              queryParams.set("url", absoluteUrl);
              return `URI="/api/stream?${queryParams.toString()}"`;
            } catch (e) {
              return match;
            }
          });

          return updatedLine;
        }

        return line;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(rewrittenLines.join("\n"));
    } else {
      // For TS video segments or other binary assets, pipe the stream back to the client
      res.setHeader("Content-Type", contentType || "video/MP2T");
      
      // Buffer & send body directly
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error(`Error in proxy for URL ${targetUrl}:`, error.message);
    res.status(500).send(`Proxy Error: ${error.message}`);
  }
});

// Configure Vite or Static Assets based on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
