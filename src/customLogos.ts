export const customLogosMap: Record<string, string> = {
  "La Liga TV": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/laliga-tv-es.png",
  "LaLigaTV": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/spain/laliga-tv-es.png",
  "T Sports": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/T_Sports_logo.svg/330px-T_Sports_logo.svg.png",
  "T_Sports": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/T_Sports_logo.svg/330px-T_Sports_logo.svg.png",
  "Sony Ten 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-1-in.png",
  "Sony Sports Ten 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-1-in.png",
  "Sony Ten 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-2-in.png",
  "Sony Sports Ten 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-2-in.png",
  "Sony Ten 3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-3-in.png",
  "Sony Sports Ten 3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-3-in.png",
  "Sony Ten 5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-5-in.png",
  "Sony Sports Ten 5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-5-in.png",
  "Star Sports 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-1-in.png",
  "Star Sports 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-2-in.png",
  "Star Sports Select 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-select-1-in.png",
  "Star Sports Select 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-select-2-in.png",
  "Sky Sports Main Event": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-main-event-uk.png",
  "Sky Sports Premier League": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-premier-league-uk.png",
  "Sky Sports Football": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-football-uk.png",
  "Sky Sports Cricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-cricket-uk.png",
  "Sky Sports F1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-f1-uk.png",
  "TNT Sports 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-1-uk.png",
  "TNT Sports 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-2-uk.png",
  "TNT Sports 3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-3-uk.png",
  "TNT Sports 4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-4-uk.png",
  "BeIN Sports 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-1-qa.png",
  "BeIN Sports 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-2-qa.png",
  "BeIN Sports 3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/qatar/bein-sports-3-qa.png",
  "A Sports": "https://upload.wikimedia.org/wikipedia/en/3/30/A_Sports_Logo.png",
  "Ten Sports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/ten-sports-pk.png",
  "PTV Sports": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/pakistan/ptv-sports-pk.png",
  "Willow HD": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-us.png",
  "Willow Cricket": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-us.png",
  "Astro SuperSport 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-supersport-1-my.png",
  "Astro SuperSport 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/malaysia/astro-supersport-2-my.png",
  "SuperSport Premier League": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-premier-league-za.png",
  "SuperSport Football": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/south-africa/supersport-football-za.png",
  "Eurosport 1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/eurosport-1-uk.png",
  "Eurosport 2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/eurosport-2-uk.png"
};

export function getChannelLogo(channelName: string, defaultLogo?: string): string {
  if (!channelName) return defaultLogo || "";
  const cleanName = channelName.trim();
  const simpleKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (customLogosMap[cleanName]) return customLogosMap[cleanName];

  for (const [key, url] of Object.entries(customLogosMap)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === simpleKey) {
      return url;
    }
  }

  return defaultLogo || "";
}
