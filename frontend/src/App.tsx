import { Container } from '@chakra-ui/react'
import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoPlayer from './components/VideoPlayer'
import LandingPage from './components/LandingPage'

interface VideoData {
  videoUrl: string;
  subtitles: {
    language: string;
    url: string;
  }[];
}

function App() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [showApp, setShowApp] = useState(false);

  const handleVideoProcessed = (data: VideoData) => {
    setVideoData(data);
  };

  const handleLaunchApp = () => {
    setShowApp(true);
  };

  if (!showApp) {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  return (
    <Container minW="screen">
      {videoData ? (
        <VideoPlayer 
          videoUrl={videoData.videoUrl} 
          subtitles={videoData.subtitles} 
        />
      ) : (
        <VideoUploader onVideoProcessed={handleVideoProcessed} />
      )}
    </Container>
  );
}

export default App
