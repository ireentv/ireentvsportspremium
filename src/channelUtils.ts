import { Channel, PlaylistData } from "./types";

/**
 * Utility functions for Channel Slug generation, normalization and matching
 */

export interface ChannelItem {
  id?: number | string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  stream_url?: string;
  raw_stream_url?: string;
  tvg_id?: string;
  referer?: string;
  user_agent?: string;
}

/**
 * Normalizes a raw channel object from any JSON playlist format
 * Supports stream_url, raw_stream_url, url, url_raw, stream, link, etc.
 * Handles pipe-separated headers (e.g. url|x-forwarded-for:1.2.3.4)
 */
export function normalizeChannel(raw: any, index: number = 0): Channel {
  if (!raw) {
    return {
      id: index + 1,
      name: `Channel ${index + 1}`,
      logo: "",
      url: "",
      group: "Sports"
    };
  }

  // 1. Extract clean stream URL
  let cleanUrl = "";
  if (typeof raw.raw_stream_url === "string" && raw.raw_stream_url.trim()) {
    cleanUrl = raw.raw_stream_url.trim();
  } else if (typeof raw.stream_url === "string" && raw.stream_url.trim()) {
    cleanUrl = raw.stream_url.split("|")[0].trim();
  } else if (typeof raw.url === "string" && raw.url.trim()) {
    cleanUrl = raw.url.split("|")[0].trim();
  } else if (typeof raw.url_raw === "string" && raw.url_raw.trim()) {
    cleanUrl = raw.url_raw.split("|")[0].trim();
  } else if (typeof raw.stream === "string" && raw.stream.trim()) {
    cleanUrl = raw.stream.split("|")[0].trim();
  } else if (typeof raw.link === "string" && raw.link.trim()) {
    cleanUrl = raw.link.split("|")[0].trim();
  }

  // 2. Extract metadata
  const name = (raw.name || raw.title || raw.channel || raw.tvg_name || `Channel ${index + 1}`).toString().trim();
  const logo = (raw.logo || raw.image || raw.icon || raw.tvg_logo || "").toString().trim();
  const group = (raw.group || raw.category || raw.group_title || raw["group-title"] || "Sports").toString().trim();
  const tvgId = (raw.tvg_id || raw.tvgId || (raw.attrs ? raw.attrs["tvg-id"] : "") || "").toString().trim();
  const referer = raw.referer || (raw.headers ? raw.headers.Referer : undefined);
  const userAgent = raw.user_agent || (raw.headers ? raw.headers["User-Agent"] : undefined);

  return {
    id: raw.id ?? (index + 1),
    name,
    logo,
    url: cleanUrl,
    group,
    stream_url: raw.stream_url || cleanUrl,
    raw_stream_url: raw.raw_stream_url || cleanUrl,
    url_raw: raw.url_raw || cleanUrl,
    tvg_id: tvgId,
    referer,
    user_agent: userAgent,
    headers: {
      Referer: referer,
      "User-Agent": userAgent,
      ...(raw.headers || {})
    },
    attrs: {
      "tvg-id": tvgId,
      ...(raw.attrs || {})
    }
  };
}

/**
 * Normalizes full JSON playlist data
 */
export function normalizePlaylistData(raw: any): PlaylistData {
  if (!raw) return { channels: [] };

  let rawChannels: any[] = [];
  if (Array.isArray(raw.channels)) {
    rawChannels = raw.channels;
  } else if (Array.isArray(raw)) {
    rawChannels = raw;
  }

  const channels: Channel[] = rawChannels.map((c, i) => normalizeChannel(c, i));
  const info = raw.info || {};

  return {
    status: raw.status || "success",
    name: raw.name || info.playlist_name || raw.playlist_name || "Live Sports",
    playlist_name: raw.playlist_name || info.playlist_name || raw.name || "Live Sports",
    owner: raw.owner || info.owner || "IreenTv",
    telegram: raw.telegram || info.telegram || "https://t.me/ireentv",
    website: raw.website || info.website || "https://anamul.pages.dev",
    developer: raw.developer || info.developer || "MD ANAMUL HOQUE",
    version: raw.version || info.version || "1.0",
    channels_amount: raw.channels_amount || info.channels_amount || channels.length,
    Last_update: raw.Last_update || raw.last_update || info.last_update || "Just Now",
    last_update: raw.last_update || raw.Last_update || info.last_update || "Just Now",
    info,
    channels
  };
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

export function findMatchingChannel(channels: ChannelItem[] | Channel[], requestedSlugOrName: string): Channel | ChannelItem | null {
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

export function generateM3uContent(channels: ChannelItem[] | Channel[], baseUrl: string): string {
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
