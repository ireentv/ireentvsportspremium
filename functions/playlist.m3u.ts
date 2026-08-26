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

    // Common sports logos fallback dictionary
    const fallbackLogos: Record<string, string> = {
      "laligatv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/laliga-tv-es.png",
      "tsports": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/T_Sports_logo.svg/330px-T_Sports_logo.svg.png",
      "sonyten1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-1-in.png",
      "sonyten2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-2-in.png",
      "sonyten3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-3-in.png",
      "sonyten5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-5-in.png",
      "starsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-1-in.png",
      "starsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-2-in.png",
      "skysportsmainevent": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-main-event-uk.png",
      "skysportspremierleague": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-premier-league-uk.png",
      "skysportsfootball": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-football-uk.png",
      "skysportscricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-cricket-uk.png",
      "skysportsf1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-f1-uk.png",
      "tntsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-1-uk.png",
      "tntsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-2-uk.png",
      "beinsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-1-qa.png",
      "beinsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-2-qa.png",
      "asports": "https://upload.wikimedia.org/wikipedia/en/3/30/A_Sports_Logo.png",
      "tensports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/ten-sports-pk.png",
      "ptvsports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/ptv-sports-pk.png",
      "willowhd": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-us.png"
    };

    for (const ch of channels) {
      const slug = cleanSlug(ch.name);
      const simpleSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
      const channelName = ch.name.trim();
      const group = ch.group || "Sports";
      const channelStreamUrl = `${baseUrl}/${slug}.m3u8`;

      // Priority: 1. known clean high-res logo 2. local hosted logo path in public/logos/
      let resolvedLogo = `${baseUrl}/logos/${slug}.png`;
      if (fallbackLogos[simpleSlug]) {
        resolvedLogo = fallbackLogos[simpleSlug];
      }

      m3u += `#EXTINF:-1 tvg-id="${slug}" tvg-name="${channelName}" tvg-logo="${resolvedLogo}" group-title="${group}",${channelName}\n`;
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
