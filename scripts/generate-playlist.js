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

  // Load custom logos if available
  let customLogos = {};
  try {
    const customLogosPath = path.join(process.cwd(), "custom_logos.json");
    if (fs.existsSync(customLogosPath)) {
      customLogos = JSON.parse(fs.readFileSync(customLogosPath, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not read custom_logos.json:", e.message);
  }

  // Ensure directories exist
  const publicDir = path.join(process.cwd(), "public");
  const logosDir = path.join(publicDir, "logos");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
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

  for (const ch of channels) {
    const slug = cleanSlug(ch.name);
    const channelName = (ch.name || "").trim();
    const group = ch.group || ch.category || "Sports";
    const tvgId = ch.tvg_id || ch.tvgId || slug;
    const channelStreamUrl = `${BASE_URL.replace(/\/$/, "")}/${slug}.m3u8`;

    // 1. Check if user placed a local logo in public/logos/{slug}.png or .jpg or .svg
    let resolvedLogo = "";
    const localPng = path.join(logosDir, `${slug}.png`);
    const localJpg = path.join(logosDir, `${slug}.jpg`);
    const localSvg = path.join(logosDir, `${slug}.svg`);

    if (fs.existsSync(localPng)) {
      resolvedLogo = `${BASE_URL.replace(/\/$/, "")}/logos/${slug}.png`;
    } else if (fs.existsSync(localSvg)) {
      resolvedLogo = `${BASE_URL.replace(/\/$/, "")}/logos/${slug}.svg`;
    } else if (fs.existsSync(localJpg)) {
      resolvedLogo = `${BASE_URL.replace(/\/$/, "")}/logos/${slug}.jpg`;
    } else if (customLogos[channelName]) {
      resolvedLogo = customLogos[channelName];
    } else if (customLogos[slug]) {
      resolvedLogo = customLogos[slug];
    } else if (ch.logo) {
      resolvedLogo = ch.logo;
    } else {
      resolvedLogo = `${BASE_URL.replace(/\/$/, "")}/logos/${slug}.png`;
    }

    if (resolvedLogo.startsWith("/")) {
      resolvedLogo = `${BASE_URL.replace(/\/$/, "")}${resolvedLogo}`;
    }

    m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${channelName}" tvg-logo="${resolvedLogo}" group-title="${group}",${channelName}\n`;
    m3u += `${channelStreamUrl}\n\n`;
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
