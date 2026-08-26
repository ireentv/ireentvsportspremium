// Cloudflare Pages Function: Dynamic M3U / M3U8 Playlist Generator
// Endpoint: https://ireentvsportspremium.pages.dev/playlist.m3u (or .m3u8)

interface ChannelItem {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

function cleanSlug(name: string): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

export const onRequest = async (context: any): Promise<Response> => {
  const { request } = context;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    const githubSources = [
      "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/Live_Sports.json",
      "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json"
    ];

    let channels: ChannelItem[] = [];
    for (const source of githubSources) {
      try {
        const res = await fetch(source, {
          cf: { cacheTtl: 600, cacheEverything: true }
        } as any);
        if (res.ok) {
          const data: any = await res.json();
          if (data && Array.isArray(data.channels) && data.channels.length > 0) {
            channels = data.channels;
            break;
          }
        }
      } catch (e) {
        // try next
      }
    }

    if (channels.length === 0) {
      return new Response("#EXTM3U\n# Error: Could not fetch channels from upstream\n", {
        status: 502,
        headers: { "Content-Type": "audio/x-mpegurl; charset=utf-8" }
      });
    }

    let m3u = `#EXTM3U x-tvg-url="https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/epg.xml"\n\n`;

    for (const ch of channels) {
      const slug = cleanSlug(ch.name);
      const logo = ch.logo || "";
      const group = ch.group || "Sports";
      const channelName = ch.name.trim();
      const channelStreamUrl = `${baseUrl}/${slug}.m3u8`;

      m3u += `#EXTINF:-1 tvg-id="${slug}" tvg-name="${channelName}" tvg-logo="${logo}" group-title="${group}",${channelName}\n`;
      m3u += `${channelStreamUrl}\n\n`;
    }

    return new Response(m3u, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "Content-Disposition": 'inline; filename="ireentv_playlist.m3u"',
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      }
    });

  } catch (error: any) {
    return new Response(`#EXTM3U\n# Error: ${error.message}\n`, {
      status: 500,
      headers: {
        "Content-Type": "audio/x-mpegurl; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
