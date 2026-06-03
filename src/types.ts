export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string; // e.g. "English", "Español", "日本語"
  srclang: string; // e.g. "en", "es", "ja"
  cues: SubtitleCue[];
}

export interface CustomSubtitle {
  id: string;
  episodeId: string;
  label: string;
  srclang: string;
  cues: SubtitleCue[];
  createdAt: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: string; // e.g. "24:00"
  thumbnail: string;
  subtitles: SubtitleTrack[];
  srtSubtitles?: string;
}

export interface Anime {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  logoUrl?: string;
  genres: string[];
  rating: string; // e.g. "PG-13", "R-17"
  totalEpisodes: number;
  releaseYear: number;
  studio: string;
  featured?: boolean;
  episodes: Episode[];
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  animeId: string;
  episodeId: string;
  watchedAt: string;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
}
