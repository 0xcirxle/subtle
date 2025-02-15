import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileVideo, 
  Upload,
  Check,
  Loader
} from 'lucide-react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';

// Types
interface TranslationResponse {
  process_id: string;
  original_srt: string;
  translations: {
    [key: string]: string;
  };
}

const VideoUploader = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<{ language: string; url: string }[]>([]);
  const [showToast, setShowToast] = useState<{show: boolean; message: string; type: 'success' | 'error'} | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setShowPlayer(false);
    }
  };

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleUpload = async () => {
    if (!selectedFile || selectedLanguages.length === 0) {
      showNotification('Please select a video file and at least one language', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('target_languages', selectedLanguages.join(','));

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post('http://localhost:5001/api/process-video', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      const newSubtitles = [
        {
          language: 'Original',
          url: `http://localhost:5001/api/download/${response.data.process_id}/${response.data.original_srt}`,
        },
        ...Object.entries(response.data.translations)
          .filter(([_, filename]) => typeof filename === 'string' && !filename.startsWith('Translation failed'))
          .map(([lang, filename]) => ({
            language: lang.charAt(0).toUpperCase() + lang.slice(1),
            url: `http://localhost:5001/api/download/${response.data.process_id}/${filename}`,
          })),
      ];
      setSubtitles(newSubtitles);
      setShowPlayer(true);
      showNotification('Video processed successfully!', 'success');
    } catch (error) {
      showNotification('Failed to process video. Please try again.', 'error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (showPlayer && videoUrl) {
    return <VideoPlayer videoUrl={videoUrl} subtitles={subtitles} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0F0821] text-white overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0F0821] via-[#1A0B2E] to-[#0F0821]" />
      
      {/* Subtle animated gradient orbs */}
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
              background: `radial-gradient(circle at center, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mx-auto text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-transparent bg-clip-text">
            Upload Your Video
          </h1>
          <p className="text-lg text-amber-400/60 mb-12">
            Generate AI-powered subtitles in multiple languages
          </p>

          {/* Upload Box */}
          <motion.div
            className="bg-[#160C2C]/50 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* File Upload Area */}
            <div className="relative group cursor-pointer mb-12">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-amber-500/30 rounded-2xl p-12 transition-all duration-300 group-hover:border-amber-400/50">
                <FileVideo className="w-16 h-16 mx-auto mb-4 text-amber-400/60 group-hover:text-amber-400" />
                <p className="text-lg text-amber-200/80 mb-2">
                  {selectedFile ? selectedFile.name : 'Drag & drop your video here'}
                </p>
                <p className="text-sm text-amber-300/50">
                  {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'or click to browse'}
                </p>
              </div>
            </div>

            {/* Language Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-6 text-amber-200">Select Languages</h3>
              <div className="grid grid-cols-3 gap-4">
                {['French', 'Spanish', 'German'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      const langLower = lang.toLowerCase();
                      setSelectedLanguages(
                        selectedLanguages.includes(langLower)
                          ? selectedLanguages.filter(l => l !== langLower)
                          : [...selectedLanguages, langLower]
                      );
                    }}
                    disabled={isUploading}
                    className={`relative px-6 py-4 rounded-xl transition-all duration-300
                      ${selectedLanguages.includes(lang.toLowerCase())
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : 'bg-[#1A0B2E]/50 border-amber-500/20'}
                      border hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-amber-200">{lang}</span>
                      {selectedLanguages.includes(lang.toLowerCase()) && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-8">
                <div className="h-2 bg-amber-500/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center mt-2 text-amber-300/60">Processing: {uploadProgress}%</p>
              </div>
            )}

            {/* Process Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || selectedLanguages.length === 0}
              className={`w-full py-4 px-8 rounded-xl font-medium text-lg
                relative overflow-hidden group transition-all duration-300
                ${isUploading || !selectedFile || selectedLanguages.length === 0
                  ? 'bg-amber-500/20 text-amber-300/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:opacity-90'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {isUploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process Video
                  </>
                )}
              </span>
            </button>
          </motion.div>

          {/* Toast Notification */}
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg backdrop-blur-md ${
                showToast.type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'
              }`}
            >
              <p className="text-white">{showToast.message}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VideoUploader;