import React, { useState } from 'react';
import { 
  ArrowLeft, Play, Clock, CheckCircle2, Tv, Film, 
  HelpCircle, Calendar, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';
import { Anime, Episode, WatchHistoryItem } from '../types';
import VideoPlayer from './VideoPlayer';

interface AnimeDetailProps {
  anime: Anime;
  onBack: () => void;
  activeEpisodeId: string | null;
  onSelectEpisode: (episodeId: string) => void;
  watchHistory: Record<string, { progressSeconds: number, durationSeconds: number, completed: boolean }>;
  onProgressUpdate: (episodeId: string, progressSeconds: number, durationSeconds: number) => void;
  isUserLoggedIn: boolean;
  onOpenLogin: () => void;
  isAdmin?: boolean;
}

export default function AnimeDetail({
  anime,
  onBack,
  activeEpisodeId,
  onSelectEpisode,
  watchHistory,
  onProgressUpdate,
  isUserLoggedIn,
  onOpenLogin,
  isAdmin = false
}: AnimeDetailProps) {
  const episodes = anime?.episodes || [];
  const activeEpisode = episodes.find(ep => ep.id === activeEpisodeId);

  // Helper to retrieve progress percentage for any episode
  const getProgressInfo = (episodeId: string) => {
    const hist = watchHistory ? watchHistory[episodeId] : null;
    if (!hist) return null;
    const pct = hist.durationSeconds > 0 ? (hist.progressSeconds / hist.durationSeconds) * 100 : 0;
    return {
      percentage: Math.min(Math.max(pct, 0), 100),
      completed: hist.completed || pct >= 90 // Mark complete after 90%
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id={`anime-detail-root-${anime.id}`}>
      
      {/* Back button link */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-mono font-semibold uppercase mb-6 transition-colors"
        id="detail-back-btn"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>BACK TO BROWSE</span>
      </button>

      {/* Immersive Cinematic Video Screen (If an episode is active) */}
      {activeEpisode && (
        <div className="mb-8" id="video-theater-wrapper">
          <div className="glass p-2 md:p-3 rounded-2xl">
            <VideoPlayer
              episode={activeEpisode}
              animeTitle={anime.title}
              initialProgressSeconds={watchHistory[activeEpisode.id]?.progressSeconds || 0}
              onProgressUpdate={(cur, dur) => {
                onProgressUpdate(activeEpisode.id, cur, dur);
              }}
              isAdmin={isAdmin}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 glass rounded-2xl p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#ff3e3e]/20 text-[#ff3e3e] rounded border border-[#ff3e3e]/30">
                  PLAYING EPISODE {activeEpisode.episodeNumber}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Duration: {activeEpisode.duration}</span>
              </div>
              <h2 className="text-xl font-display font-medium text-white mt-2 leading-none uppercase tracking-tight">
                {activeEpisode.title}
              </h2>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed opacity-90">
                {activeEpisode.description}
              </p>
            </div>

            {!isUserLoggedIn && (
              <div 
                onClick={onOpenLogin}
                className="flex items-center gap-2 p-2 px-3 bg-[#ff3e3e]/10 border border-[#ff3e3e]/25 rounded-xl cursor-pointer hover:bg-[#ff3e3e]/20 transition-colors self-stretch sm:self-center justify-center shrink-0"
              >
                <AlertCircle className="w-4 h-4 text-[#ff3e3e] shrink-0 animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-zinc-305 text-center">
                  Sign in to save watch progress!
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cinematic Wide Billboard Banner (Visible when no episode is playing) */}
      {!activeEpisode && anime.bannerUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden mb-8 h-[220px] sm:h-[300px] md:h-[380px] glass border border-white/10 group shadow-2xl">
          {/* Background image */}
          <img 
            src={anime.bannerUrl} 
            alt={`${anime.title} Banner`}
            className="w-full h-full object-cover select-none group-hover:scale-[1.01] transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Gradients to mask & style background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/30 to-transparent" />
          
          {/* Content overlaid on top of the banner */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
            <div className="max-w-2xl">
              {anime.logoUrl ? (
                <img 
                  src={anime.logoUrl} 
                  alt={anime.title} 
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain mb-4 select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] animate-fade-in"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <h1 className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {anime.title}
                </h1>
              )}
              
              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 md:line-clamp-3 mt-2 opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-xl">
                {anime.description}
              </p>

              {episodes.length > 0 && (
                <button
                  onClick={() => onSelectEpisode(episodes[0].id)}
                  className="mt-4 px-5 py-2.5 bg-[#ff3e3e] hover:bg-[#ff5555] active:scale-95 text-white font-bold text-xs uppercase font-mono tracking-wider rounded-xl transition-all shadow-lg shadow-[#ff3e3e]/30 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY FIRST EPISODE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner Grid (Visible when no video is active OR underneath) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Anime Cover Poster panel */}
        <div className="col-span-1 flex flex-col gap-5">
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden glass shadow-2xl">
            <img 
              src={anime.coverUrl} 
              alt={anime.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            
            {/* Overlay Start Play Button triggers EP 1 */}
            {episodes.length > 0 && !activeEpisodeId && (
              <button
                onClick={() => onSelectEpisode(episodes[0].id)}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/55 transition-colors group/play"
              >
                <div className="w-16 h-16 rounded-full bg-[#ff3e3e] group-hover/play:scale-110 transition-transform flex items-center justify-center shadow-lg shadow-[#ff3e3e]/20 text-white">
                  <Play className="w-7 h-7 fill-white ml-1 text-white" />
                </div>
                <span className="text-xs text-white font-display font-bold uppercase tracking-widest mt-4">
                  STREAM FIRST EPISODE
                </span>
              </button>
            )}
          </div>

          {/* Show Production Sheets specifications */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-3 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 text-zinc-400">
              <span className="font-semibold text-[#ff3e3e] uppercase text-[10px] tracking-widest flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> SPEC SHEET
              </span>
              <span className="font-mono text-[9px] text-zinc-500">SCARLET BINGO</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Origin Studio:</span>
              <span className="font-medium text-white text-right">{anime.studio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Release Date:</span>
              <span className="font-semibold text-[#ff3e3e] font-mono text-right">{anime.releaseYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Age Guidelines Rating:</span>
              <span className="font-semibold text-zinc-300 font-mono text-right">{anime.rating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Available Episodes:</span>
              <span className="font-mono text-zinc-300 text-right">{episodes.length} Index Tracks</span>
            </div>
          </div>
        </div>

        {/* Center / Right Side: Hero description panel & Episodes list */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(anime.genres || []).map(genre => (
                <span key={genre} className="text-[10px] uppercase font-mono font-bold bg-white/5 text-zinc-200 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {genre}
                </span>
              ))}
            </div>
            {anime.logoUrl ? (
              <div className="mb-2">
                <img 
                  src={anime.logoUrl} 
                  alt={anime.title} 
                  className="h-12 sm:h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(255,62,62,0.25)]"
                  referrerPolicy="no-referrer"
                />
                <h1 className="sr-only">{anime.title}</h1>
              </div>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight uppercase leading-none">
                {anime.title}
              </h1>
            )}
            <p className="text-sm text-zinc-200 mt-4 leading-relaxed glass p-5 rounded-2xl border border-white/10 opacity-90">
              {anime.description}
            </p>
          </div>

          {/* Episode Directory container */}
          <div className="glass rounded-2xl p-5" id="episodes-directory">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2.5 flex items-center gap-2">
              <Film className="w-4 h-4 text-[#ff3e3e]" />
              <span>Series Episodes Tracklist ({episodes.length})</span>
            </h3>

            {episodes.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs text-zinc-500">
                <p>No recorded episode streams found for this anime title.</p>
                {isUserLoggedIn && (
                  <p className="mt-1 text-zinc-650">Admin accounts can add episodes inside the Admin Dashboard.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
                {episodes.map(episode => {
                  const progress = getProgressInfo(episode.id);
                  const isCurPlaying = activeEpisodeId === episode.id;

                  return (
                    <div
                      key={episode.id}
                      onClick={() => onSelectEpisode(episode.id)}
                      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-xl border border-transparent cursor-pointer transition-all ${
                        isCurPlaying 
                          ? 'bg-[#ff3e3e]/10 border-[#ff3e3e]/25' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      {/* Left: Thumbnail & Duration tag */}
                      <div className="relative w-full sm:w-28 md:w-36 aspect-video rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/5">
                        <img 
                          src={episode.thumbnail} 
                          alt={episode.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 font-mono text-[9px] text-zinc-300 rounded border border-white/5">
                          {episode.duration}
                        </span>
                        
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      </div>

                      {/* Right Detail sheet */}
                      <div className="flex-1 flex flex-col justify-between self-stretch">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#ff3e3e] font-bold uppercase">
                              Ep. {episode.episodeNumber}
                            </span>
                            
                            {/* Watch status icon */}
                            {progress?.completed ? (
                              <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60">
                                <CheckCircle2 className="w-3 h-3 fill-emerald-400 text-black" /> WATCHED
                              </span>
                            ) : progress && progress.percentage > 0 ? (
                              <span className="text-[9px] font-mono text-[#ff3e3e] font-bold flex items-center gap-1 bg-[#ff3e3e]/10 px-1.5 py-0.5 rounded border border-[#ff3e3e]/20">
                                <Clock className="w-3 h-3 text-[#ff3e3e]" /> RESUME ({Math.round(progress.percentage)}%)
                              </span>
                            ) : null}
                          </div>

                          <h4 className={`text-xs font-bold leading-snug mt-1 transition-colors uppercase tracking-tight ${
                            isCurPlaying ? 'text-[#ff3e3e]' : 'text-white group-hover:text-[#ff5555]'
                          }`}>
                            {episode.title}
                          </h4>
                          <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2 leading-relaxed opacity-85">
                            {episode.description}
                          </p>
                        </div>

                        {/* Progress Bar underlaid */}
                        {progress && progress.percentage > 0 && !progress.completed && (
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-3 max-w-[200px]">
                            <div 
                              className="h-full bg-[#ff3e3e]" 
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
