import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileVideo, 
  Subtitles, 
  Globe2,
  Sparkles
} from 'lucide-react';

const GlowingButton = ({ children, className = "", onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative group ${className}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative bg-black/50 backdrop-blur-sm px-6 py-3 rounded-lg border border-amber-500/20 text-lg flex items-center gap-2">
        <span className="relative text-amber-100 flex items-center gap-2">
          {children}
        </span>
      </div>
    </motion.button>
  );
};

const LandingPage = ({ onLaunchApp }) => {
  return (
    <div className="relative min-h-screen bg-[#0a0c0f] text-amber-100">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0f] via-[#1a1500] to-[#0a0c0f]" />
      
      {/* Navbar */}
      <nav className="relative z-10 border-b border-amber-500/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-amber-400">
            SubtleAI
          </div>
          <div className="flex gap-8 items-center">
            <button className="text-amber-200/80 hover:text-amber-200">Features</button>
            <button className="text-amber-200/80 hover:text-amber-200">Pricing</button>
            <GlowingButton onClick={onLaunchApp}>
              Launch App
              <Sparkles className="w-4 h-4" />
            </GlowingButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center pt-32 pb-20">
          <h1 className="text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 text-transparent bg-clip-text">
              The World's Premier
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-100 text-transparent bg-clip-text">
              AI Subtitle Platform
            </span>
          </h1>
          <p className="text-2xl text-amber-200/80 mb-12">
            Generate multilingual subtitles instantly with blockchain-protected copyright ownership
          </p>
          <GlowingButton onClick={onLaunchApp} className="mx-auto">
            Start Creating
            <Sparkles className="w-5 h-5" />
          </GlowingButton>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-8 py-20">
          {[
            {
              icon: FileVideo,
              title: "Easy Upload",
              description: "Upload your video and let our AI handle the rest"
            },
            {
              icon: Subtitles,
              title: "Instant Subtitles",
              description: "Generate accurate subtitles in seconds"
            },
            {
              icon: Globe2,
              title: "Multiple Languages",
              description: "Translate to 50+ languages automatically"
            }
          ].map((feature, index) => (
            <div key={index} className="text-center p-8 rounded-lg border border-amber-500/10 bg-black/20 backdrop-blur-sm">
              <feature.icon className="w-12 h-12 mx-auto mb-4 text-amber-400" />
              <h3 className="text-xl font-semibold mb-2 text-amber-200">{feature.title}</h3>
              <p className="text-amber-200/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-amber-500/10">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-amber-200/60">
            © 2024 SubtleAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;