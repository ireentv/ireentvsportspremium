/**
 * Standalone Playlist Generator Script for GitHub Actions / Local Build
 * Generates playlist.m3u and public/playlist.m3u
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.PLAYLIST_BASE_URL || "https://ireentvsportspremium.pages.dev";

const sources = [
  "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/Live_Sports.json",
  "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json"
];

function cleanSlug(name) {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

async function run() {
  console.log("Fetching live sports playlist...");
  let channels = [];

  for (const source of sources) {
    try {
      const res = await fetch(source);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.channels) && data.channels.length > 0) {
          channels = data.channels;
          console.log(`Successfully fetched ${channels.length} channels from ${source}`);
          break;
        }
      }
    } catch (e) {
      console.warn(`Failed fetching from ${source}:`, e.message);
    }
  }

  if (channels.length === 0) {
    console.error("Error: Could not retrieve channels from any source.");
    process.exit(1);
  }

  let m3u = `#EXTM3U x-tvg-url="https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/epg.xml"\n\n`;

  for (const ch of channels) {
    const slug = cleanSlug(ch.name);
    const logo = ch.logo || "";
    const group = ch.group || "Sports";
    const channelName = ch.name.trim();
    const channelStreamUrl = `${BASE_URL.replace(/\/$/, "")}/${slug}.m3u8`;

    m3u += `#EXTINF:-1 tvg-id="${slug}" tvg-name="${channelName}" tvg-logo="${logo}" group-title="${group}",${channelName}\n`;
    m3u += `${channelStreamUrl}\n\n`;
  }

  // Ensure directories exist
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write files
  const rootM3uPath = path.join(process.cwd(), "playlist.m3u");
  const publicM3uPath = path.join(publicDir, "playlist.m3u");
  const publicM3u8Path = path.join(publicDir, "playlist.m3u8");

  fs.writeFileSync(rootM3uPath, m3u, "utf-8");
  fs.writeFileSync(publicM3uPath, m3u, "utf-8");
  fs.writeFileSync(publicM3u8Path, m3u, "utf-8");

  console.log(`✅ Generated playlist.m3u with ${channels.length} channels at:`);
  console.log(`   - ${rootM3uPath}`);
  console.log(`   - ${publicM3uPath}`);
  console.log(`   - ${publicM3u8Path}`);
}

run().catch((err) => {
  console.error("Fatal Error generating playlist:", err);
  process.exit(1);
});
