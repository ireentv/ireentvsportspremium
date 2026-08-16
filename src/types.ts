export interface ChannelHeaders {
  Referer?: string;
  Origin?: string;
  "User-Agent"?: string;
  "x-forwarded-for"?: string;
  [key: string]: string | undefined;
}

export interface ChannelAttrs {
  "tvg-chno"?: string;
  "tvg-id"?: string;
  [key: string]: string | undefined;
}

export interface Channel {
  name: string;
  logo: string;
  url: string;
  group: string;
  url_raw?: string;
  headers?: ChannelHeaders;
  attrs?: ChannelAttrs;
}

export interface PlaylistData {
  status?: string;
  owner?: string;
  telegram?: string;
  website?: string;
  developer?: string;
  version?: string;
  name?: string;
  channels_amount?: number;
  Last_update?: string;
  channels: Channel[];
}

export type Language = "bn" | "en";

export interface Translations {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allCategories: string;
  favorites: string;
  noFavorites: string;
  noChannels: string;
  streamProxyActive: string;
  streamProxyDesc: string;
  directPlay: string;
  directPlayDesc: string;
  nowPlaying: string;
  aspectRatio: string;
  stats: string;
  buffer: string;
  resolution: string;
  language: string;
  owner: string;
  developer: string;
  lastUpdate: string;
  liveBadge: string;
  share: string;
  copied: string;
  channelsCount: string;
  reloadStream: string;
  theaterMode: string;
  exitTheaterMode: string;
  play: string;
  pause: string;
  volume: string;
  mute: string;
  unmute: string;
}
