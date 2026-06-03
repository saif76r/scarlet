import React from 'react';
import { Play, LogOut, ShieldAlert, Library, ListStart, Search, Sparkles, X } from 'lucide-react';
import { UserAccount } from '../types';
import logoImage from '../assets/images/scarlet_logo_1780370672962.png';

interface NavbarProps {
  currentUser: UserAccount | null;
  currentTab: 'home' | 'library' | 'admin';
  onChangeTab: (tab: 'home' | 'library' | 'admin') => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export default function Navbar({
  currentUser,
  currentTab,
  onChangeTab,
  onLogout,
  onOpenLogin,
  searchTerm,
  onSearchChange,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/45">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo Brand */}
          <div 
            onClick={() => onChangeTab('home')} 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
            id="brand-logo"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/20 shadow-md shadow-black/40 group-hover:border-[#ff3e3e]/50 group-hover:scale-105 active:scale-95 transition-all duration-300">
              <img 
                src={logoImage} 
                alt="Scarlet Sigma Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm sm:text-base md:text-lg font-bold tracking-tighter text-white flex items-center gap-1 leading-none uppercase select-none">
                SCARLET <span className="text-[#ff3e3e] font-extrabold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-white/5 border border-white/15 rounded">SIGMA</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-zinc-400 tracking-widest uppercase select-none">OTAKU FLOW</span>
            </div>
          </div>

          {/* Nav Links and Search */}
          <div className="flex-1 max-w-xs lg:max-w-sm mx-2 md:mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search series, genres, studio..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#ff3e3e]/50 focus:ring-1 focus:ring-[#ff3e3e]/30 transition-all font-sans"
                id="search-input-desktop"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2 text-zinc-400 hover:text-white transition-colors"
                  title="Clear search"
                  id="clear-search-desktop"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            {/* Standard navigational links */}
            <button
              onClick={() => onChangeTab('home')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                currentTab === 'home' 
                  ? 'bg-[#ff3e3e]/15 text-white border border-[#ff3e3e]/30 shadow-[0_0_12px_rgba(255,62,62,0.15)]' 
                  : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              id="nav-home-btn"
            >
              <ListStart className="w-3.5 h-3.5 text-[#ff3e3e]" />
              <span className="hidden sm:inline">Browse</span>
            </button>

            {currentUser && (
              <button
                onClick={() => onChangeTab('library')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                  currentTab === 'library' 
                    ? 'bg-[#ff3e3e]/15 text-white border border-[#ff3e3e]/30 shadow-[0_0_12px_rgba(255,62,62,0.15)]' 
                    : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                id="nav-library-btn"
              >
                <Library className="w-3.5 h-3.5 text-[#ff3e3e]" />
                <span className="hidden sm:inline">My Library</span>
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onChangeTab('admin')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                  currentTab === 'admin' 
                    ? 'bg-[#ff3e3e]/20 text-[#ff3e3e] border border-[#ff3e3e]/35 shadow-[0_0_12px_rgba(255,62,62,0.2)]' 
                    : 'text-zinc-300 hover:text-[#ff3e3e] hover:bg-white/5 border border-transparent'
                }`}
                id="nav-admin-btn"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#ff3e3e]" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Auth section */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/10 pl-2 lg:pl-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white max-w-[100px] truncate leading-none">
                    {currentUser.username}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 tracking-wider uppercase mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-orange-500 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-md" title={`${currentUser.username} (${currentUser.role})`}>
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 text-zinc-400 hover:text-[#ff3e3e] hover:bg-white/5 rounded-full transition-all active:scale-90"
                  title="Logout"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-2.5 sm:px-4 py-1.5 bg-[#ff3e3e] hover:bg-[#ff5555] active:scale-95 text-white font-bold text-[10px] sm:text-xs rounded-full shadow-lg shadow-[#ff3e3e]/20 transition-all flex items-center gap-1 sm:gap-1.5"
                id="nav-signin-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 block md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search series, genres, studio..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#ff3e3e]/50"
              id="search-input-mobile"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2 text-zinc-400 hover:text-white transition-colors"
                title="Clear search"
                id="clear-search-mobile"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
