export function cleanSlug(name: string): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

// Map for quick overrides or direct static path resolution
export function getChannelLogo(channelName: string, defaultLogo?: string): string {
  if (!channelName) return defaultLogo || "";
  const slug = cleanSlug(channelName);

  // Directly return the locally downloaded/generated logo file
  return `/logos/${slug}.png`;
}
