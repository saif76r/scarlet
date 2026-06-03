import React, { useState, useRef } from 'react';
import { 
  Plus, Edit, Trash2, ListOrdered, Film, Users, Tag, 
  Settings2, ArrowLeft, Save, Star, Eye, Layers, UploadCloud
} from 'lucide-react';
import { Anime, Episode, UserAccount, SubtitleTrack, SubtitleCue } from '../types';
import { parseSRT, cuesToSRT } from '../utils/subtitleParser';
// Cloudinary is used instead of Firebase storage for binary media assets

interface AdminDashboardProps {
  animeList: Anime[];
  userAccounts: UserAccount[];
  onUpdateAnimeList: (updatedList: Anime[]) => void;
  onUpdateUserAccounts: (updatedAccounts: UserAccount[]) => void;
}

export default function AdminDashboard({
  animeList,
  userAccounts,
  onUpdateAnimeList,
  onUpdateUserAccounts,
}: AdminDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'titles' | 'episodes' | 'users'>('titles');
  
  // Title Editor State
  const [isEditingAnime, setIsEditingAnime] = useState<boolean>(false);
  const [editingAnimeId, setEditingAnimeId] = useState<string | null>(null); // null means creating
  const [animeForm, setAnimeForm] = useState({
    title: '',
    description: '',
    coverUrl: '',
    bannerUrl: '',
    logoUrl: '',
    genres: '',
    rating: 'PG-13',
    releaseYear: 2026,
    studio: '',
    featured: false
  });

  // Episode Editor State
  const [selectedAnimeForEpisodes, setSelectedAnimeForEpisodes] = useState<string>(animeList[0]?.id || '');
  const [isEditingEpisode, setIsEditingEpisode] = useState<boolean>(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null); // null means creating
  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: 1,
    title: '',
    description: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '24:00',
    thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    srtSubtitles: ''
  });

  const [videoSourceMode, setVideoSourceMode] = useState<'upload' | 'url'>('upload');
  const [showArchiveGuide, setShowArchiveGuide] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [thumbnailSourceMode, setThumbnailSourceMode] = useState<'upload' | 'url'>('upload');
  const [uploadedThumbnailName, setUploadedThumbnailName] = useState<string>('');
  const [thumbnailDragActive, setThumbnailDragActive] = useState<boolean>(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Real-Time Permanent Cloud upload states
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState<boolean>(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');

  const videoUploadTaskRef = useRef<any>(null);
  const thumbnailUploadTaskRef = useRef<any>(null);
  const localVideoUrlRef = useRef<string>('');
  const localThumbnailUrlRef = useRef<string>('');

  const handleCancelVideoUpload = () => {
    if (videoUploadTaskRef.current) {
      try {
        videoUploadTaskRef.current.abort();
      } catch (err) {
        console.warn("Failed to cancel upload task:", err);
      }
      videoUploadTaskRef.current = null;
    }
    setIsUploadingVideo(false);
    setVideoUploadProgress(0);
    setUploadedFileName('');
  };

  const handleBypassVideoUpload = () => {
    if (videoUploadTaskRef.current) {
      try {
        videoUploadTaskRef.current.abort();
      } catch (err) {
        console.warn("Failed to cancel upload task:", err);
      }
      videoUploadTaskRef.current = null;
    }
    setIsUploadingVideo(false);
    if (localVideoUrlRef.current) {
      setEpisodeForm(prev => ({
        ...prev,
        videoUrl: localVideoUrlRef.current
      }));
    }
  };

  const handleCancelThumbnailUpload = () => {
    if (thumbnailUploadTaskRef.current) {
      try {
        thumbnailUploadTaskRef.current.abort();
      } catch (err) {
        console.warn("Failed to cancel upload task:", err);
      }
      thumbnailUploadTaskRef.current = null;
    }
    setIsUploadingThumbnail(false);
    setThumbnailUploadProgress(0);
    setUploadedThumbnailName('');
  };

  const handleBypassThumbnailUpload = () => {
    if (thumbnailUploadTaskRef.current) {
      try {
        thumbnailUploadTaskRef.current.abort();
      } catch (err) {
        console.warn("Failed to cancel upload task:", err);
      }
      thumbnailUploadTaskRef.current = null;
    }
    setIsUploadingThumbnail(false);
    if (localThumbnailUrlRef.current) {
      setEpisodeForm(prev => ({
        ...prev,
        thumbnail: localThumbnailUrlRef.current
      }));
    }
  };

  const uploadThumbnailToStorage = (file: File) => {
    setIsUploadingThumbnail(true);
    setThumbnailUploadProgress(0);
    setUploadedThumbnailName(file.name);
    setUploadError('');

    const objectUrl = URL.createObjectURL(file);
    localThumbnailUrlRef.current = objectUrl;

    const url = 'https://api.cloudinary.com/v1_1/dn9mliqg1/upload';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'anime_upload');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    thumbnailUploadTaskRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setThumbnailUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          const downloadUrl = response.secure_url;
          console.log("Cloudinary Thumbnail Upload Success:", downloadUrl);
          setEpisodeForm(prev => ({
            ...prev,
            thumbnail: downloadUrl
          }));
          setIsUploadingThumbnail(false);
          setThumbnailSourceMode('upload');
        } catch (err: any) {
          console.error("Failed to parse Cloudinary response:", err);
          setIsUploadingThumbnail(false);
          setUploadError(`Failed to parse Cloudinary response: ${err.message}`);
        }
      } else {
        console.error("Cloudinary Upload thumbnail failed:", xhr.responseText);
        setUploadError(`Failed to upload thumbnail to Cloudinary: ${xhr.statusText}`);
        setIsUploadingThumbnail(false);
        // Bypassed fallback
        setEpisodeForm(prev => ({
          ...prev,
          thumbnail: objectUrl
        }));
      }
    };

    xhr.onerror = () => {
      console.error("Cloudinary Upload thumbnail network error");
      setUploadError("Failed to upload thumbnail to Cloudinary due to user network issue.");
      setIsUploadingThumbnail(false);
      // Bypassed fallback
      setEpisodeForm(prev => ({
        ...prev,
        thumbnail: objectUrl
      }));
    };

    xhr.send(formData);
  };

  const handleVideoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Invalid File Format: Please upload a standard video file (MP4, MKV, WebM, etc.)');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    setUploadError('');
    
    // Process local copy for instant client metadata/thumbnail-frame extraction
    const objectUrl = URL.createObjectURL(file);
    localVideoUrlRef.current = objectUrl;

    // Immediately set local video url as a fallback so testing doesn't stall
    setEpisodeForm(prev => ({
      ...prev,
      videoUrl: objectUrl
    }));
    
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'auto';
    tempVideo.src = objectUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    
    tempVideo.onloadedmetadata = () => {
      const durationSeconds = tempVideo.duration;
      if (!isNaN(durationSeconds)) {
        const mins = Math.floor(durationSeconds / 60);
        const secs = Math.floor(durationSeconds % 60);
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        setEpisodeForm(prev => ({
          ...prev,
          duration: formatted
        }));
      }

      // Automatically seek to 1.5 seconds, or mid-point if video is shorter
      const seekTime = Math.min(1.5, durationSeconds > 0 ? durationSeconds / 2 : 1.5);
      tempVideo.currentTime = seekTime;
    };

    tempVideo.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 640;
        canvas.height = tempVideo.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              // Automatically upload this auto-extracted canvas frame to cloud storage
              const filenamePrefix = file.name.split('.')[0] || 'video';
              const cleanPrefix = filenamePrefix.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
              const extFile = new File([blob], `auto_frame_${cleanPrefix}.jpg`, { type: 'image/jpeg' });
              uploadThumbnailToStorage(extFile);
            }
          }, 'image/jpeg', 0.85);
        }
      } catch (err) {
        console.error('Failed to extract video frame for thumbnail', err);
      }
    };

    tempVideo.onerror = () => {
      console.warn('Video element load failed for duration metadata extraction');
    };

    // Upload ACTUAL raw file to Cloudinary in robust automated chunks
    const chunkSize = 6 * 1024 * 1024; // 6MB chunks (Cloudinary requires >= 5MB for non-final chunks)
    const totalSize = file.size;
    const uniqueUploadId = `cloudinary_chunked_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const url = 'https://api.cloudinary.com/v1_1/dn9mliqg1/video/upload';

    let start = 0;

    const uploadNextChunk = () => {
      if (start >= totalSize) return;

      const end = Math.min(start + chunkSize, totalSize) - 1;
      const chunk = file.slice(start, end + 1);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('upload_preset', 'anime_upload');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      videoUploadTaskRef.current = xhr;

      // Cloudinary headers for chunked upload
      xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
      xhr.setRequestHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const bytesUploadedSoFar = start + event.loaded;
          const progress = Math.min(Math.round((bytesUploadedSoFar / totalSize) * 100), 99); // Max 99% until last chunk completes
          setVideoUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (end + 1 >= totalSize) {
              // Last chunk finished, upload is fully complete!
              const downloadUrl = response.secure_url;
              console.log("Cloudinary Video Upload Success:", downloadUrl);
              setEpisodeForm(prev => ({
                ...prev,
                videoUrl: downloadUrl
              }));
              setVideoUploadProgress(100);
              setIsUploadingVideo(false);
              videoUploadTaskRef.current = null;
            } else {
              // Proceed next chunk
              start = end + 1;
              uploadNextChunk();
            }
          } catch (err: any) {
            console.error("Failed to parse Cloudinary response:", err);
            setUploadError(`Failed to parse Cloudinary response: ${err.message}`);
            setIsUploadingVideo(false);
            videoUploadTaskRef.current = null;
          }
        } else {
          console.error("Cloudinary video chunk upload failed:", xhr.responseText);
          let detailedError = xhr.statusText || 'Bad Request';
          try {
            const errObj = JSON.parse(xhr.responseText);
            if (errObj.error && errObj.error.message) {
              detailedError = errObj.error.message;
            }
          } catch (e) {
            // Ignore parse error
          }
          setUploadError(`Failed to save video to Cloudinary: ${detailedError}`);
          setIsUploadingVideo(false);
          videoUploadTaskRef.current = null;
          // Fallback to local URL in severe cases so page does not lock
          setEpisodeForm(prev => ({
            ...prev,
            videoUrl: objectUrl
          }));
        }
      };

      xhr.onerror = () => {
        console.error("Cloudinary video upload network error");
        setUploadError("Failed to save video to Cloudinary due to network issue.");
        setIsUploadingVideo(false);
        videoUploadTaskRef.current = null;
        // Fallback to local URL in severe cases so page does not lock
        setEpisodeForm(prev => ({
          ...prev,
          videoUrl: objectUrl
        }));
      };

      xhr.onabort = () => {
        console.log("Cloudinary chunked upload aborted by user");
        setIsUploadingVideo(false);
        videoUploadTaskRef.current = null;
      };

      xhr.send(formData);
    };

    uploadNextChunk();
  };

  const handleThumbnailImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Invalid Image Format: Please select an image (JPG, PNG, WebP) for the thumbnail cover.');
      return;
    }
    uploadThumbnailToStorage(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setThumbnailDragActive(true);
    } else if (e.type === "dragleave") {
      setThumbnailDragActive(false);
    }
  };

  const handleThumbnailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbnailDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleThumbnailImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleThumbnailImageFile(e.target.files[0]);
    }
  };

  // Target anime selected for episode edits
  const currentSelectedAnime = animeList.find(a => a.id === selectedAnimeForEpisodes);

  // Genre string array helper
  const handleAnimeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genreArray = animeForm.genres
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);

    if (editingAnimeId) {
      // Edit existing Anime
      const updated = animeList.map(item => {
        if (item.id === editingAnimeId) {
          return {
            ...item,
            title: animeForm.title,
            description: animeForm.description,
            coverUrl: animeForm.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
            bannerUrl: animeForm.bannerUrl || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=1200&auto=format&fit=crop',
            logoUrl: animeForm.logoUrl || undefined,
            genres: genreArray.length > 0 ? genreArray : ['Anime', 'Action'],
            rating: animeForm.rating,
            releaseYear: animeForm.releaseYear,
            studio: animeForm.studio || 'Scarlet Studio',
            featured: animeForm.featured
          };
        }
        return item;
      });
      onUpdateAnimeList(updated);
    } else {
      // Create new anime title
      const newId = animeForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `id-${Date.now()}`;
      const newAnime: Anime = {
        id: newId,
        title: animeForm.title,
        description: animeForm.description,
        coverUrl: animeForm.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
        bannerUrl: animeForm.bannerUrl || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=1200&auto=format&fit=crop',
        logoUrl: animeForm.logoUrl || undefined,
        genres: genreArray.length > 0 ? genreArray : ['Anime', 'Action'],
        rating: animeForm.rating,
        totalEpisodes: 0,
        releaseYear: animeForm.releaseYear,
        studio: animeForm.studio || 'Scarlet Studio',
        featured: animeForm.featured,
        episodes: []
      };
      onUpdateAnimeList([newAnime, ...animeList]);
      if (!selectedAnimeForEpisodes) {
        setSelectedAnimeForEpisodes(newId);
      }
    }
    setIsEditingAnime(false);
    setEditingAnimeId(null);
  };

  const startEditAnime = (anime: Anime) => {
    setEditingAnimeId(anime.id);
    setAnimeForm({
      title: anime.title,
      description: anime.description,
      coverUrl: anime.coverUrl,
      bannerUrl: anime.bannerUrl,
      logoUrl: anime.logoUrl || '',
      genres: anime.genres.join(', '),
      rating: anime.rating,
      releaseYear: anime.releaseYear,
      studio: anime.studio,
      featured: !!anime.featured
    });
    setIsEditingAnime(true);
  };

  const startCreateAnime = () => {
    setEditingAnimeId(null);
    setAnimeForm({
      title: '',
      description: '',
      coverUrl: '',
      bannerUrl: '',
      logoUrl: '',
      genres: 'Action, Shounen, Adventure',
      rating: 'PG-13',
      releaseYear: 2026,
      studio: 'Scarlet Studio',
      featured: false
    });
    setIsEditingAnime(true);
  };

  const handleDeleteAnime = (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this Anime title? All attached episodes and visual links will be permanently deleted.')) {
      const filtered = animeList.filter(a => a.id !== id);
      onUpdateAnimeList(filtered);
      if (selectedAnimeForEpisodes === id && filtered.length > 0) {
        setSelectedAnimeForEpisodes(filtered[0].id);
      }
    }
  };

  // Episode Form Submission
  const handleEpisodeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeForEpisodes) return;

    // Parse custom pasted SRT if provided, else fall back to the preloaded template
    let englishTrackCues: SubtitleCue[] = [];
    if (episodeForm.srtSubtitles && episodeForm.srtSubtitles.trim()) {
      englishTrackCues = parseSRT(episodeForm.srtSubtitles);
    } else {
      englishTrackCues = [
        { id: 'c1', startTime: 1, endTime: 6, text: `[Subtitle Test] Watching ${episodeForm.title} ep. ${episodeForm.episodeNumber}!` },
        { id: 'c2', startTime: 8, endTime: 15, text: "Excellent quality. Powered by Scarlet Bingo player custom configurations." },
        { id: 'c3', startTime: 17, endTime: 24, text: "You can customize subtitle text size, positions, and color overlays on the settings cog!" }
      ];
    }

    const englishSubTrack: SubtitleTrack = {
      id: `sub-en-${Date.now()}`,
      label: 'English translation',
      srclang: 'en',
      cues: englishTrackCues
    };

    const japaneseSubTrack: SubtitleTrack = {
      id: `sub-ja-${Date.now()}`,
      label: '日本語字幕',
      srclang: 'ja',
      cues: [
        { id: 'c1', startTime: 1, endTime: 6, text: `【字幕テスト】これが「${episodeForm.title}」の第${episodeForm.episodeNumber}話です！` },
        { id: 'c2', startTime: 8, endTime: 15, text: "最高画質をお楽しみください。スカーレットビンゴ！" }
      ]
    };

    const updatedAnimeList = animeList.map(anime => {
      if (anime.id === selectedAnimeForEpisodes) {
        let updatedEpisodes = [...anime.episodes];
        
        if (editingEpisodeId) {
          // Edit existing episode info
          updatedEpisodes = updatedEpisodes.map(ep => {
            if (ep.id === editingEpisodeId) {
              return {
                ...ep,
                episodeNumber: Number(episodeForm.episodeNumber),
                title: episodeForm.title,
                description: episodeForm.description,
                videoUrl: episodeForm.videoUrl,
                duration: episodeForm.duration,
                thumbnail: episodeForm.thumbnail || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
                subtitles: [englishSubTrack, japaneseSubTrack],
                srtSubtitles: episodeForm.srtSubtitles
              };
            }
            return ep;
          });
        } else {
          // Add newly created episode
          const newEp: Episode = {
            id: `ep-id-${Date.now()}`,
            episodeNumber: Number(episodeForm.episodeNumber),
            title: episodeForm.title,
            description: episodeForm.description,
            videoUrl: episodeForm.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: episodeForm.duration || '24:00',
            thumbnail: episodeForm.thumbnail || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
            subtitles: [englishSubTrack, japaneseSubTrack],
            srtSubtitles: episodeForm.srtSubtitles
          };
          updatedEpisodes.push(newEp);
        }

        // Sort episodes chronologically by episodeNumber
        updatedEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

        return {
          ...anime,
          episodes: updatedEpisodes,
          totalEpisodes: updatedEpisodes.length
        };
      }
      return anime;
    });

    onUpdateAnimeList(updatedAnimeList);
    setIsEditingEpisode(false);
    setEditingEpisodeId(null);
  };

  const startEditEpisode = (episode: Episode) => {
    setEditingEpisodeId(episode.id);
    
    // Find if English track exists and convert its cues back to SRT string
    const englishTrack = episode.subtitles?.find(t => t.srclang === 'en');
    const reconstructedSRT = englishTrack ? cuesToSRT(englishTrack.cues) : (episode.srtSubtitles || '');

    setEpisodeForm({
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description,
      videoUrl: episode.videoUrl,
      duration: episode.duration,
      thumbnail: episode.thumbnail,
      srtSubtitles: reconstructedSRT
    });
    if (episode.videoUrl.startsWith('blob:')) {
      setVideoSourceMode('upload');
      setUploadedFileName('Local Video File (Cached in Session)');
    } else {
      setVideoSourceMode('url');
      setUploadedFileName('');
    }
    if (episode.thumbnail && episode.thumbnail.startsWith('blob:')) {
      setThumbnailSourceMode('upload');
      setUploadedThumbnailName('Local Thumbnail / Extracted Frame');
    } else {
      setThumbnailSourceMode('url');
      setUploadedThumbnailName('');
    }
    setIsEditingEpisode(true);
  };

  const startCreateEpisode = () => {
    const nextNum = currentSelectedAnime ? currentSelectedAnime.episodes.length + 1 : 1;
    setEditingEpisodeId(null);
    setEpisodeForm({
      episodeNumber: nextNum,
      title: `Episode ${nextNum}`,
      description: `A breathtaking continuation of the series. Enter newly uncovered rivalries and breathtaking ninja combats.`,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '24:00',
      thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
      srtSubtitles: ''
    });
    setVideoSourceMode('upload');
    setUploadedFileName('');
    setThumbnailSourceMode('upload');
    setUploadedThumbnailName('');
    setIsEditingEpisode(true);
  };

  const handleDeleteEpisode = (episodeId: string) => {
    if (confirm('Delete this episode track from the index? This cannot be undone.')) {
      const updated = animeList.map(anime => {
        if (anime.id === selectedAnimeForEpisodes) {
          const filtered = anime.episodes.filter(ep => ep.id !== episodeId);
          return {
            ...anime,
            episodes: filtered,
            totalEpisodes: filtered.length
          };
        }
        return anime;
      });
      onUpdateAnimeList(updated);
    }
  };

  // Users Privilege Modifiers
  const toggleUserRole = (userId: string) => {
    const upgraded = userAccounts.map(u => {
      if (u.id === userId) {
        const nextRole: 'admin' | 'user' = u.role === 'admin' ? 'user' : 'admin';
        return {
          ...u,
          role: nextRole
        };
      }
      return u;
    });
    onUpdateUserAccounts(upgraded);
  };

  const handleDeleteUser = (userId: string) => {
    const user = userAccounts.find(u => u.id === userId);
    if (user?.email === 'scarlet@gmail.com' || user?.email === 'scarletshadow84@gmail.com') {
      alert('Security Protection: Main admin accounts cannot be self-deleted.');
      return;
    }
    if (confirm(`Remove account ${user?.username} (${user?.email}) permanently?`)) {
      onUpdateUserAccounts(userAccounts.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-dashboard-root">
      
      {/* Header and status flags */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <Settings2 className="w-8 h-8 text-[#ff3e3e] animate-pulse" />
            <span>Scarlet Bingo <span className="text-[#ff3e3e] font-light">Command Center</span></span>
          </h1>
          <p className="text-sm text-zinc-350 mt-1">
            Superuser platform to manage metadata files, upload video episodes, and audit active customer registrations.
          </p>
        </div>

        {/* Dashboard inner controls tabs selector */}
        <div className="flex rounded-full bg-white/5 border border-white/10 p-1 self-start backdrop-blur-md">
          <button
            onClick={() => { setActiveTab('titles'); setIsEditingAnime(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'titles' 
                ? 'bg-[#ff3e3e] text-white shadow-lg shadow-[#ff3e3e]/30 font-bold' 
                : 'text-zinc-350 hover:text-white hover:bg-white/5'
            }`}
            id="admin-tab-titles"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Anime</span>
          </button>
          <button
            onClick={() => { setActiveTab('episodes'); setIsEditingEpisode(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'episodes' 
                ? 'bg-[#ff3e3e] text-white shadow-lg shadow-[#ff3e3e]/30 font-bold' 
                : 'text-zinc-350 hover:text-white hover:bg-white/5'
            }`}
            id="admin-tab-episodes"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos & Subs</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'users' 
                ? 'bg-[#ff3e3e] text-white shadow-lg shadow-[#ff3e3e]/30 font-bold' 
                : 'text-zinc-350 hover:text-white hover:bg-white/5'
            }`}
            id="admin-tab-users"
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts</span>
          </button>
        </div>
      </div>

      {/* MANAGING ANIME TITLES TAB */}
      {activeTab === 'titles' && (
        <div>
          {!isEditingAnime ? (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center glass border border-white/10 p-5 rounded-2xl">
                <span className="text-sm text-zinc-350 font-medium">
                  Currently indexing <strong className="text-white underline">{animeList.length}</strong> main titles
                </span>
                <button
                  onClick={startCreateAnime}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ff3e3e] hover:bg-[#ff5555] text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  id="admin-add-anime-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Series</span>
                </button>
              </div>

              {/* Grid lists with metadata detail edits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {animeList.map(anime => (
                  <div 
                    key={anime.id} 
                    className="flex glass card-hover border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-white/20 transition-all duration-300"
                  >
                    <img 
                      src={anime.coverUrl} 
                      alt={anime.title} 
                      className="w-24 object-cover"
                    />
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display font-bold text-white leading-tight">
                            {anime.title}
                          </h3>
                          {anime.featured && (
                            <span className="px-1.5 py-0.5 bg-[#ff3e3e]/25 text-[#ff3e3e] border border-[#ff3e3e]/30 rounded text-[9px] font-mono flex items-center gap-0.5 font-bold uppercase">
                              <Star className="w-2 h-2 fill-[#ff3e3e]" /> Feature
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                          Studio: {anime.studio} ({anime.releaseYear}) • {anime.rating}
                        </p>
                        <div className="flex gap-1 flex-wrap mt-2">
                          {anime.genres.slice(0, 3).map(g => (
                            <span key={g} className="text-[9px] bg-white/5 text-zinc-300 border border-white/10 rounded-full px-2.5 py-0.5">
                              {g}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
                          {anime.description}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => startEditAnime(anime)}
                          className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAnime(anime.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-350 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Anime Form Editing Overlay card */
            <form onSubmit={handleAnimeFormSubmit} className="bg-[#111115] border border-[#27272a] rounded-xl p-6" id="anime-edit-form">
              <div className="flex items-center gap-2 mb-6 text-zinc-400">
                <button 
                  type="button" 
                  onClick={() => setIsEditingAnime(false)} 
                  className="hover:text-white flex items-center gap-1.5 text-xs font-mono font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <span className="text-zinc-600">/</span>
                <span className="text-xs font-semibold text-rose-400">
                  {editingAnimeId ? `Modify ${animeForm.title}` : 'Build New Show Index'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Series Title (*):</label>
                  <input
                    type="text"
                    required
                    value={animeForm.title}
                    onChange={e => setAnimeForm({...animeForm, title: e.target.value})}
                    placeholder="e.g. Jujutsu Kaisen"
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Studio */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Production Studio:</label>
                  <input
                    type="text"
                    value={animeForm.studio}
                    onChange={e => setAnimeForm({...animeForm, studio: e.target.value})}
                    placeholder="e.g. MAPPA or ufotable"
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Synopsis */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Description Synopsis:</label>
                  <textarea
                    rows={3}
                    value={animeForm.description}
                    onChange={e => setAnimeForm({...animeForm, description: e.target.value})}
                    placeholder="What is this anime about?"
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Genre keys */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Genres (Comma separated):</label>
                  <input
                    type="text"
                    value={animeForm.genres}
                    onChange={e => setAnimeForm({...animeForm, genres: e.target.value})}
                    placeholder="Action, Shounen, Fantasy, Suspense"
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Cover poster URL */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Poster Image Cover URL:</label>
                  <input
                    type="url"
                    value={animeForm.coverUrl}
                    onChange={e => setAnimeForm({...animeForm, coverUrl: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Cover backdrop URL */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Landscape Banner Backing URL:</label>
                  <input
                    type="url"
                    value={animeForm.bannerUrl}
                    onChange={e => setAnimeForm({...animeForm, bannerUrl: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Title Logo transparent image URL */}
                <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                  <label className="text-xs text-zinc-400 font-semibold">Title Logo transparent URL (SVG or PNG recommended):</label>
                  <input
                    type="url"
                    value={animeForm.logoUrl}
                    onChange={e => setAnimeForm({...animeForm, logoUrl: e.target.value})}
                    placeholder="e.g. https://upload.wikimedia.org/wikipedia/commons/c/c9/Naruto_logo.svg (Transparent brand logo)"
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full font-mono text-[10px]"
                  />
                </div>

                {/* Rating age restrict */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Age Guidelines Rating:</label>
                  <select
                    value={animeForm.rating}
                    onChange={e => setAnimeForm({...animeForm, rating: e.target.value})}
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="G">G - General Audiences</option>
                    <option value="PG-13">PG-13 - Teens 13 or older</option>
                    <option value="R-17">R-17 - Restricted (Violence, Gore)</option>
                  </select>
                </div>

                {/* Launch Year */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-semibold">Release Year:</label>
                  <input
                    type="number"
                    value={animeForm.releaseYear}
                    onChange={e => setAnimeForm({...animeForm, releaseYear: Number(e.target.value)})}
                    className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Toggle Featured */}
                <div className="flex items-center gap-2 mt-4 ml-1">
                  <input
                    type="checkbox"
                    checked={animeForm.featured}
                    onChange={e => setAnimeForm({...animeForm, featured: e.target.checked})}
                    className="w-4 h-4 rounded border-[#27272a] bg-[#18181b] text-rose-600 focus:ring-rose-500"
                    id="checkbox-featured"
                  />
                  <label htmlFor="checkbox-featured" className="text-xs text-zinc-300 font-semibold select-none cursor-pointer">
                    Promote to home screen banner (Featured Carousel)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-zinc-900 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingAnime(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg flex items-center gap-1.5"
                  id="anime-save-btn"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Anime Title</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* EPISODES & HIGH QUALITY VIDEO URL MANAGE TAB */}
      {activeTab === 'episodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List selection of Anime on the left */}
          <div className="col-span-1 flex flex-col gap-3">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block pl-1">
              SELECT RIVALRY TITLE
            </span>
            <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-2">
              {animeList.map(anime => (
                <button
                  key={anime.id}
                  onClick={() => {
                    setSelectedAnimeForEpisodes(anime.id);
                    setIsEditingEpisode(false);
                  }}
                  className={`flex items-center justify-between text-left p-3 rounded-lg border transition-all ${
                    selectedAnimeForEpisodes === anime.id 
                      ? 'bg-rose-950/45 border-rose-600/60 text-white' 
                      : 'bg-[#111115] border-[#27272a] text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span className="text-xs font-bold truncate max-w-[170px]">{anime.title}</span>
                  <span className="px-1.5 py-0.5 font-mono text-[9px] bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
                    {anime.episodes.length} Episodes
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            {!isEditingEpisode ? (
              <div className="flex flex-col gap-5 bg-[#111115] border border-[#27272a] p-6 rounded-xl">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div>
                    <h3 className="font-display font-extrabold text-white text-lg">
                      {currentSelectedAnime?.title} Episode Grid
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Upload MP4 streaming URLs, edit sequence numbers, or customize subtitle tracks.
                    </p>
                  </div>
                  <button
                    onClick={startCreateEpisode}
                    disabled={!currentSelectedAnime}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/90 disabled:opacity-20 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                    id="admin-add-episode-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Ep</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {!currentSelectedAnime?.episodes || currentSelectedAnime.episodes.length === 0 ? (
                    <div className="text-center py-10">
                      <Film className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs font-mono text-zinc-450 uppercase">NO EPISODES REGISTERED</p>
                      <button 
                        onClick={startCreateEpisode}
                        className="text-xs text-rose-500 hover:underline mt-1 font-bold"
                      >
                        Click here to create Episode 1
                      </button>
                    </div>
                  ) : (
                    currentSelectedAnime.episodes.map(ep => (
                      <div 
                        key={ep.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-850 rounded-lg transition-colors"
                      >
                        <div className="flex gap-3">
                          <img 
                            src={ep.thumbnail} 
                            alt={ep.title} 
                            className="w-20 aspect-video object-cover rounded"
                          />
                          <div>
                            <span className="font-mono text-[9px] bg-rose-950 text-rose-500 px-1 py-0.5 rounded font-extrabold mr-1.5">
                              EPISODE {ep.episodeNumber}
                            </span>
                            <span className="text-xs text-zinc-450 font-mono">({ep.duration})</span>
                            <h4 className="text-xs font-bold text-white mt-1 leading-snug">{ep.title}</h4>
                            <p className="text-[11px] font-mono text-zinc-500 truncate max-w-[280px] mt-0.5" title={ep.videoUrl}>
                              Source: {ep.videoUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex self-end sm:self-center gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditEpisode(ep)}
                            className="p-1 px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3 text-rose-500" />
                            <span>Modify</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEpisode(ep.id)}
                            className="p-1 px-2.5 bg-rose-955 hover:bg-rose-900 text-rose-300 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3 text-rose-450" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Episode editor card */
              <form onSubmit={handleEpisodeFormSubmit} className="bg-[#111115] border border-[#27272a] rounded-xl p-6" id="episodes-edit-form">
                <div className="flex items-center gap-2 mb-6 text-zinc-400">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingEpisode(false)} 
                    className="hover:text-white flex items-center gap-1.5 text-xs font-mono font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" /> BACK
                  </button>
                  <span className="text-zinc-600">/</span>
                  <span className="text-xs font-semibold text-rose-400">
                    {editingEpisodeId ? `Modify ${episodeForm.title}` : `Create Episode in ${currentSelectedAnime?.title}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Sequence Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400 font-semibold">Episode Order Number (*):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={episodeForm.episodeNumber}
                      onChange={e => setEpisodeForm({...episodeForm, episodeNumber: Number(e.target.value)})}
                      className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400 font-semibold">Episode Name (*):</label>
                    <input
                      type="text"
                      required
                      value={episodeForm.title}
                      onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})}
                      placeholder="e.g. Unleashed Wrath"
                      className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Length */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400 font-semibold">Video Duration (Format MM:SS):</label>
                    <input
                      type="text"
                      value={episodeForm.duration}
                      onChange={e => setEpisodeForm({...episodeForm, duration: e.target.value})}
                      placeholder="e.g. 24:00"
                      className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600"
                    />
                  </div>

                  {/* Thumbnail Cover */}
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex flex-col">
                        <label className="text-xs text-white font-extrabold tracking-wide uppercase">Episode Cover Thumbnail</label>
                        <p className="text-[10px] text-zinc-400">Specify an image or get auto-extracted video frame previews</p>
                      </div>
                      <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-full text-[11px] self-start">
                        <button
                          type="button"
                          onClick={() => setThumbnailSourceMode('upload')}
                          className={`px-3 py-1 rounded-full transition-all font-semibold cursor-pointer ${
                            thumbnailSourceMode === 'upload'
                              ? 'bg-[#ff3e3e] text-white shadow-md font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Manual Image / Video Snapshot
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnailSourceMode('url')}
                          className={`px-3 py-1 rounded-full transition-all font-semibold cursor-pointer ${
                            thumbnailSourceMode === 'url'
                              ? 'bg-[#ff3e3e] text-white shadow-md font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Pasted Image Link
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2">
                        {thumbnailSourceMode === 'upload' ? (
                          <div className="flex flex-col gap-2">
                            {isUploadingThumbnail ? (
                              <div className="border border-dashed border-[#ff3e3e]/30 bg-[#ff3e3e]/5 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-center items-center gap-2">
                                <span className="w-5 h-5 border-2 border-[#ff3e3e] border-t-transparent rounded-full animate-spin"></span>
                                <p className="text-xs text-zinc-300 font-bold">Uploading cover image... {thumbnailUploadProgress}%</p>
                                <div className="w-full max-w-[150px] bg-zinc-950 rounded-full h-1 overflow-hidden mt-0.5 border border-white/5">
                                  <div className="bg-[#ff3e3e] h-full transition-all duration-300" style={{ width: `${thumbnailUploadProgress}%` }}></div>
                                </div>
                                <div className="flex gap-2 justify-center mt-1.5">
                                  <button
                                    type="button"
                                    onClick={handleCancelThumbnailUpload}
                                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-md text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleBypassThumbnailUpload}
                                    className="px-2.5 py-1 bg-[#ff3e3e]/20 hover:bg-[#ff3e3e]/30 text-white border border-[#ff3e3e]/20 rounded-md text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer"
                                  >
                                    Skip
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onDragEnter={handleThumbnailDrag}
                                onDragOver={handleThumbnailDrag}
                                onDragLeave={handleThumbnailDrag}
                                onDrop={handleThumbnailDrop}
                                onClick={() => thumbnailInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 min-h-[110px] flex flex-col justify-center items-center gap-1.5 ${
                                  thumbnailDragActive
                                    ? 'border-[#ff3e3e] bg-[#ff3e3e]/10 scale-[0.99]'
                                    : 'border-white/10 hover:border-[#ff3e3e]/40 hover:bg-[#ff3e3e]/5 bg-zinc-950/40'
                                }`}
                                id="thumbnail-upload-dragzone"
                              >
                                <input
                                  type="file"
                                  ref={thumbnailInputRef}
                                  onChange={handleThumbnailFileChange}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <UploadCloud className="w-8 h-8 text-zinc-400 animate-pulse" />
                                <p className="text-xs text-zinc-200 font-bold">
                                  {uploadedThumbnailName ? 'Replace cover image' : 'Drag cover image file here'}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  or <span className="text-[#ff3e3e] underline font-medium">browse images</span> (JPG, PNG, WebP)
                                </p>
                              </div>
                            )}

                            {uploadedThumbnailName && !isUploadingThumbnail && (
                              <div className="flex items-center justify-between p-2 bg-[#ff3e3e]/10 border border-[#ff3e3e]/20 rounded-xl mt-0.5">
                                <span className="text-[11px] font-bold text-white truncate max-w-[240px] pl-1">
                                  {uploadedThumbnailName}
                                </span>
                                <span className="font-mono text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                                  Uploaded
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-zinc-350 font-semibold">Image Poster URL Link (*):</label>
                            <input
                              type="url"
                              value={episodeForm.thumbnail}
                              onChange={e => {
                                setEpisodeForm({...episodeForm, thumbnail: e.target.value});
                                if (uploadedThumbnailName) setUploadedThumbnailName('');
                              }}
                              placeholder="e.g. https://images.unsplash.com/..."
                              className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]"
                            />
                            <p className="text-[10px] text-zinc-500 font-mono">
                              Provide a direct web link for this landscape scene poster.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Poster Live Preview */}
                      <div className="flex flex-col items-center justify-center p-2 bg-zinc-950/60 border border-white/5 rounded-xl aspect-video relative overflow-hidden">
                        {episodeForm.thumbnail ? (
                          <>
                            <img
                              src={episodeForm.thumbnail}
                              alt="Live Preview cover"
                              className="w-full h-full object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop';
                              }}
                            />
                            <div className="absolute bottom-1 right-1 font-mono text-[8px] bg-black/60 text-[#ff3e3e] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                              Real-Time Preview
                            </div>
                          </>
                        ) : (
                          <div className="text-zinc-600 text-[10px] font-mono text-center">
                            No image selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Stream MP4 Source Selector & Upload */}
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <label className="text-xs text-white font-extrabold tracking-wide uppercase">Episode Video Source Mode</label>
                      <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-full text-[11px] self-start">
                        <button
                          type="button"
                          onClick={() => setVideoSourceMode('upload')}
                          className={`px-3 py-1 rounded-full transition-all font-semibold cursor-pointer ${
                            videoSourceMode === 'upload'
                              ? 'bg-[#ff3e3e] text-white shadow-md font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Local File Upload (Drag & Drop)
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoSourceMode('url')}
                          className={`px-3 py-1 rounded-full transition-all font-semibold cursor-pointer ${
                            videoSourceMode === 'url'
                              ? 'bg-[#ff3e3e] text-white shadow-md font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Pasted Video Link
                        </button>
                      </div>
                    </div>

                    {videoSourceMode === 'upload' ? (
                      <div className="flex flex-col gap-2">
                        {isUploadingVideo ? (
                          <div className="border border-dashed border-[#ff3e3e]/30 bg-[#ff3e3e]/5 rounded-xl p-6 text-center min-h-[140px] flex flex-col justify-center items-center gap-3">
                            <Film className="w-8 h-8 text-[#ff3e3e] animate-bounce" />
                            <div className="flex flex-col items-center">
                              <p className="text-xs text-white font-bold">Uploading raw video bytes... {videoUploadProgress}%</p>
                              {videoUploadProgress === 0 && (
                                <p className="text-[10px] text-amber-400 font-semibold mt-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md max-w-sm">
                                  ⚠️ Stuck at 0%? Ensure that unsigned uploads are enabled for the 'anime_upload' preset on Cloudinary.
                                </p>
                              )}
                              <p className="text-[10px] text-zinc-400 mt-1">Directly saving securely inside your Cloudinary Media CDN.</p>
                            </div>
                            <div className="w-full max-w-[320px] bg-zinc-900 rounded-full h-1.5 overflow-hidden mt-1 border border-white/5">
                              <div className="bg-[#ff3e3e] h-full transition-all duration-300" style={{ width: `${videoUploadProgress}%` }}></div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 justify-center mt-2.5">
                              <button
                                type="button"
                                onClick={handleCancelVideoUpload}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer"
                              >
                                Cancel Upload
                              </button>
                              <button
                                type="button"
                                onClick={handleBypassVideoUpload}
                                className="px-3 py-1.5 bg-[#ff3e3e]/20 hover:bg-[#ff3e3e]/35 text-white border border-[#ff3e3e]/30 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                              >
                                Skip & Stream Locally
                              </button>
                              <a
                                href="https://console.cloudinary.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/35 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1"
                              >
                                Cloudinary Console ↗
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 min-h-[140px] flex flex-col justify-center items-center gap-2 ${
                              dragActive
                                ? 'border-[#ff3e3e] bg-[#ff3e3e]/10 scale-[0.99]'
                                : 'border-white/10 hover:border-[#ff3e3e]/40 hover:bg-[#ff3e3e]/5 bg-zinc-950/40'
                            }`}
                            id="file-upload-dragzone"
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="video/*"
                              className="hidden"
                            />
                            <UploadCloud className="w-10 h-10 text-zinc-400 animate-pulse mb-1" />
                            <p className="text-xs text-zinc-200 font-bold">
                              {uploadedFileName ? 'Change selected video file' : 'Drag and Drop Video File'}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              or <span className="text-[#ff3e3e] underline font-medium">browse local files</span> from your computer
                            </p>
                          </div>
                        )}

                        {uploadedFileName && !isUploadingVideo && (
                          <div className="flex items-center justify-between p-2.5 bg-[#ff3e3e]/10 border border-[#ff3e3e]/20 rounded-xl mt-1">
                            <div className="flex items-center gap-2 truncate">
                              <Film className="w-4 h-4 text-[#ff3e3e] shrink-0 font-bold" />
                              <div className="truncate text-left">
                                <p className="text-xs font-bold text-white truncate max-w-[280px]">
                                  {uploadedFileName}
                                </p>
                                <p className="text-[10px] text-[#ff3e3e] font-mono font-semibold">
                                  Permanent Cloud URL configured successfully!
                                </p>
                              </div>
                            </div>
                            <span className="font-mono text-[9px] bg-emerald-955 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                              Uploaded
                            </span>
                          </div>
                        )}

                        {uploadError && (
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono leading-snug">
                              <span className="font-bold text-red-500 block mb-1">⚠️ Upload Error:</span>
                              {uploadError}
                            </div>

                            {uploadedFileSize > 100 * 1024 * 1024 && (
                              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3 text-[11px] leading-relaxed text-zinc-350">
                                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                  Cloudinary Unsigned Upload Size Guideline (300 MB Uploads)
                                </div>
                                <div className="space-y-2 text-left">
                                  <p className="font-sans font-medium text-zinc-200">
                                    আমরা দেখতে পাচ্ছি আপনার ভিডিওর সাইজ <strong className="text-white">{(uploadedFileSize / (1024 * 1024)).toFixed(1)} MB</strong>, যা ১০০ MB এর চেয়ে বড়। Cloudinary-র ফ্রী অ্যাকাউন্টে ডিফল্টভাবে Unsigned Upload (পাসওয়ার্ড ছাড়া সরাসরি ব্রাউজার থেকে আপলোড) এর সর্বোচ্চ লিমিট <strong className="text-white">100 MB</strong> হয়ে থাকে।
                                  </p>
                                  <p className="font-sans text-zinc-400">
                                    Cloudinary has a default maximum limit of <strong className="text-zinc-200">100 MB</strong> for unauthenticated browser-to-cloud uploads. Fortunately, you have three quick ways to resolve or bypass this:
                                  </p>
                                  
                                  <div className="bg-zinc-950/50 p-3 rounded-lg border border-white/5 space-y-2.5">
                                    <div>
                                      <p className="font-bold text-zinc-200">💡 Option A: Increase Unsigned Upload Limit in Cloudinary (Recommended & Free)</p>
                                      <p className="text-zinc-400 font-sans mt-0.5 ml-4">
                                        ১. আপনার <a href="https://console.cloudinary.com/" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-semibold inline-flex items-center gap-0.5 hover:text-sky-300">Cloudinary Console ↗</a> এ লগইন করুন। (এটি সম্পূর্ণ ফ্রী)<br />
                                        ২. বাম পাশের নিচে <strong className="text-zinc-300">Settings</strong> (গিয়ার আইকন) এ ক্লিক করুন।<br />
                                        ৩. এরপর <strong className="text-zinc-300">Security</strong> ট্যাবে যান এবং নিচে স্ক্রল করে <strong className="text-zinc-300">Restricted Media Types (or Unsigned upload limits)</strong> খুজে বের করুন বা লিমিটটি <strong className="text-emerald-400 font-semibold">300 MB / 500 MB</strong> বা তার বেশি সেট করে সংরক্ষণ করুন।
                                      </p>
                                    </div>

                                    <div>
                                      <p className="font-bold text-emerald-400">💡 Option B: Paste 100% FREE Stream Links (Instant & Unlimited)</p>
                                      <p className="text-zinc-400 font-sans mt-0.5 ml-4">
                                        উপরে ডানদিকের <strong className="text-zinc-300">"Pasted Video Link"</strong> ট্যাবে ক্লিক করে যেকোনো ফ্রী ভিডিও প্ল্যাটফর্ম থেকে লিংক পেস্ট করুন। কোনো প্রকার টাকা লাগবে না: <br />
                                        • <strong className="text-white">Dropbox Free Account:</strong> ড্রপবক্স সম্পূর্ণ ফ্রীতে <strong className="text-emerald-400">2 GB</strong> স্পেস দেয়! সেটির Share Link কপি করে পেস্ট করলেই চলবে।<br />
                                        • <strong className="text-white">GitHub Releases:</strong> গিটহাব একদম অফুরন্ত ফ্রী স্পেস দেয় (প্রতি ফাইলে <strong className="text-white">2 GB</strong> পর্যন্ত সম্পূর্ণ ফ্রী)।<br />
                                        • <strong className="text-white">Archive.org:</strong> ইন্টারনেট আর্কাইভ আনলিমিটেড ফ্রী স্টোরেজ ও ডাইরেক্ট MP4 স্ট্রিমিং লিংক দেয়।<br />
                                        • <strong className="text-white">Microsoft OneDrive Free:</strong> ওয়ানড্রাইভ ফ্রীতে <strong className="text-white">5 GB</strong> স্পেস দেয়।
                                      </p>
                                    </div>

                                    <div>
                                      <p className="font-bold text-emerald-400">💡 Option C: Play Locally Instantly</p>
                                      <p className="text-zinc-400 font-sans mt-0.5 ml-4">
                                        আমরা ইতিমধ্যে আপনার সিস্টেমে লোকাল ফাইলটি সরাসরি ইন্টিগ্রেট করে দিয়েছি। <strong className="text-zinc-300">"Skip & Stream Locally"</strong> বাটন ক্লিক করার কারণে ভিডিওটি আপনার এই ব্রাউজার সেশনে ১০০% স্মুথলি স্ট্রীম হবে এবং ভিডিও প্লেয়ারে চলবে!
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-350 font-semibold">Streaming High Quality MP4 Source Link (*):</label>
                        <input
                          type="url"
                          required
                          value={episodeForm.videoUrl || ''}
                          onChange={e => {
                            let val = e.target.value.trim();
                            
                            // Extract actual URL if the user copy-pasted extra text beside it (e.g. "https://...mp4 w=eta")
                            const urlRegex = /(https?:\/\/[^\s]+)/i;
                            const urlMatch = val.match(urlRegex);
                            if (urlMatch) {
                              val = urlMatch[1];
                            }
                            
                            // Auto-convert Google Drive sharing links to direct stream links
                            const driveRegExp = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
                            const driveMatch = val.match(driveRegExp);
                            if (driveMatch && driveMatch[1]) {
                              val = `https://docs.google.com/uc?export=download&id=${driveMatch[1]}`;
                            }

                            // Auto-convert Dropbox sharing links to direct stream format on dl.dropboxusercontent.com
                            if (val.includes('dropbox.com') || val.includes('dropboxusercontent.com')) {
                              try {
                                const urlObj = new URL(val);
                                // Set host to highly compatible dl.dropboxusercontent.com direct stream domain (bypasses CORS restrictions)
                                urlObj.hostname = 'dl.dropboxusercontent.com';
                                const params = new URLSearchParams(urlObj.search);
                                
                                // Clean up transient/session-based parameters which cause expiration or restriction errors
                                const newParams = new URLSearchParams();
                                for (const [key, value] of Array.from(params.entries())) {
                                  if (key.toLowerCase() === 'rlkey') {
                                    newParams.set(key, value);
                                  }
                                }
                                // Set raw parameter for direct rendering stream
                                newParams.set('raw', '1');
                                urlObj.search = newParams.toString();
                                val = urlObj.toString();
                              } catch (err) {
                                // Fallback regex-based correction if URL parsing fails
                                const rlkeyMatch = val.match(/[?&]rlkey=([^&]+)/i);
                                const rlkeyPart = rlkeyMatch ? `?rlkey=${rlkeyMatch[1]}&raw=1` : '?raw=1';
                                
                                const cleanUrl = val.split('?')[0];
                                const hostReplaced = cleanUrl.replace(/(www\.)?dropboxusercontent\.com/i, 'dl.dropboxusercontent.com')
                                                           .replace(/(www\.)?dropbox\.com/i, 'dl.dropboxusercontent.com');
                                val = `${hostReplaced}${rlkeyPart}`;
                              }
                            }

                            // Auto-convert Archive.org landing or embed links to download directory/media formats
                            if (val.includes('archive.org/details/') || val.includes('archive.org/embed/')) {
                              const archiveRegExp = /archive\.org\/(details|embed)\/([a-zA-Z0-9_-]+)/;
                              const archiveMatch = val.match(archiveRegExp);
                              if (archiveMatch && archiveMatch[2]) {
                                const id = archiveMatch[2];
                                val = `https://archive.org/download/${id}/${id}.mp4`;
                              }
                            }
                            
                            setEpisodeForm({...episodeForm, videoUrl: val});
                            if (uploadedFileName) setUploadedFileName('');
                          }}
                          placeholder="e.g. https://commondatastorage.googleapis.com/...mp4"
                          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-zinc-500 font-mono">
                            Supports direct MP4, Dropbox, Archive.org, or custom buckets. Ensure CORS is enabled.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowArchiveGuide(!showArchiveGuide)}
                            className="text-[10px] bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-400 font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {showArchiveGuide ? '⬇️ Hide Archive.org Guide' : '📖 Archive.org Upload & Link Guide'}
                          </button>
                        </div>

                        {/* Interactive Archive.org Guide Panel */}
                        {(showArchiveGuide || (episodeForm.videoUrl && episodeForm.videoUrl.includes('archive.org'))) && (
                          <div className="mt-2.5 p-4 bg-sky-950/20 border border-sky-500/25 rounded-xl text-[11px] leading-relaxed animate-fadeIn">
                            <span className="font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                              🎬 Archive.org Streaming Assistant (১০০% ফ্রী ও আনলিমিটেড)
                            </span>
                            
                            <div className="space-y-2.5 font-sans">
                              {episodeForm.videoUrl && episodeForm.videoUrl.includes('archive.org/details/') ? (
                                <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-lg text-red-300 mb-2">
                                  <p className="font-bold text-red-400 text-xs flex items-center gap-1">
                                    ⚠️ Details লিংক সনাক্ত করা হয়েছে!
                                  </p>
                                  <p className="mt-1">
                                    আপনি পেস্ট করেছেন: <code className="bg-black/40 px-1 py-0.5 rounded text-red-400 text-[10px] break-all">{episodeForm.videoUrl}</code>
                                  </p>
                                  <p className="mt-1 text-zinc-300">
                                    এটি Archive.org এর <strong>details/ল্যান্ডিং পেইজ লিংক</strong>, যা কোনো ব্রাউজার বা ভিডিও প্লেয়ারে সরাসরি প্লে করা সম্ভব নয়। প্লেয়ারে চালানোর জন্য অবশ্যই সরাসরি <strong>.mp4</strong> এক্সটেনশন যুক্ত লিংক পেস্ট করতে হবে।
                                  </p>
                                </div>
                              ) : episodeForm.videoUrl && episodeForm.videoUrl.includes('archive.org') && episodeForm.videoUrl.match(/\.(mp4|mkv|webm)/i) ? (
                                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg text-emerald-300 mb-2">
                                  <p className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                                    ✅ লিংকটি পারফেক্ট!
                                  </p>
                                  <p className="mt-0.5 text-zinc-300">
                                    আপনি সরাসরি <strong>.mp4/মিডিয়া</strong> স্ট্রিমিং লিঙ্ক ব্যবহার করেছেন; এটি বাফারিং ছাড়া চমৎকার স্পীডে সরাসরি প্লে হবে।
                                  </p>
                                </div>
                              ) : null}

                              <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-white/5 space-y-2 text-zinc-300">
                                <p className="font-bold text-emerald-400 text-[12px]">💡 Archive.org-এ আপলোড এবং সরাসরি লিংকের সঠিক নিয়ম:</p>
                                <ol className="list-decimal list-inside space-y-2 text-zinc-350 ml-1">
                                  <li>
                                    প্রথমে <a href="https://archive.org" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-semibold hover:text-sky-300">Archive.org ↗</a> এ একটি সম্পূর্ণ ফ্রী অ্যাকাউন্ট খুলুন।
                                  </li>
                                  <li>
                                    উপরে ডানদিকের <strong className="text-white">Upload</strong> বাটনে ক্লিক করে আপনার ভিডিও ফাইলটি (যেকোনো সাইজের বড় ভিডিও যেমন ২৮৪ MB বা তার বেশি) কোনো লিমিট ছাড়াই ফ্রি আপলোড করুন।
                                  </li>
                                  <li>
                                    আপলোড সফল হওয়ার পর যে পেইজটি আসবে, সেটির লিংক (ল্যান্ডিং পেইজ লিংক) কপি করবেন না।
                                  </li>
                                  <li>
                                    পেইজের ডান পাশে <strong className="text-[#38bdf8]">Download Options</strong> সেকশন দেখতে পাবেন। সেখানে <strong className="text-white">MPEG4 (অথবা H.264/MP4)</strong> ফাইলের উপর মাউস রেখে <strong>Right-Click (ডান ক্লিক)</strong> করুন।
                                  </li>
                                  <li>
                                    মেনু থেকে <strong className="text-emerald-400">"Copy link address"</strong> অপশনটি ক্লিক করুন।
                                  </li>
                                  <li>
                                    কপি করা লিংকটি দেখতে ঠিক এইরকম ফরম্যাটের হবে: <br />
                                    <code className="block bg-black/60 p-2 rounded text-sky-300 border border-white/5 mt-1 text-[9.5px] font-mono break-all line-clamp-1">
                                      https://archive.org/download/IDENTIFIER/your_video_file.mp4
                                    </code>
                                  </li>
                                </ol>
                                <p className="text-[10px] text-amber-400/80 font-mono mt-1">
                                  * ডাইরেক্ট লিংকের শেষে .mp4 এক্সটেনশন থাকা বাধ্যতামূলক। details/ বা /index.html যুক্ত লিংক প্লেয়ারে কাজ করবে না।
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {episodeForm.videoUrl && (episodeForm.videoUrl.includes('google.com') || episodeForm.videoUrl.includes('docs.google.com')) && (
                          <div className="mt-2.5 p-3.5 bg-amber-950/20 border border-amber-500/25 text-amber-300 rounded-xl text-[11px] leading-relaxed">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                              ⚠️ Google Drive Video Limit Exception
                            </span>
                            <div className="space-y-1.5 font-sans">
                              <p>
                                আপনার ভিডিও ফাইলটি যদি <strong className="text-white">১০০ MB এর চেয়ে বড়</strong> (যেমন: ২৮৪ MB) হয়ে থাকে, তবে Google Drive এর ভাইরাস স্ক্যানিং পেইজের কারণে ভিডিও প্লেয়ারে সরাসরি চলবে না (Playback Error দেখাবে)। গুগল মূলত ভিডিওটি সরাসরি দেখার অনুমতি দেয় না যদি সেটি সাধারণ লিমিটের চেয়ে বড় হয়। 
                              </p>
                              
                              <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 space-y-2 text-zinc-350">
                                <p className="font-bold text-emerald-400">💡 সমাধান ১: Dropbox (সম্পূর্ণ ১০০% ফ্রী - 2 GB সীমা)</p>
                                <p className="ml-3 text-zinc-400">
                                  Dropbox-এ একাউন্ট তৈরি করা এবং <strong className="text-white">2 GB পর্যন্ত ভিডিও আপলোড করা সম্পূর্ণ ফ্রী!</strong> আপনার ২৮৪ MB ভিডিওটি কোনো টাকা ছাড়াই আপলোড করতে পারবেন। আপলোড করে শেয়ার লিংকটি নিয়ে এখানে পেস্ট করে দিন, আমাদের প্লেয়ার স্বয়ংক্রিয়ভাবে ডাইরেক্ট স্ট্রীমে কনভার্ট করে নিবে।
                                </p>

                                <p className="font-bold text-[#38bdf8]">💡 সমাধান ২: GitHub Releases (সম্পূর্ণ ১০০% ফ্রী - 2 GB প্রতি ফাইল)</p>
                                <p className="ml-3 text-zinc-400">
                                  আপনি একটি ফ্রী GitHub অ্যাকাউন্ট খুলে যেকোনো Repository-এর <strong className="text-white">Releases</strong> সেকশনে ভিডিওটি আপলোড করুন। ফাইল প্রতি ২ জিবি পর্যন্ত আনলিমিটেড ফ্রী স্ট্রিমিং ও দুর্দান্ত স্পীড পাওয়া যায়।
                                </p>

                                <p className="font-bold text-amber-400">💡 সমাধান ৩: Archive.org (সম্পূর্ণ ফ্রী - আনলিমিটেড)</p>
                                <p className="ml-3 text-zinc-400">
                                  Internet Archive এ ফ্রিতে ভিডিও আপলোড করে সরাসরি মূল <strong className="text-white">.mp4</strong> ডাইরেক্ট লিঙ্কটি নিয়ে এখানে পেস্ট করে দিন।
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {episodeForm.videoUrl && (episodeForm.videoUrl.includes('terabox') || episodeForm.videoUrl.includes('nephobox') || episodeForm.videoUrl.includes('dubox') || episodeForm.videoUrl.includes('terabx')) && (
                          <div className="mt-2.5 p-3.5 bg-red-950/20 border border-red-500/25 text-red-300 rounded-xl text-[11px] leading-relaxed animate-fadeIn">
                            <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              ⚠️ TeraBox Link Unsupported for Streaming
                            </span>
                            <div className="space-y-1.5 font-sans">
                              <p className="text-zinc-300">
                                <strong className="text-white">TeraBox</strong> ফাইল শেয়ারিং সাইট মূলত ব্রাউজার বা HTML5 ভিডিও প্লেয়ারের সাথে সরাসরি ভিডিও প্লে করার (Direct Streaming/Hotlinking) সুবিধা দেয় না। ভিডিও প্লে করতে গেলে তারা একাউন্ট সাইন-ইন, ক্যাপচা ও অ্যাপ ডাউনলোড করতে ফোর্স করে, যার কারণে আমাদের ভিডিও প্লেয়ার লিঙ্কটি প্রসেস করতে পারে না।
                              </p>
                              
                              <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 space-y-2 text-zinc-350">
                                <p className="font-bold text-emerald-400">💡 সমাধান ১ (উত্তম ও ১০০% ফ্রী): Dropbox (2 GB ফ্রী)</p>
                                <p className="ml-3 text-zinc-400">
                                  Dropbox এ ফ্রিতে <strong className="text-white">2 GB</strong> স্টোরেজ পাওয়া যায় যার মাধ্যমে কোনো সাবস্ক্রিপশন ছাড়াই ২৮৪ MB ভিডিও চালানো সম্ভব। শুধু শেয়ার লিংক পেস্ট করে দিন, আমাদের সিস্টেম নিজে থেকে সেটি সেট করে দিবে।
                                </p>
                                
                                <p className="font-bold text-[#38bdf8]">💡 সমাধান ২: GitHub Releases (2 GB সম্পূর্ণ ফ্রী)</p>
                                <p className="ml-3 text-zinc-400">
                                  এখানে আপনার ভিডিও ফাইলটি গিটহাব রিলিজ ফাইল হিসেবে আপলোড করে দিতে পারেন। এটি দিয়ে কোনো লিমিট বা বাধার সম্মুখীন হতে হবে না।
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description summary */}
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                    <label className="text-xs text-zinc-400 font-semibold">Episode Brief Synopsis:</label>
                    <textarea
                      rows={3}
                      value={episodeForm.description}
                      onChange={e => setEpisodeForm({...episodeForm, description: e.target.value})}
                      placeholder="Provide a quick storyline for this episode."
                      className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* English SRT Subtitles Paste Panel */}
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#ff3e3e]" />
                        <span>English SRT Subtitles (Optional):</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">SubRip Format (.srt)</span>
                    </div>
                    <textarea
                      rows={6}
                      value={episodeForm.srtSubtitles}
                      onChange={e => setEpisodeForm({...episodeForm, srtSubtitles: e.target.value})}
                      placeholder={`1\n00:00:01,000 --> 00:00:06,500\n[Example] Welcome to Part 1 of this cinematic film!\n\n2\n00:00:08,200 --> 00:00:15,000\nKeep streaming on Scarlet Bingo with synchronized real-time controls.`}
                      className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2.5 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:border-[#ff3e3e]/40 focus:ring-1 focus:ring-[#ff3e3e]/25 outline-none transition-all resize-y"
                    />
                    <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                      Paste standard SubRip (.srt) syntax here. The system automatically structures timing cue coordinates in real-time. If empty, a beautiful default intro prompt will be synchronized automatically.
                    </p>
                  </div>
                </div>

                <div className="text-rose-500/80 bg-rose-955/20 border border-rose-900/45 text-[11px] p-2.5 rounded-lg mt-4 font-mono leading-relaxed">
                  <strong>PRO-TIP ON SUBTITLES:</strong> Upon submission, Scarlet Bingo automatically configures multi-lingual testing tracks (English and 日本語 Japanese) that synchronize subtitles during playback immediately!
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-zinc-900 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingEpisode(false)}
                    disabled={isUploadingVideo || isUploadingThumbnail}
                    className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 disabled:opacity-40 text-zinc-400 text-xs rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingVideo || isUploadingThumbnail}
                    className="px-5 py-2 bg-rose-600 disabled:opacity-45 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                    id="episode-save-btn"
                  >
                    {isUploadingVideo || isUploadingThumbnail ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving Cloud Bytes...</span>
                      </>
                    ) : (
                      <span>Save Episode Settings</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMERS & USERS REGISTRATION LISTS */}
      {activeTab === 'users' && (
        <div className="bg-[#111115] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-900">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              <span>User Accounts Directory</span>
            </h3>
            <p className="text-xs text-zinc-450 mt-1">
              Active registered users on Scarlet Bingo. You can toggle administrator role permissions or delete accounts from the storage block.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="users-table">
              <thead className="bg-[#18181b] text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-900">
                <tr>
                  <th className="p-4">Username / Handle</th>
                  <th className="p-4">Electronic Mail Address</th>
                  <th className="p-4 text-center">Current Role</th>
                  <th className="p-4">Joined At</th>
                  <th className="p-4 text-right">Actions Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {userAccounts.map(account => (
                  <tr key={account.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 text-zinc-100 font-semibold flex items-center gap-2">
                      <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px] text-zinc-300">
                        {account.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{account.username}</span>
                    </td>
                    <td className="p-4 text-zinc-350">{account.email}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${
                        account.role === 'admin' 
                          ? 'bg-rose-955 text-rose-400 border-rose-900' 
                          : 'bg-zinc-850 text-zinc-400 border-zinc-800'
                      }`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(account.createdAt).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        {account.email !== 'scarlet@gmail.com' && account.email !== 'scarletshadow84@gmail.com' ? (
                          <>
                            <button
                              onClick={() => toggleUserRole(account.id)}
                              className="px-2.5 py-1 text-zinc-300 hover:text-rose-400 font-medium bg-zinc-850 rounded hover:bg-zinc-800 border border-zinc-800"
                              title="Toggle admin / user roles"
                            >
                              Toggle Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(account.id)}
                              className="p-1 px-2.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 font-medium rounded hover:text-white"
                              title="Delete customer"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-rose-500/80 font-mono select-none px-2 py-1 bg-rose-950/20 rounded">
                            Protected Main Root
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
