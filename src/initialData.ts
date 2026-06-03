import { Anime, UserAccount } from './types';

// Admin Account info for validation
export const ADMIN_CREDENTIALS = {
  email: 'scarlet@gmail.com',
  password: 'shadow61!'
};

export const isEmailAdmin = (email: string): boolean => {
  const e = email.trim().toLowerCase();
  return e === 'scarlet@gmail.com' || e === 'scarletshadow84@gmail.com';
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-1',
    email: 'scarlet@gmail.com',
    username: 'ScarletAdmin',
    role: 'admin',
    createdAt: '2026-05-01T12:00:00Z'
  },
  {
    id: 'user-2',
    email: 'scarletshadow84@gmail.com',
    username: 'ScarletShadow',
    role: 'admin',
    createdAt: '2026-05-15T08:30:00Z'
  },
  {
    id: 'user-3',
    email: 'otaku_core@yahoo.com',
    username: 'LeviAckerman',
    role: 'user',
    createdAt: '2026-05-20T14:45:00Z'
  }
];

export const INITIAL_ANIME_DATA: Anime[] = [
  {
    id: 'your-name',
    title: 'Your Name.',
    description: 'Two high school students, Mitsuha and Taki, who have never met, suddenly begin swapping bodies, leading to a profound connection that transcends time and space.',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Your_Name_logo.svg',
    genres: ['Drama', 'Romance', 'Fantasy', 'Award Winner'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2016,
    studio: 'CoMix Wave Films',
    featured: true,
    episodes: [
      {
        id: 'your-name-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Taki and Mitsuha navigate their spiritual body swap and face an impending cosmic event.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '1:46:00',
        thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'yn-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Taki] Once in a while when I wake up, I find myself crying..." },
              { id: '2', startTime: 6, endTime: 11, text: "[Mitsuha] The dream I must have had, I can never remember..." },
              { id: '3', startTime: 13, endTime: 18, text: "[Taki] But... the sensation that I've lost something, lingers for a long time..." },
              { id: '4', startTime: 20, endTime: 25, text: "[Mitsuha] What is your name?" }
            ]
          },
          {
            id: 'yn-sub-ja',
            label: '日本語 (Japanese)',
            srclang: 'ja',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "【瀧】朝、目が覚めると、なぜか泣いている..." },
              { id: '2', startTime: 6, endTime: 11, text: "【三葉】見ているはずの夢は、いつも思い出せない..." },
              { id: '3', startTime: 13, endTime: 18, text: "【瀧】ただ、何かが消えてしまったという感覚だけが、長く残る..." },
              { id: '4', startTime: 20, endTime: 25, text: "【三葉】君の名は？" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'suzume',
    title: 'Suzume',
    description: 'A young girl named Suzume meets a mysterious young traveler, leading her on an epic journey across Japan to lock magical doors and prevent immense natural disasters.',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    genres: ['Adventure', 'Fantasy', 'Action', 'Drama'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2022,
    studio: 'CoMix Wave Films',
    featured: true,
    episodes: [
      {
        id: 'suzume-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Suzume closes mysterious doors of ruin appearing across beautiful landscapes of rural Japan.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '2:02:00',
        thumbnail: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'sz-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Suzume] I feel like I've met you somewhere before..." },
              { id: '2', startTime: 6, endTime: 10, text: "[Souta] Do you know if there under any abandoned ruins nearby?" },
              { id: '3', startTime: 12, endTime: 17, text: "[Suzume] Wait! That door... it's standing in the middle of water!" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'weathering-with-you',
    title: 'Weathering with You',
    description: 'A high-school runaway boy meets a magical girl in Tokyo who possesses the extraordinary ability to clear the cloudy skies and manipulate the heavy rainfall at her will.',
    coverUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Fantasy'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2019,
    studio: 'CoMix Wave Films',
    featured: false,
    episodes: [
      {
        id: 'weathering-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Hodaka and Hina manipulate the rain to bring sunlight to families in Tokyo, unaware of the heavy cosmic price.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '1:52:00',
        thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'wwy-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Hina] Hey, it's about to clear up now." },
              { id: '2', startTime: 6, endTime: 10, text: "[Hodaka] Hina-san... you are actually... a weather maiden!" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'a-silent-voice',
    title: 'A Silent Voice',
    description: 'A former class bully seeks redemption by befriending the deaf girl he tormented years ago, uncovering deep paths of forgiveness, mental health struggles, and human empathy.',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'School', 'Award Winner'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2016,
    studio: 'Kyoto Animation',
    featured: true,
    episodes: [
      {
        id: 'silent-voice-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Shouya struggles to reconnect with Shouko and find a way to communicate through sign language.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '2:10:00',
        thumbnail: 'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'asv-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 2, endTime: 7, text: "[Shouya] I wanted to tell you how sorry I am... can we be friends?" },
              { id: '2', startTime: 8, endTime: 12, text: "[Shouko] (Using sign language) Thank you... I am happy." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'i-want-to-eat-your-pancreas',
    title: 'I Want to Eat Your Pancreas',
    description: 'An aloof high school student accidentally stumbles upon a secret diary belonging to his popular classmate, learning about her devastating terminal illness and spending precious days with her.',
    coverUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Slice of Life'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2018,
    studio: 'Studio VOLN',
    featured: false,
    episodes: [
      {
        id: 'pancreas-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'A touching narrative of life, friendship, and the shared bonds between two radically different personalities.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '1:48:00',
        thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'pan-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 6, text: "[Sakura] You're the only one besides my family who knows the truth about my pancreas." },
              { id: '2', startTime: 7, endTime: 11, text: "[Haruki] Why did you choose me to spend your last days with?" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'five-centimeters',
    title: '5 Centimeters per Second',
    description: 'An iconic visually striking masterpiece tracing the emotional distance and life choices separating two childhood sweethearts over three distinct chapters.',
    coverUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Slice of Life'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2007,
    studio: 'CoMix Wave Films',
    featured: false,
    episodes: [
      {
        id: 'five-cm-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Takaki and Akari navigate distance, train delays during a winter blizzard, and the path of time.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '1:03:00',
        thumbnail: 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'fcm-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 6, text: "[Akari] They say cherry blossoms fall at five centimeters per second..." },
              { id: '2', startTime: 8, endTime: 13, text: "[Takaki] I wondered if Akari was also looking at the cold snow falling somewhere." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'garden-of-words',
    title: 'The Garden of Words',
    description: 'A rainy season encounter in a tranquil Tokyo garden forms a deep and poetic connection between an aspiring young shoemaker and an older teacher carrying heavy emotional burdens.',
    coverUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Slice of Life'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2013,
    studio: 'CoMix Wave Films',
    featured: false,
    episodes: [
      {
        id: 'garden-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'An elegant poetic tribute to rain, human longing, and visual craftsmanship.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '46:00',
        thumbnail: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'gow-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Takao] When the rain starts, it feels like I escape the noise of the city..." },
              { id: '2', startTime: 6, endTime: 11, text: "[Yukino] A faint clap of thunder, clouded skies, perhaps rain will come..." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'josee',
    title: 'Josee, the Tiger and the Fish',
    description: 'An inspiring romantic drama chronicling the beautiful growth and shared values between a talented wheelchair-bound imaginative girl and a marine biology student chasing ocean researcher dreams.',
    coverUrl: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Slice of Life'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2020,
    studio: 'Bones',
    featured: false,
    episodes: [
      {
        id: 'josee-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Josee and Tsuneo break past barriers to realize their artistic and oceanic aspirations.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '1:38:00',
        thumbnail: 'https://images.unsplash.com/photo-1500051644784-06900ee802e3?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'jos-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Josee] To me, the outside world is filled with tigers..." },
              { id: '2', startTime: 6, endTime: 10, text: "[Tsuneo] Don't worry, I'll protect you and show you the sea." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'wolf-children',
    title: 'Wolf Children',
    description: 'A touching cinematic masterpiece exploring maternal love, as a strong mother raises her two half-wolf, half-human children following their father’s tragic, unexpected passing.',
    coverUrl: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Fantasy', 'Family'],
    rating: 'PG',
    totalEpisodes: 1,
    releaseYear: 2012,
    studio: 'Studio Chizu',
    featured: false,
    episodes: [
      {
        id: 'wolf-children-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Hana relocates her family to rural Japan to allow Ame and Yuki to decide theirs owns paths of life.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '1:57:00',
        thumbnail: 'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'wc-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 6, text: "[Hana] I will raise you to be whoever you choose—man or wolf." },
              { id: '2', startTime: 7, endTime: 12, text: "[Ame] Mom, the mountain is beautiful... it calls to me." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'the-girl-who-leapt-time',
    title: 'The Girl Who Leapt Through Time',
    description: 'A playful high school student accidentally acquires the power to jump through timelines, learning profound life lessons about the consequences of changing events.',
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200&auto=format&fit=crop',
    genres: ['Sci-Fi', 'Romance', 'Adventure', 'Award Winner'],
    rating: 'PG',
    totalEpisodes: 1,
    releaseYear: 2006,
    studio: 'Madhouse',
    featured: false,
    episodes: [
      {
        id: 'time-leap-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Makoto alters trivial events before discovering the fatal weight of her time-leaping limitations.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '1:38:00',
        thumbnail: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'tgwlt-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Makoto] Wait, if I jump from a high spot, I can redo things?!" },
              { id: '2', startTime: 6, endTime: 11, text: "[Chiaki] Time waits for no one, Makoto... keep running." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'spirited-away',
    title: 'Spirited Away',
    description: 'The legendary masterpiece following young Chihiro, who is trapped in an otherworldly spirit bathhouse ruled by witches after her parents are transformed into swine.',
    coverUrl: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1518172159193-8d982a6ed55a?q=80&w=1200&auto=format&fit=crop',
    genres: ['Adventure', 'Fantasy', 'Award Winner'],
    rating: 'PG',
    totalEpisodes: 1,
    releaseYear: 2001,
    studio: 'Studio Ghibli',
    featured: true,
    episodes: [
      {
        id: 'spirited-away-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Chihiro works under Yubaba to recover her true identity and save her parents.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '2:05:00',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'sa-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Haku] Don't look back... you must cross the river before they notice you!" },
              { id: '2', startTime: 6, endTime: 11, text: "[Chihiro] Yubaba took away my name... but I will always remember you, Haku." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'howls-moving-castle',
    title: "Howl's Moving Castle",
    description: 'An imaginative enchanting tale of a young millinercursed with an elderly body by a spiteful witch, who finds solace and magic within the mysterious wizard Howl’s walking mechanical home.',
    coverUrl: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    genres: ['Adventure', 'Fantasy', 'Romance'],
    rating: 'G',
    totalEpisodes: 1,
    releaseYear: 2004,
    studio: 'Studio Ghibli',
    featured: false,
    episodes: [
      {
        id: 'howl-castle-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Sophie and Howl coordinate beautiful defenses to break multiple curses and stop a devastating war.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '1:59:00',
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'hmc-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Sophie] I've had enough of running away, Howl... now I want to fight!" },
              { id: '2', startTime: 6, endTime: 10, text: "[Calcifer] If I die, Howl dies too... keep me fueled!" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'princess-mononoke',
    title: 'Princess Mononoke',
    description: 'Ashitaka seekstreatment for a fatal demonic curse and is caught in an epic environmental struggle between human industrialists and the ancient forest gods led by San, a wild human girl raised by wolves.',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
    genres: ['Action', 'Adventure', 'Fantasy'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 1997,
    studio: 'Studio Ghibli',
    featured: false,
    episodes: [
      {
        id: 'mononoke-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'An absolute masterpiece exploring environmentalism, gray morality, and beautiful fantasy themes.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '2:14:00',
        thumbnail: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'pm-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Ashitaka] To see with eyes unclouded by hate..." },
              { id: '2', startTime: 6, endTime: 10, text: "[San] Go back to your town! The forest will reclaim what is hers!" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'whisper-of-the-heart',
    title: 'Whisper of the Heart',
    description: 'A heartwarming story of a young girl seeking to fulfill her creative dreams of writing, inspired by a passionate boy dedicated to perfecting violin-making crafts.',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1496307653780-3aee7d32e60a?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Slice of Life'],
    rating: 'G',
    totalEpisodes: 1,
    releaseYear: 1995,
    studio: 'Studio Ghibli',
    featured: false,
    episodes: [
      {
        id: 'whisper-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Shizuku writes her inaugural novel featuring a unique cat statuette named the Baron.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '1:51:00',
        thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'woth-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 6, text: "[Shizuku] Every card has your name on it... Seiji Amasawa!" },
              { id: '2', startTime: 8, endTime: 13, text: "[Seiji] I want to study in Italy... to become a real master craftsman." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'when-marnie-was-there',
    title: 'When Marnie Was There',
    description: 'A deep atmospheric mystery follows Anna, who moves to rural Hokkaido for her health and forms an intimate connection with Marnie, an enigmatic blonde girl residing in a desolate forest mansion.',
    coverUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Mystery', 'Family'],
    rating: 'G',
    totalEpisodes: 1,
    releaseYear: 2014,
    studio: 'Studio Ghibli',
    featured: false,
    episodes: [
      {
        id: 'marnie-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Anna learns beautiful, heartbreaking historic secrets regarding Marnie and her family line.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '1:43:00',
        thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'wmwt-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Anna] You are my precious secret, Marnie... no one can know about us." },
              { id: '2', startTime: 6, endTime: 11, text: "[Marnie] Let's make a promise to stand beside each other forever." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'maquia',
    title: 'Maquia: When the Promised Flower Blooms',
    description: 'An immortal girl from a magical weaving clan adopts an orphaned human baby boy, leading to a profound maternal narrative of raising a mortal son who ages much faster than she does.',
    coverUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Fantasy'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2018,
    studio: 'P.A. Works',
    featured: false,
    episodes: [
      {
        id: 'maquia-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'The bittersweet chronicle of love, parental dedication, and flow of immortal lifetimes.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '1:55:00',
        thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'maq-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Maquia] Even if the time comes when we both must part, I am happy I met you." },
              { id: '2', startTime: 6, endTime: 10, text: "[Ariel] Mom... thank you for raising me and giving me a home." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'ride-your-wave',
    title: 'Ride Your Wave',
    description: 'A high-spirited surf student falls in love with a noble young firefighter who tragically passes away. She discovers she can summon him inside water bodies whenever she sings their favorite theme song.',
    coverUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Fantasy'],
    rating: 'PG-13',
    totalEpisodes: 1,
    releaseYear: 2019,
    studio: 'Science SARU',
    featured: false,
    episodes: [
      {
        id: 'ride-wave-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'An emotional romance of grief, rediscovering surf-board paths, and water magic.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '1:36:00',
        thumbnail: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'ryw-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Hinako] Minato! You're really here inside this cup of water?!" },
              { id: '2', startTime: 6, endTime: 10, text: "[Minato] As long as you keep singing our song, I'll always answer." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'children-chase-voices',
    title: 'Children Who Chase Lost Voices',
    description: 'A grand adventure follows a young schoolgirl who journeys deep into Agartha, a mystical underground world of magic and legends, to reunite with a lost friend.',
    coverUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1472214222541-d510753a4707?q=80&w=1200&auto=format&fit=crop',
    genres: ['Adventure', 'Fantasy', 'Romance'],
    rating: 'PG',
    totalEpisodes: 1,
    releaseYear: 2011,
    studio: 'CoMix Wave Films',
    featured: false,
    episodes: [
      {
        id: 'chase-voices-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'A beautiful journey across vast visual terrains and legendary ruins in deep Agartha.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '1:56:00',
        thumbnail: 'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'ccc-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Asuna] I want to see you again... even if I have to cross this underground world!" },
              { id: '2', startTime: 6, endTime: 10, text: "[Shun] Agartha is dangerous... please go back while you still can." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'into-the-forest-fireflies',
    title: "Into the Forest of Fireflies' Light",
    description: 'A sweet and bittersweet classic tracing the profound summer childhood bond between an innocent girl and a masked forest spirit carrying a tragic human curse.',
    coverUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Supernatural'],
    rating: 'G',
    totalEpisodes: 1,
    releaseYear: 2011,
    studio: "Brain's Base",
    featured: false,
    episodes: [
      {
        id: 'forest-fireflies-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'A beautiful masterpiece chronicling the gentle, poignant, and forbidden touch between two souls.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '45:00',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'iff-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Gin] I will vanish immediately if I am ever touched by a human." },
              { id: '2', startTime: 6, endTime: 10, text: "[Hotaru] Then I vow... I will never hold your hand, Gin." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'hotarubi-no-mori-e',
    title: 'Hotarubi no Mori e.',
    description: 'The celebrated legendary Japanese subtitle for Into the Forest of Fireflies’ Light, exploring the fragile yet everlasting bond between Gin and Hotaru over endless summers.',
    coverUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=1200&auto=format&fit=crop',
    genres: ['Drama', 'Romance', 'Supernatural'],
    rating: 'G',
    totalEpisodes: 1,
    releaseYear: 2011,
    studio: "Brain's Base",
    featured: false,
    episodes: [
      {
        id: 'hotarubi-movie',
        episodeNumber: 1,
        title: 'Full Movie',
        description: 'Relive the beautiful journey of summer memories and mountain spirits in high definition.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '45:00',
        thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop',
        subtitles: [
          {
            id: 'hnm-sub-en',
            label: 'English',
            srclang: 'en',
            cues: [
              { id: '1', startTime: 1, endTime: 5, text: "[Hotaru] No matter what happens, I will always find you..." },
              { id: '2', startTime: 6, endTime: 10, text: "[Gin] I think... this is my last summer with you." }
            ]
          }
        ]
      }
    ]
  }
];
