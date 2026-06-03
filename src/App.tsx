import React, { useState, useEffect } from 'react';
import { 
  Play, Library, ShieldAlert, Sparkles, Tv, Flame, Clapperboard, 
  Search, Plus, LogIn, Heart, Film, ArrowRight, CheckCircle2, Bookmark
} from 'lucide-react';
import { INITIAL_USERS, INITIAL_ANIME_DATA, isEmailAdmin } from './initialData';
import { Anime, UserAccount, Episode } from './types';
import Navbar from './components/Navbar';
import AnimeCard from './components/AnimeCard';
import AnimeDetail from './components/AnimeDetail';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import logoImage from './assets/images/scarlet_logo_1780370672962.png';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

export default function App() {
  // 1. Core State with LocalStorage/Firestore sync
  const [animeList, setAnimeList] = useState<Anime[]>(() => {
    const saved = localStorage.getItem('scarlet_bingo_anime');
    if (saved) {
      try { 
        return JSON.parse(saved) as Anime[];
      } catch (e) { 
        console.error(e); 
      }
    }
    return INITIAL_ANIME_DATA;
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('scarlet_bingo_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('scarlet_bingo_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  // Track the history as high-level key: "userId_episodeId" or just load the record
  const [watchHistoryRecord, setWatchHistoryRecord] = useState<Record<string, { progressSeconds: number, durationSeconds: number, completed: boolean }>>(() => {
    const saved = localStorage.getItem('scarlet_bingo_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  // Navigation and Filters
  const [currentTab, setCurrentTab] = useState<'home' | 'library' | 'admin'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  // Selection
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. Keep Auth sync with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Direct document lookup is incredibly fast compared to slow queries
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const profile = profileSnap.data() as UserAccount;
            setCurrentUser(profile);
            localStorage.setItem('scarlet_bingo_current_user', JSON.stringify(profile));
          } else {
            // Check if profile exists under this email via fast fallback check
            const emailClean = firebaseUser.email || '';
            const emailQuerySnap = await getDocs(query(collection(db, 'users'), where('email', '==', emailClean)));
            
            let profile: UserAccount;
            if (!emailQuerySnap.empty) {
              profile = emailQuerySnap.docs[0].data() as UserAccount;
            } else {
              profile = {
                id: firebaseUser.uid,
                email: emailClean,
                username: firebaseUser.displayName || emailClean.split('@')[0] || 'Subscriber',
                role: isEmailAdmin(emailClean) ? 'admin' : 'user',
                createdAt: new Date().toISOString()
              };
            }
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
            setCurrentUser(profile);
            localStorage.setItem('scarlet_bingo_current_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.error("Auth profile resolve failed: ", err);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('scarlet_bingo_current_user');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Sync Anime catalog with Firestore
  useEffect(() => {
    const checkAndSyncSeed = async () => {
      try {
        // Core DB Purging: Delete deprecated series from active Firebase database to keep records absolutely clean
        const deprecatedAnimeIds = ['naruto', 'demon-slayer', 'attack-on-titan', 'death-note'];
        for (const badId of deprecatedAnimeIds) {
          try {
            await deleteDoc(doc(db, 'anime', badId));
          } catch (e) {
            console.warn(`Could not prune obsolete doc ${badId}:`, e);
          }
        }

        // New Collection Seeding check
        const primaryDocRef = doc(db, 'anime', 'your-name');
        const primaryDocSnap = await getDoc(primaryDocRef);
        if (!primaryDocSnap.exists()) {
          console.log("Seeding premium movie catalog to Firestore database...");
          for (const anime of INITIAL_ANIME_DATA) {
            await setDoc(doc(db, 'anime', anime.id), anime);
          }
        }
      } catch (err) {
        console.error("Error migrating/syncing anime movie catalog: ", err);
      }
    };
    checkAndSyncSeed();

    const unsubscribe = onSnapshot(collection(db, 'anime'), (snapshot) => {
      const items: Anime[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Anime);
      });
      if (items.length > 0) {
        setAnimeList(items);
        localStorage.setItem('scarlet_bingo_anime', JSON.stringify(items));
      }
    }, (error) => {
      console.error("Anime catalog collection subscription rejected:", error);
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync User profiles with Firestore (mainly for administrative displays)
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setUserAccounts([]);
      return;
    }

    const checkAndSeedUsers = async () => {
      try {
        const q = collection(db, 'users');
        const snap = await getDocs(q);
        if (snap.empty) {
          for (const user of INITIAL_USERS) {
            await setDoc(doc(db, 'users', user.id), user);
          }
        }
      } catch (err) {
        console.error("Error checking/seeding users catalog: ", err);
      }
    };
    checkAndSeedUsers();

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserAccount[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as UserAccount);
      });
      if (list.length > 0) {
        setUserAccounts(list);
        localStorage.setItem('scarlet_bingo_users', JSON.stringify(list));
      }
    }, (error) => {
      console.error("User catalog collection subscription rejected: ", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 4. Sync Watch progress logs with Firestore real-time
  useEffect(() => {
    if (!currentUser) {
      setWatchHistoryRecord({});
      return;
    }

    const q = query(collection(db, 'history'), where('userId', '==', currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hRecord: Record<string, { progressSeconds: number, durationSeconds: number, completed: boolean }> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        hRecord[`${currentUser.id}_${data.episodeId}`] = {
          progressSeconds: data.progressSeconds,
          durationSeconds: data.durationSeconds,
          completed: data.completed
        };
      });
      setWatchHistoryRecord(hRecord);
      localStorage.setItem('scarlet_bingo_history', JSON.stringify(hRecord));
    }, (error) => {
      console.error("Watch history query subscription rejected: ", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle logout standard execution
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Signout failed: ", err);
    }
    setCurrentUser(null);
    setCurrentTab('home');
    setSelectedAnimeId(null);
    setActiveEpisodeId(null);
  };

  // Administrative collection synchronization triggers
  const handleUpdateAnimeList = async (updatedList: Anime[]) => {
    // Immediately update local state to ensure stellar interface speed
    setAnimeList(updatedList);
    localStorage.setItem('scarlet_bingo_anime', JSON.stringify(updatedList));
    
    try {
      // Surgical State Diffing: Identify only what was actually added, modified, or deleted locally
      const currentMap = new Map<string, Anime>(animeList.map(a => [a.id, a]));
      const updatedMap = new Map<string, Anime>(updatedList.map(a => [a.id, a]));
      
      const batchPromises: Promise<any>[] = [];
      
      // 1. Identify deletions: Exist in current but not in updated list
      for (const [id] of currentMap.entries()) {
        if (!updatedMap.has(id)) {
          console.log(`Smart Sync: Deleting anime "${id}" from Firestore`);
          batchPromises.push(deleteDoc(doc(db, 'anime', id)));
        }
      }
      
      // 2. Identify additions and updates: Exist in updated list but are new or changed
      for (const [id, updatedAnime] of updatedMap.entries()) {
        const currentAnime = currentMap.get(id);
        if (!currentAnime || JSON.stringify(currentAnime) !== JSON.stringify(updatedAnime)) {
          console.log(`Smart Sync: Writing anime "${id}" to Firestore`);
          batchPromises.push(setDoc(doc(db, 'anime', id), updatedAnime));
        }
      }
      
      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'anime');
    }
  };

  const handleUpdateUserAccounts = async (updatedAccounts: UserAccount[]) => {
    setUserAccounts(updatedAccounts);
    localStorage.setItem('scarlet_bingo_users', JSON.stringify(updatedAccounts));
    
    try {
      // Surgical State Diffing for administration controls
      const currentMap = new Map<string, UserAccount>(userAccounts.map(u => [u.id, u]));
      const updatedMap = new Map<string, UserAccount>(updatedAccounts.map(u => [u.id, u]));
      
      const batchPromises: Promise<any>[] = [];
      
      // 1. Identify deletions
      for (const [id] of currentMap.entries()) {
        if (!updatedMap.has(id)) {
          console.log(`Smart Sync: Deleting user "${id}" from Firestore`);
          batchPromises.push(deleteDoc(doc(db, 'users', id)));
        }
      }
      
      // 2. Identify additions/updates
      for (const [id, updatedUser] of updatedMap.entries()) {
        const currentUserObj = currentMap.get(id);
        if (!currentUserObj || JSON.stringify(currentUserObj) !== JSON.stringify(updatedUser)) {
          console.log(`Smart Sync: Writing user "${id}" to Firestore`);
          batchPromises.push(setDoc(doc(db, 'users', id), updatedUser));
        }
      }
      
      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  // List of all genres across the entire database dynamically
  const availableGenres = Array.from(
    new Set((animeList || []).flatMap(a => a?.genres || []))
  ).filter(Boolean);

  // Search filter
  const filteredAnimeList = (animeList || []).filter(anime => {
    if (!anime) return false;
    const query = searchTerm.toLowerCase();
    const title = anime.title || '';
    const description = anime.description || '';
    const studio = anime.studio || '';
    const genres = anime.genres || [];

    const matchesSearch = 
      title.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query) ||
      studio.toLowerCase().includes(query) ||
      genres.some(g => g && g.toLowerCase().includes(query));

    const matchesGenre = selectedGenre ? genres.includes(selectedGenre) : true;
    return matchesSearch && matchesGenre;
  });

  // Get active selected anime object
  const currentAnime = (animeList || []).find(a => a && a.id === selectedAnimeId);

  // Extract user-specific watch history
  const getUserEpisodesHistory = (): Record<string, { progressSeconds: number, durationSeconds: number, completed: boolean }> => {
    if (!currentUser) return {} as Record<string, { progressSeconds: number, durationSeconds: number, completed: boolean }>;
    const parsed: Record<string, { progressSeconds: number, durationSeconds: number, completed: boolean }> = {};
    for (const key in watchHistoryRecord || {}) {
      if (key.startsWith(`${currentUser.id}_`)) {
        const episodeId = key.replace(`${currentUser.id}_`, '');
        parsed[episodeId] = watchHistoryRecord[key];
      }
    }
    return parsed;
  };

  // Update real-time progress for current playing video stream
  const handleProgressUpdate = async (episodeId: string, progressSeconds: number, durationSeconds: number) => {
    if (!currentUser) return; // Guest viewing does not save historical logs
    const completed = progressSeconds / durationSeconds >= 0.92; // complete at 92%
    const key = `${currentUser.id}_${episodeId}`;
    
    setWatchHistoryRecord(prev => ({
      ...prev,
      [key]: {
        progressSeconds,
        durationSeconds,
        completed: prev?.[key]?.completed ? true : completed
      }
    }));

    try {
      await setDoc(doc(db, 'history', key), {
        id: key,
        userId: currentUser.id,
        animeId: selectedAnimeId || '',
        episodeId,
        watchedAt: new Date().toISOString(),
        progressSeconds,
        durationSeconds,
        completed: watchHistoryRecord?.[key]?.completed ? true : completed
      });
    } catch (error) {
      console.warn("Watch history telemetry save ignored: ", error);
    }
  };

  // Generate aggregate status metrics of what has been watched of an Anime
  const getOverallAnimeProgress = (anime: Anime) => {
    if (!currentUser || !anime) return null;
    let totalWatchedPct = 0;
    let matchingHistoryCount = 0;
    let lastWatchedEpNum = 1;
    let completed = false;

    const episodes = anime.episodes || [];
    episodes.forEach(ep => {
      if (!ep) return;
      const key = `${currentUser.id}_${ep.id}`;
      const hist = watchHistoryRecord ? watchHistoryRecord[key] : null;
      if (hist) {
        matchingHistoryCount++;
        const epPct = hist.durationSeconds > 0 ? (hist.progressSeconds / hist.durationSeconds) * 100 : 0;
        totalWatchedPct += epPct;
        lastWatchedEpNum = ep.episodeNumber || 1;
        if (hist.completed) {
          completed = true;
        }
      }
    });

    if (matchingHistoryCount === 0 || episodes.length === 0) return null;

    return {
      percentage: totalWatchedPct / episodes.length,
      episodeNumber: lastWatchedEpNum,
      completed: completed && matchingHistoryCount === episodes.length
    };
  };

  // Auto pick featured show for billboard
  const featuredBillboardAnime = (animeList || []).find(a => a && !!a.featured) || (animeList || [])[0];

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans relative pb-16 bg-[#050505]" id="applet-viewport">
      {/* Dynamic Ambient Background Mesh */}
      <div className="mesh-bg" />
      
      {/* Scarlet Sigma Premium Header */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          // If we are browsing home, clear active episodes triggers
          if (tab === 'home') {
            setSelectedAnimeId(null);
            setActiveEpisodeId(null);
          }
        }}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* RENDER CHOSEN SCREEN WORKSPACE */}
      <main className="flex-grow">
        
        {/* ADMIN HUB */}
        {currentTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            animeList={animeList}
            userAccounts={userAccounts}
            onUpdateAnimeList={handleUpdateAnimeList}
            onUpdateUserAccounts={handleUpdateUserAccounts}
          />
        )}

        {/* LIBRARY PANEL */}
        {currentTab === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="library-workspace">
            {!currentUser ? (
              <div className="text-center py-16 bg-[#121216]/50 border border-white/10 backdrop-blur-md rounded-2xl max-w-lg mx-auto p-8 shadow-2xl relative overflow-hidden">
                <Bookmark className="w-12 h-12 text-[#ff3e3e]/80 mx-auto mb-4 animate-bounce" />
                <h2 className="text-xl font-display font-black text-white">Join the Scarlet Sigma Otaku Club</h2>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  Sign up for an account to bookmark, track your active stream durations, customize subtitles, and persist your watchlist values.
                </p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="mt-6 px-6 py-2.5 bg-[#ff3e3e] hover:bg-[#ff5555] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#ff3e3e]/30 active:scale-95 transition-all cursor-pointer"
                  id="library-login-cta-btn"
                >
                  Create or Sign In to Account
                </button>
              </div>
            ) : (
              <div>
                <div className="border-b border-white/10 pb-4 mb-6">
                  <h1 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-2">
                    <Library className="w-6 h-6 text-[#ff3e3e]" />
                    <span>My Personal Watch History Library</span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage active streams, resume episodes, and review catalog updates matching profile: <strong className="text-[#ff3e3e]">{currentUser.username}</strong>
                  </p>
                </div>

                {/* Filter and render only if there's tracked elements */}
                {Object.keys(getUserEpisodesHistory()).length === 0 ? (
                  <div className="text-center py-16 bg-[#121216]/20 border border-dashed border-white/10 rounded-2xl max-w-lg mx-auto p-8">
                    <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Your watchlist is pristine!</p>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto mb-2">
                      Go to the browse page, pick Naruto, Attack on Titan or other titles to witness stream progress syncing!
                    </p>
                    <button
                      onClick={() => setCurrentTab('home')}
                      className="mt-4 text-xs font-bold text-[#ff3e3e] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Anime Shelf</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Render active anime objects with the computed watch history */}
                    {animeList.map(anime => {
                      const progress = getOverallAnimeProgress(anime);
                      if (!progress) return null; // Only render those with active history records

                      return (
                        <AnimeCard
                          key={`lib-${anime.id}`}
                          anime={anime}
                          onSelect={(id) => {
                            setSelectedAnimeId(id);
                            setCurrentTab('home'); // Route back to watch screen
                            
                            // Auto select the episode with progress
                            const userHist = getUserEpisodesHistory();
                            const lastWatchedEp = anime.episodes.find(ep => userHist[ep.id] && !userHist[ep.id].completed);
                            if (lastWatchedEp) {
                              setActiveEpisodeId(lastWatchedEp.id);
                            } else if (anime.episodes.length > 0) {
                              setActiveEpisodeId(anime.episodes[0].id);
                            }
                          }}
                          watchHistoryProgress={progress}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EXPLORE SHOWS & watch HUD HOME TAB */}
        {currentTab === 'home' && (
          <div>
            {currentAnime ? (
              /* DETAILED IMMERSIVE MOVIE SCREEN MODE */
              <AnimeDetail
                anime={currentAnime}
                onBack={() => {
                  setSelectedAnimeId(null);
                  setActiveEpisodeId(null);
                }}
                activeEpisodeId={activeEpisodeId}
                onSelectEpisode={setActiveEpisodeId}
                watchHistory={getUserEpisodesHistory()}
                onProgressUpdate={handleProgressUpdate}
                isUserLoggedIn={!!currentUser}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                isAdmin={currentUser?.role === 'admin'}
              />
            ) : (
              /* THE GENERAL STREAM DECK LANDING */
              <div>
                {/* 1. Cinematic Billboard Banner */}
                {featuredBillboardAnime && !searchTerm && !selectedGenre && (
                  <div 
                    className="relative w-full aspect-[21/9] min-h-[340px] md:min-h-[480px] bg-[#0c0c0e] flex items-end overflow-hidden border-b border-white/10"
                    id="cinematic-featured-billboard"
                  >
                    {/* Billboard Backdrop */}
                    <img 
                      src={featuredBillboardAnime.bannerUrl} 
                      alt={featuredBillboardAnime.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-35 scale-102 transform hover:scale-104 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />

                    {/* Left overlay vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#040406] via-[#040406]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#040406] via-[#040406]/35 to-transparent" />

                    {/* Billboard Context and Play calls */}
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full z-10">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-1.5 text-[#ff3e3e] font-mono text-[10px] font-extrabold uppercase tracking-widest mb-3">
                          <Flame className="w-4 h-4 fill-[#ff3e3e] animate-pulse text-[#ff3e3e]" />
                          <span>FEATURED TRENDING HIT</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-none mb-4">
                          {featuredBillboardAnime.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-300 mb-6 line-clamp-3 leading-relaxed">
                          {featuredBillboardAnime.description}
                        </p>

                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedAnimeId(featuredBillboardAnime.id);
                              if (featuredBillboardAnime.episodes.length > 0) {
                                setActiveEpisodeId(featuredBillboardAnime.episodes[0].id);
                              }
                            }}
                            className="px-6 py-3.5 bg-[#ff3e3e] hover:bg-[#ff5555] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#ff3e3e]/30 flex items-center gap-2 transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
                            id="banner-play-btn"
                          >
                            <Play className="w-4.5 h-4.5 fill-white" />
                            <span>STREAM EPISODE 1</span>
                          </button>

                          <button
                            onClick={() => setSelectedAnimeId(featuredBillboardAnime.id)}
                            className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            id="banner-detail-btn"
                          >
                            <span>Eps & Synopsis</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Browse shelf with Categories & filters */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="browse-sections">
                  
                  {/* Genre Tag Switcher row */}
                  <div className="flex items-center justify-between mb-6 gap-4 overflow-x-auto pb-2 scrollbar-none">
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedGenre(null)}
                        className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                          selectedGenre === null 
                            ? 'bg-[#ff3e3e] text-white font-extrabold shadow-lg shadow-[#ff3e3e]/30' 
                            : 'bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        All Genres
                      </button>
                      {availableGenres.map(genre => (
                        <button
                          key={genre}
                          onClick={() => setSelectedGenre(genre)}
                          className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                            selectedGenre === genre
                              ? 'bg-[#ff3e3e] text-white font-extrabold shadow-lg shadow-[#ff3e3e]/30' 
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>

                    {selectedGenre && (
                      <span className="text-zinc-400 text-[10px] font-mono shrink-0">
                        Filtering active: <strong className="text-[#ff3e3e]">{selectedGenre}</strong>
                      </span>
                    )}
                  </div>

                  {/* Dynamic Catalog Heading */}
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                    <h2 className="text-lg font-display font-black text-white flex items-center gap-2">
                      <Clapperboard className="w-5 h-5 text-[#ff3e3e]" />
                      <span>{selectedGenre ? `${selectedGenre} Series Deck` : searchTerm ? `Found Matches for "${searchTerm}"` : 'All Streaming Series'}</span>
                    </h2>
                    <span className="font-mono text-[10.5px] text-zinc-400 uppercase">
                      {filteredAnimeList.length} LISTED TITLES
                    </span>
                  </div>

                  {/* Empty Results state */}
                  {filteredAnimeList.length === 0 ? (
                    <div className="text-center py-16 bg-[#121216]/40 border border-dashed border-white/10 rounded-2xl max-w-lg mx-auto p-8">
                      <Search className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                      <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">No anime matched your active filters</p>
                      <button
                        onClick={() => { setSearchTerm(''); setSelectedGenre(null); }}
                        className="text-xs text-[#ff3e3e] font-bold hover:underline mt-3 inline-block cursor-pointer"
                      >
                        Reset search queries
                      </button>
                    </div>
                  ) : (
                    /* The Anime Catalog Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="anime-cards-grid">
                      {filteredAnimeList.map(anime => (
                        <AnimeCard
                          key={anime.id}
                          anime={anime}
                          onSelect={(id) => {
                            setSelectedAnimeId(id);
                            // Auto trigger episode 1 play if desired, or let them pick
                          }}
                          watchHistoryProgress={getOverallAnimeProgress(anime)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER COOPERATIVE BRANDINGS */}
      <footer className="border-t border-white/5 bg-[#030305]/80 backdrop-blur-md py-8 text-center text-xs text-zinc-450 font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
              <img 
                src={logoImage} 
                alt="Scarlet Sigma Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-display font-black text-white tracking-widest text-sm">SCARLET SIGMA</span>
            <span className="text-[10px] font-mono bg-[#ff3e3e]/15 border border-[#ff3e3e]/25 rounded px-1.5 py-0.5 font-bold text-[#ff3e3e]">2026 EDITION</span>
          </div>
          <p className="leading-relaxed text-zinc-350">
            Stream Youur Anime Movies with Scarlet Sigma's Premium Catalog. All rights reserved. &copy; 2026 Scarlet Sigma Inc.
          </p>
          <div className="flex gap-4 font-mono text-[10px] text-[#ff3e3e]/80">
            <span>SHADOW SECURE PROTOCOLS</span>
          </div>
        </div>
      </footer>

      {/* FLOATING SIGN-IN AUTH MODAL OVERLAY */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          registeredUsers={userAccounts}
          onAddNewUser={(newUser) => {
            setUserAccounts(prev => [newUser, ...prev]);
          }}
        />
      )}
    </div>
  );
}
