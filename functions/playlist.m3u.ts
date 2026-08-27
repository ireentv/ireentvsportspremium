// Cloudflare Pages Function: Dynamic M3U / M3U8 Playlist Generator
// Endpoint: https://ireentvsportspremium.pages.dev/playlist.m3u (or .m3u8)

interface ChannelItem {
  id?: number | string;
  name: string;
  url?: string;
  stream_url?: string;
  raw_stream_url?: string;
  url_raw?: string;
  tvg_id?: string;
  logo?: string;
  group?: string;
  referer?: string;
  user_agent?: string;
}

function cleanSlug(name: string): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

function getChannelStreamUrl(c: ChannelItem): string {
  if (c.raw_stream_url && typeof c.raw_stream_url === "string" && c.raw_stream_url.trim()) {
    return c.raw_stream_url.trim();
  }
  if (c.stream_url && typeof c.stream_url === "string" && c.stream_url.trim()) {
    return c.stream_url.split("|")[0].trim();
  }
  if (c.url && typeof c.url === "string" && c.url.trim()) {
    return c.url.split("|")[0].trim();
  }
  if (c.url_raw && typeof c.url_raw === "string" && c.url_raw.trim()) {
    return c.url_raw.split("|")[0].trim();
  }
  return "";
}

export const onRequest = async (context: any): Promise<Response> => {
  const { request } = context;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const isDirectMode = url.searchParams.get("direct") === "true";

  try {
    const githubSources = [
      "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json",
      "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/Live_Sports.json"
    ];

    let playlistData: any = null;
    let channels: ChannelItem[] = [];
    for (const source of githubSources) {
      try {
        const res = await fetch(source, {
          cf: { cacheTtl: 300, cacheEverything: true }
        } as any);
        if (res.ok) {
          const data: any = await res.json();
          if (data && Array.isArray(data.channels) && data.channels.length > 0) {
            playlistData = data;
            channels = data.channels;
            break;
          } else if (Array.isArray(data) && data.length > 0) {
            playlistData = { channels: data };
            channels = data;
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

    const info = playlistData?.info || {};
    const playlistName = info.playlist_name || playlistData?.name || "Ireen TV - Live Sports";
    const owner = info.owner || playlistData?.owner || "Ireen TV";
    const telegram = info.telegram || playlistData?.telegram || "https://t.me/ireentv";
    const website = info.website || playlistData?.website || "https://anamul.pages.dev";
    const developer = info.developer || playlistData?.developer || "MD ANAMUL HOQUE";
    const version = info.version || playlistData?.version || "1.0";
    const lastUpdate = info.last_update || playlistData?.last_update || playlistData?.Last_update || new Date().toUTCString();
    const channelsCount = channels.length;

    let m3u = `#EXTM3U x-tvg-url="https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/epg.xml"\n`;
    m3u += `# Playlist Name: ${playlistName}\n`;
    m3u += `# Owner: ${owner}\n`;
    m3u += `# Telegram: ${telegram}\n`;
    m3u += `# Website: ${website}\n`;
    m3u += `# Developer: ${developer}\n`;
    m3u += `# Version: ${version}\n`;
    m3u += `# Channels Amount: ${channelsCount}\n`;
    m3u += `# Last Update: ${lastUpdate}\n\n`;

    for (const ch of channels) {
      const slug = cleanSlug(ch.name);
      const channelName = (ch.name || "").trim();
      const group = ch.group || "Sports";
      const tvgId = ch.tvg_id || slug;
      const directStreamUrl = getChannelStreamUrl(ch);
      const channelStreamUrl = isDirectMode && directStreamUrl ? directStreamUrl : `${baseUrl}/${slug}.m3u8`;

      let resolvedLogo = ch.logo || `${baseUrl}/logos/${slug}.png`;
      if (resolvedLogo.startsWith("/")) {
        resolvedLogo = `${baseUrl}${resolvedLogo}`;
      }

      m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${channelName}" tvg-logo="${resolvedLogo}" group-title="${group}",${channelName}\n`;
      if (ch.referer) {
        m3u += `#EXTVLCOPT:http-referrer=${ch.referer}\n`;
      }
      if (ch.user_agent) {
        m3u += `#EXTVLCOPT:http-user-agent=${ch.user_agent}\n`;
      }
      m3u += `${channelStreamUrl}\n\n`;
    }

    return new Response(m3u, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "Content-Disposition": 'inline; filename="playlist.m3u"',
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

