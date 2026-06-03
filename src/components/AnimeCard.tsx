import React from 'react';
import { Play } from 'lucide-react';
import { Anime } from '../types';

interface AnimeCardProps {
  key?: string;
  anime: Anime;
  onSelect: (animeId: string) => void;
  watchHistoryProgress?: {
    percentage: number;
    episodeNumber: number;
    completed: boolean;
  } | null;
}

export default function AnimeCard({ 
  anime, 
  onSelect,
  watchHistoryProgress = null 
}: AnimeCardProps) {
  return (
    <div 
      onClick={() => onSelect(anime.id)}
      className="group relative flex flex-col glass rounded-2xl overflow-hidden cursor-pointer card-hover"
      id={`anime-card-${anime.id}`}
    >
      {/* Cover Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
        <img 
          src={anime.coverUrl} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Dark vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90" />

        {/* Rating Guide Badge */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-zinc-200 font-mono text-[9px] rounded font-bold uppercase tracking-wider border border-white/10">
          {anime?.rating || 'PG-13'}
        </span>
 
        {/* Release season backdrop badge */}
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-[#ff3e3e]/80 backdrop-blur-md text-white font-mono text-[9px] rounded font-extrabold border border-white/20">
          {anime?.releaseYear || 2026}
        </span>
 
        {/* Hover Fast Play Trigger icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity duration-300">
          <div className="w-12 h-12 bg-[#ff3e3e] rounded-full flex items-center justify-center shadow-lg shadow-[#ff3e3e]/40 transform scale-75 group-hover:scale-100 transition-all duration-300 text-white">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
 
        {/* Watch Progress Bar indicator */}
        {watchHistoryProgress && (
          <div className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-md p-2 border-t border-white/10 flex flex-col gap-1 z-10">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold">
               <span className="text-zinc-300">EPISODE {watchHistoryProgress.episodeNumber}</span>
               <span className="text-[#ff3e3e] font-extrabold">{watchHistoryProgress.completed ? 'COMPLETED' : `${Math.round(watchHistoryProgress.percentage)}%`}</span>
            </div>
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full ${watchHistoryProgress.completed ? 'bg-emerald-500' : 'bg-[#ff3e3e]'}`}
                style={{ width: `${watchHistoryProgress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
 
      {/* Narrative Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[9.5px] font-mono text-zinc-400 tracking-wider font-semibold uppercase">
            {anime?.studio || 'Unknown Studio'}
          </span>
          <h3 className="font-display font-medium text-white text-sm line-clamp-1 group-hover:text-[#ff3e3e] transition-colors mt-0.5 uppercase tracking-tight">
            {anime?.title || 'Untitled Series'}
          </h3>
          <p className="text-xs text-zinc-300 mt-1.5 line-clamp-2 leading-relaxed opacity-85">
            {anime?.description || ''}
          </p>
        </div>
 
        {/* Genres tag badges */}
        <div className="flex flex-wrap gap-1 mt-3.5 pt-3 border-t border-white/5">
          {(anime?.genres || []).slice(0, 3).map((genre) => (
            <span 
              key={genre} 
              className="text-[9px] font-medium bg-white/5 text-zinc-200 border border-white/5 px-2 py-0.5 rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
