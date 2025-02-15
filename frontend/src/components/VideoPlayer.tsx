import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import { Download, Shield } from 'lucide-react';
import { ethers } from 'ethers';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: {
    language: string;
    url: string;
  }[];
}

const VIDEO_NFT_ABI = [
  "function mintNFT(string memory metadataURI) external",
  "function checkVideoExists(string memory metadataURI) external view returns (bool)"
];

const VIDEO_NFT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default localhost contract address

const VideoPlayer = ({ videoUrl, subtitles }: VideoPlayerProps) => {
  const [ready, setReady] = useState(false);
  const [subtitleContents, setSubtitleContents] = useState<{[key: string]: string}>({});
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<'none' | 'loading' | 'success' | 'error'>('none');
  const playerRef = useRef<any>(null);

  // Fetch subtitle contents when subtitles change
  useEffect(() => {
    const fetchSubtitles = async () => {
      const contents: {[key: string]: string} = {};
      for (const subtitle of subtitles) {
        try {
          const response = await fetch(`${subtitle.url}?stream=true&format=vtt`);
          const text = await response.text();
          const blob = new Blob([text], { type: 'text/vtt' });
          contents[subtitle.language] = URL.createObjectURL(blob);
        } catch (error) {
          console.error(`Error loading subtitle for ${subtitle.language}:`, error);
        }
      }
      setSubtitleContents(contents);
    };

    if (subtitles.length > 0) {
      fetchSubtitles();
    }

    return () => {
      Object.values(subtitleContents).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [subtitles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (playerRef.current?.plyr) {
        playerRef.current.plyr.destroy();
      }
    };
  }, [videoUrl]);

  const handleDownload = async (url: string, language: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `subtitles_${language.toLowerCase()}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleMintNFT = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to mint NFTs!');
      return;
    }

    try {
      setIsMinting(true);
      setMintingStatus('loading');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VIDEO_NFT_ADDRESS, VIDEO_NFT_ABI, signer);

      // Create metadata
      const metadata = {
        name: "Video NFT",
        description: "AI-Generated Subtitles Video NFT",
        video: videoUrl,
        subtitles: subtitles.map(sub => ({
          language: sub.language,
          url: sub.url
        })),
        timestamp: new Date().toISOString()
      };

      // For localhost testing, we'll use a JSON string as the metadata URI
      const metadataURI = JSON.stringify(metadata);

      // Check if video already exists
      const exists = await contract.checkVideoExists(metadataURI);
      if (exists) {
        throw new Error('NFT already exists for this video!');
      }

      // Mint NFT
      const tx = await contract.mintNFT(metadataURI);
      await tx.wait();

      setMintingStatus('success');
    } catch (error) {
      console.error('Minting error:', error);
      setMintingStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  if (!ready || Object.keys(subtitleContents).length === 0) {
    return null;
  }

  const plyrSource = {
    type: 'video' as const,
    sources: [
      {
        src: videoUrl,
        type: 'video/mp4',
      },
    ],
    tracks: subtitles.map(subtitle => ({
      kind: 'subtitles' as const,
      label: subtitle.language,
      srcLang: subtitle.language.toLowerCase(),
      src: subtitleContents[subtitle.language],
      default: subtitle.language.toLowerCase() === 'original',
    })),
  };

  const plyrOptions = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'captions',
      'settings',
      'pip',
      'fullscreen',
    ],
    i18n: {
      captions: 'Subtitles',
    },
    loadSprite: true,
    iconUrl: '/plyr.svg',
    captions: { active: true, update: true },
    icons: {
      play: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
      pause: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
      muted: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"></path></svg>`,
      volume: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
      captions: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M8 9h2v2H8zM14 9h2v2h-2zM8 13h4v2H8zM14 13h2v2h-2z"></path></svg>`,
      settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
      fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`,
      pip: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><rect x="10" y="10" width="10" height="10"></rect></svg>`,
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1003] text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-[#1a1003] via-[#2e1a0b] to-[#1a1003]" />
      
      <div className="fixed inset-0 opacity-30">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 5
            }}
            style={{
              left: `${i * 30}%`,
              top: `${i * 20}%`,
              background: `radial-gradient(circle at center, rgba(246, 173, 92, 0.15), rgba(202, 138, 56, 0.05))`
            }}
          />
        ))}
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-amber-400 to-yellow-400 text-transparent bg-clip-text">
            Video Preview
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative bg-[#2c1a03]/50 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20"
          >
            <div 
              className="video-container relative rounded-xl overflow-hidden"
              style={{
                '--plyr-color-main': '#F6AD5C',
                '--plyr-video-background': '#1a1003',
                '--plyr-menu-background': '#2e1a0b',
                '--plyr-menu-color': '#fff',
                '--plyr-tooltip-background': '#2e1a0b',
                '--plyr-tooltip-color': '#fff',
              } as React.CSSProperties}
            >
              <style>{`
                .plyr--video {
                  border-radius: 0.75rem;
                  overflow: hidden;
                }
                .plyr__control--overlaid {
                  background: rgba(246, 173, 92, 0.8);
                }
                .plyr__control--overlaid:hover {
                  background: rgba(246, 173, 92, 1);
                }
                .plyr--video .plyr__control:hover {
                  background: rgba(246, 173, 92, 0.8);
                }
                .plyr__menu__container {
                  border-radius: 0.5rem;
                  background: #2e1a0b;
                }
                .plyr__time {
                  color: rgba(255, 255, 255, 0.8);
                }
                .plyr__progress__buffer {
                  background: rgba(246, 173, 92, 0.3);
                }
                .plyr--full-ui input[type=range] {
                  color: #F6AD5C;
                }
                .plyr__control.plyr__tab-focus {
                  box-shadow: 0 0 0 2px rgba(246, 173, 92, 0.5);
                }
                .plyr__menu__container .plyr__control--back {
                  border-color: rgba(246, 173, 92, 0.2);
                }
                .plyr__menu__container .plyr__control--forward {
                  border-color: rgba(246, 173, 92, 0.2);
                }
              `}</style>
              <Plyr
                ref={playerRef}
                source={plyrSource}
                options={plyrOptions}
              />
            </div>
          </motion.div>

          {subtitles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-[#2c1a03]/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20">
              <h2 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-amber-400 to-yellow-400 text-transparent bg-clip-text">
                Download Subtitles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {subtitles.map((subtitle) => (
                  <motion.button
                    key={subtitle.language}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownload(subtitle.url, subtitle.language)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all duration-300"
                  >
                    <span className="text-amber-200">{subtitle.language}</span>
                    <Download className="w-5 h-5 text-amber-400" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* NFT Minting Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-[#2c1a03]/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20"
          >
            <h2 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-amber-400 to-yellow-400 text-transparent bg-clip-text">
              Protect Your Content
            </h2>
            <p className="text-amber-200/80 text-center mb-6">
              Mint your video as an NFT to secure your ownership on the blockchain
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMintNFT}
              disabled={isMinting || mintingStatus === 'success'}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium text-lg
                relative overflow-hidden transition-all duration-300
                ${isMinting || mintingStatus === 'success'
                  ? 'bg-amber-500/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90'
                }`}
            >
              <Shield className="w-5 h-5" />
              {mintingStatus === 'loading' && 'Minting...'}
              {mintingStatus === 'success' && 'Successfully Minted!'}
              {mintingStatus === 'error' && 'Minting Failed - Try Again'}
              {mintingStatus === 'none' && 'Mint as NFT'}
            </motion.button>
            {mintingStatus === 'success' && (
              <p className="text-green-400 text-sm text-center mt-4">
                Your video has been successfully minted as an NFT!
              </p>
            )}
            {mintingStatus === 'error' && (
              <p className="text-red-400 text-sm text-center mt-4">
                There was an error minting your NFT. Please try again.
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoPlayer;