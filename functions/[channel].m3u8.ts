// Cloudflare Pages Function: Dynamic M3U8 Redirector / Stream Resolver
// Handles: https://ireentvsportspremium.pages.dev/LaLigaTV.m3u8 or https://ireentvsportspremium.pages.dev/{ChannelName}.m3u8

interface ChannelItem {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

function slugify(str: string): string {
  if (!str) return "";
  return str.trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "").toLowerCase();
}

function findChannel(channels: ChannelItem[], query: string): ChannelItem | null {
  if (!channels || !query) return null;
  const clean = query.replace(/\.m3u8?$/i, "").trim();
  
  // 1. Exact match
  const exact = channels.find(c => c.name.trim().toLowerCase() === clean.toLowerCase());
  if (exact) return exact;

  // 2. Slug match (handles LaLigaTV -> La Liga TV, T_Sports -> T Sports)
  const qSlug = slugify(clean);
  const slugMatch = channels.find(c => slugify(c.name) === qSlug);
  if (slugMatch) return slugMatch;

  // 3. Partial match
  const partial = channels.find(c => slugify(c.name).includes(qSlug) || qSlug.includes(slugify(c.name)));
  if (partial) return partial;

  return null;
}

export const onRequest = async (context: any): Promise<Response> => {
  const { request, params } = context;
  const rawChannelParam = (params.channel as string) || "";
  const channelQuery = decodeURIComponent(rawChannelParam);

  if (!channelQuery) {
    return new Response("Missing channel parameter", { status: 400 });
  }

  try {
    // Fetch latest channel list from GitHub
    const githubSources = [
      "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/Live_Sports.json",
      "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json"
    ];

    let channels: ChannelItem[] = [];
    for (const source of githubSources) {
      try {
        const res = await fetch(source, {
          cf: { cacheTtl: 300, cacheEverything: true }
        } as any);
        if (res.ok) {
          const data: any = await res.json();
          if (data && Array.isArray(data.channels) && data.channels.length > 0) {
            channels = data.channels;
            break;
          }
        }
      } catch (e) {
        // try next source
      }
    }

    if (channels.length === 0) {
      return new Response("Unable to load channel playlist from upstream.", { status: 502 });
    }

    const matchedChannel = findChannel(channels, channelQuery);

    if (!matchedChannel || !matchedChannel.url) {
      return new Response(
        `Channel "${channelQuery}" not found. Available channels: ${channels.slice(0, 10).map(c => c.name).join(", ")}...`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Check if client requested direct 302 redirect or stream manifest
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "redirect";

    if (mode === "proxy") {
      // Forward the stream using custom headers
      const streamRes = await fetch(matchedChannel.url, {
        headers: {
          "Referer": "https://cdnlivetv.tv/api/v1/channels/player/?name=ABC&code=us&user=streamsports99&plan=vip",
          "Origin": "https://cdnlivetv.tv/api/v1/channels/player/?name=ABC&code=us&user=streamsports99&plan=vip",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
          "x-forwarded-for": "109.236.88.82",
        }
      });

      return new Response(streamRes.body, {
        status: streamRes.status,
        headers: {
          "Content-Type": streamRes.headers.get("content-type") || "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        }
      });
    }

    // Default: 302 Found redirect directly to the live stream
    return new Response(null, {
      status: 302,
      headers: {
        "Location": matchedChannel.url,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });

  } catch (error: any) {
    return new Response(`Error resolving channel stream: ${error.message}`, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};
