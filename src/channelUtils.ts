/**
 * Utility functions for Channel Slug generation and matching
 */

export interface ChannelItem {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

export function slugifyChannelName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special characters except hyphen and spaces
    .replace(/[\s_]+/g, "") // remove whitespace and underscores for compact matching like LaLigaTV
    .toLowerCase();
}

export function cleanChannelSlug(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "");
}

export function findMatchingChannel(channels: ChannelItem[], requestedSlugOrName: string): ChannelItem | null {
  if (!channels || channels.length === 0 || !requestedSlugOrName) return null;

  // Clean the input name (remove .m3u8 or .m3u suffix if present)
  const cleanInput = requestedSlugOrName
    .replace(/\.m3u8?$/i, "")
    .trim();

  // 1. Direct exact name match
  const exact = channels.find(
    (c) => c.name.trim().toLowerCase() === cleanInput.toLowerCase()
  );
  if (exact) return exact;

  // 2. Slugified match (ignoring spaces, underscores, dashes, special chars, case)
  const inputSlug = slugifyChannelName(cleanInput);
  const slugMatch = channels.find(
    (c) => slugifyChannelName(c.name) === inputSlug
  );
  if (slugMatch) return slugMatch;

  // 3. Partial contains match if close enough
  const partial = channels.find(
    (c) => slugifyChannelName(c.name).includes(inputSlug) || inputSlug.includes(slugifyChannelName(c.name))
  );
  if (partial) return partial;

  return null;
}

export function generateM3uContent(channels: ChannelItem[], baseUrl: string): string {
  let m3u = `#EXTM3U x-tvg-url="https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/epg.xml"\n\n`;

  for (const ch of channels) {
    const slug = cleanChannelSlug(ch.name);
    const logo = ch.logo || "";
    const group = ch.group || "Sports";
    const channelName = ch.name.trim();
    const streamEndpoint = `${baseUrl.replace(/\/$/, "")}/${slug}.m3u8`;

    m3u += `#EXTINF:-1 tvg-id="${slug}" tvg-name="${channelName}" tvg-logo="${logo}" group-title="${group}",${channelName}\n`;
    m3u += `${streamEndpoint}\n\n`;
  }

  return m3u;
}
