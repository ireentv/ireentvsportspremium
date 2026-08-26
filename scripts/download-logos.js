/**
 * Automated Logo Downloader & Resolver Script
 * 
 * Fetches channels from upstream Live_Sports.json,
 * Queries TV logo databases (Wikimedia Commons, tv-logo GitHub, iptv-org/logos, Free-TV),
 * Downloads authentic high-resolution PNGs directly into `public/logos/{ChannelSlug}.png`,
 * And updates `custom_logos.json` mapping.
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const sources = [
  "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/main/Live_Sports.json",
  "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json"
];

function cleanSlug(name) {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

function normalize(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^\w]/g, "")
    .replace(/hd|fhd|sd|4k|50fps|60fps|tv|sports|sport/g, "");
}

// Extensive trusted international sports logo repositories
const KNOWN_LOGO_MAP = {
  // Football / LaLiga
  "laligatv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/laliga-tv-es.png",
  "laligahd": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/laliga-tv-es.png",
  "laliga": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/laliga-tv-es.png",
  
  // Bangladesh / Cricket
  "tsports": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/T_Sports_logo.svg/500px-T_Sports_logo.svg.png",
  "tsportshd": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/T_Sports_logo.svg/500px-T_Sports_logo.svg.png",
  "gtv": "https://upload.wikimedia.org/wikipedia/en/thumb/8/87/GTV_Bangladesh_Logo.svg/500px-GTV_Bangladesh_Logo.svg.png",
  "gazitv": "https://upload.wikimedia.org/wikipedia/en/thumb/8/87/GTV_Bangladesh_Logo.svg/500px-GTV_Bangladesh_Logo.svg.png",
  "ntv": "https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/NTV_Bangladesh_logo.png/500px-NTV_Bangladesh_logo.png",
  "channel9": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Channel_9_Bangladesh_Logo.svg/500px-Channel_9_Bangladesh_Logo.svg.png",

  // Sony Sports India
  "sonysportsten1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-1-in.png",
  "sonyten1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-1-in.png",
  "sonysportsten2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-2-in.png",
  "sonyten2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-2-in.png",
  "sonysportsten3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-3-in.png",
  "sonyten3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-3-in.png",
  "sonysportsten5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-5-in.png",
  "sonyten5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-5-in.png",
  "sonysix": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-six-in.png",
  "sonyten4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-4-in.png",

  // Star Sports India
  "starsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-1-in.png",
  "starsports1hindi": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-1-hindi-in.png",
  "starsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-2-in.png",
  "starsportsselect1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-select-1-in.png",
  "starsportsselect2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-select-2-in.png",
  "starsports3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-3-in.png",
  "starsportsfirst": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-first-in.png",

  // Sky Sports UK
  "skysportsmainevent": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-main-event-uk.png",
  "skysportspremierleague": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-premier-league-uk.png",
  "skysportsfootball": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-football-uk.png",
  "skysportscricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-cricket-uk.png",
  "skysportsf1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-f1-uk.png",
  "skysportsaction": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-action-uk.png",
  "skysportsarena": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-arena-uk.png",
  "skysportsgolf": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-golf-uk.png",
  "skysportsnews": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-news-uk.png",
  "skysportstennis": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-tennis-uk.png",
  "skysportsracing": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-racing-uk.png",

  // TNT Sports UK
  "tntsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-1-uk.png",
  "tntsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-2-uk.png",
  "tntsports3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-3-uk.png",
  "tntsports4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-4-uk.png",
  "tntsportsultimate": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-ultimate-uk.png",

  // BeIN Sports
  "beinsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-1-qa.png",
  "beinsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-2-qa.png",
  "beinsports3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-3-qa.png",
  "beinsports4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-4-qa.png",
  "beinsports5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-5-qa.png",
  "beinsports6": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-6-qa.png",
  "beinsports7": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-7-qa.png",
  "beinsports8": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-8-qa.png",
  "beinsportsenglish1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-english-1-qa.png",
  "beinsportsenglish2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-english-2-qa.png",
  "beinsportsenglish3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-english-3-qa.png",
  "beinsportsxtra": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/bein-sports-xtra-us.png",

  // SuperSport South Africa
  "supersportgrandstand": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-grandstand-za.png",
  "supersportpsl": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-psl-za.png",
  "supersportpremierleague": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-premier-league-za.png",
  "supersportfootball": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-football-za.png",
  "supersportcricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-cricket-za.png",
  "supersportrugby": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-rugby-za.png",
  "supersportmotorsport": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-motorsport-za.png",
  "supersporttennis": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-tennis-za.png",
  "supersportaction": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-action-za.png",
  "supersportvariety1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-variety-1-za.png",
  "supersportvariety2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-variety-2-za.png",
  "supersportvariety3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-variety-3-za.png",
  "supersportvariety4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-variety-4-za.png",

  // Astro Malaysia
  "astrosupersport1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-supersport-1-my.png",
  "astrosupersport2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-supersport-2-my.png",
  "astrosupersport3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-supersport-3-my.png",
  "astrosupersport4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-supersport-4-my.png",
  "astrocricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-cricket-my.png",
  "astroarena": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-arena-my.png",

  // Pakistan
  "asports": "https://upload.wikimedia.org/wikipedia/en/3/30/A_Sports_Logo.png",
  "ptvsports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/ptv-sports-pk.png",
  "tensports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/ten-sports-pk.png",
  "geosuper": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/geo-super-pk.png",

  // USA Sports
  "willowhd": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-us.png",
  "willowcricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-us.png",
  "willowextra": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-extra-us.png",
  "espn": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn-us.png",
  "espn2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn2-us.png",
  "espnu": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espnu-us.png",
  "espnews": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espnews-us.png",
  "fs1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/fox-sports-1-us.png",
  "foxsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/fox-sports-1-us.png",
  "fs2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/fox-sports-2-us.png",
  "foxsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/fox-sports-2-us.png",
  "cbssportsnetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/cbs-sports-network-us.png",
  "nbcsports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/nbc-sports-bay-area-us.png",
  "nbatv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/nba-tv-us.png",
  "mlbnetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/mlb-network-us.png",
  "nflnetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/nfl-network-us.png",
  "nhlnetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/nhl-network-us.png",
  "tennisnetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/tennis-channel-us.png",
  "tennischannel": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/tennis-channel-us.png",
  "wwehd": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/wwe-network-us.png",
  "wwenetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/wwe-network-us.png",

  // Europe / International
  "eurosport1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/eurosport-1-uk.png",
  "eurosport2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/eurosport-2-uk.png",
  "dazn1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/dazn-1-uk.png",
  "dazn2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/dazn-2-uk.png",
  "dazn": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/DAZN_Logo_2019.svg/500px-DAZN_Logo_2019.svg.png",
  "canalplussport": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-sport-fr.png",
  "canalplussport360": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-sport-360-fr.png",
  "canalplusfoot": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-foot-fr.png",
  "rmcsport1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-sport-1-fr.png",
  "rmcsport2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-sport-2-fr.png",
  "movistarliga": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/movistar-laliga-es.png",
  "movistarchampions": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/movistar-liga-de-campeones-es.png",
  "movistardeportes": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/movistar-deportes-es.png",
  "setantasports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/ukraine/setanta-sports-ua.png",
  "setantasportsplus": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/ukraine/setanta-sports-plus-ua.png",
  "arena1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/arena-sport-1-premium-rs.png",
  "arenapremium1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/arena-sport-1-premium-rs.png",
  "arenasport1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/arena-sport-1-rs.png",
  "arenasport2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/arena-sport-2-rs.png",
  "arenasport3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/arena-sport-3-rs.png",
  "polstsatsport": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/poland/polsat-sport-1-pl.png",
  "polstsatsportextra": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/poland/polsat-sport-extra-pl.png",
  "sportklub1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/sport-klub-1-rs.png",
  "sportklub2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/sport-klub-2-rs.png",
  "sportklub3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/serbia/sport-klub-3-rs.png",
  "viaplay1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/viaplay-sports-1-uk.png",
  "viaplay2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/viaplay-sports-2-uk.png",
  "premier1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/premier-sports-1-uk.png",
  "premier2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/premier-sports-2-uk.png"
};

// Function to download image directly into destination file with headers & redirect support
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://google.com"
      }
    };

    const req = client.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith("http")) {
          redirectUrl = new URL(redirectUrl, url).href;
        }
        return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download (HTTP ${res.statusCode})`));
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close(() => {
          // Check if file is non-empty
          const stats = fs.statSync(destPath);
          if (stats.size < 100) {
            fs.unlinkSync(destPath);
            return reject(new Error("File too small / invalid image"));
          }
          resolve(destPath);
        });
      });

      fileStream.on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Download timeout"));
    });
  });
}

function findBestLogoUrl(channelName, upstreamLogo) {
  const clean = channelName.trim();
  const slug = cleanSlug(clean).toLowerCase().replace(/[^a-z0-9]/g, "");
  const norm = normalize(clean);

  // 1. Check exact slug in KNOWN_LOGO_MAP
  if (KNOWN_LOGO_MAP[slug]) return KNOWN_LOGO_MAP[slug];

  // 2. Check normalized in KNOWN_LOGO_MAP
  if (KNOWN_LOGO_MAP[norm]) return KNOWN_LOGO_MAP[norm];

  // 3. Partial matching in KNOWN_LOGO_MAP
  for (const [k, url] of Object.entries(KNOWN_LOGO_MAP)) {
    if (slug.includes(k) || k.includes(slug)) {
      return url;
    }
  }

  // 4. If upstream logo exists and looks valid (not empty / broken)
  if (upstreamLogo && upstreamLogo.startsWith("http") && !upstreamLogo.includes("localhost")) {
    return upstreamLogo;
  }

  return null;
}

async function run() {
  console.log("🚀 Starting Automatic Channel Logo Downloader & Syncer...\n");

  const publicLogosDir = path.join(process.cwd(), "public", "logos");
  if (!fs.existsSync(publicLogosDir)) {
    fs.mkdirSync(publicLogosDir, { recursive: true });
  }

  let channels = [];
  for (const source of sources) {
    try {
      const res = await fetch(source);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.channels) && data.channels.length > 0) {
          channels = data.channels;
          console.log(`📡 Loaded ${channels.length} channels from playlist.`);
          break;
        }
      }
    } catch (e) {}
  }

  if (channels.length === 0) {
    console.error("❌ Could not load channels.");
    process.exit(1);
  }

  const customLogosPath = path.join(process.cwd(), "custom_logos.json");
  let existingCustomLogos = {};
  if (fs.existsSync(customLogosPath)) {
    try {
      existingCustomLogos = JSON.parse(fs.readFileSync(customLogosPath, "utf-8"));
    } catch (e) {}
  }

  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    const name = ch.name.trim();
    const slug = cleanSlug(name);
    const destPng = path.join(publicLogosDir, `${slug}.png`);
    const destJpg = path.join(publicLogosDir, `${slug}.jpg`);

    // If local logo already exists, skip downloading
    if (fs.existsSync(destPng) || fs.existsSync(destJpg)) {
      skippedCount++;
      continue;
    }

    const targetUrl = existingCustomLogos[name] || findBestLogoUrl(name, ch.logo);

    if (targetUrl) {
      try {
        await downloadFile(targetUrl, destPng);
        console.log(`[${i + 1}/${channels.length}] ✅ Downloaded logo for: ${name}`);
        existingCustomLogos[name] = `/logos/${slug}.png`;
        downloadedCount++;
      } catch (err) {
        console.warn(`[${i + 1}/${channels.length}] ⚠️ Failed to download for ${name} (${targetUrl}): ${err.message}`);
        failedCount++;
      }
    } else {
      console.log(`[${i + 1}/${channels.length}] ℹ️ No suitable logo found for: ${name}`);
      failedCount++;
    }
  }

  // Save updated custom_logos.json
  fs.writeFileSync(customLogosPath, JSON.stringify(existingCustomLogos, null, 2), "utf-8");

  console.log("\n=================================");
  console.log(`🎉 Logo Sync Completed!`);
  console.log(`   - Newly Downloaded: ${downloadedCount}`);
  console.log(`   - Already Available: ${skippedCount}`);
  console.log(`   - Unmatched/Failed: ${failedCount}`);
  console.log(`   - All logos stored at: public/logos/`);
  console.log("=================================\n");
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
