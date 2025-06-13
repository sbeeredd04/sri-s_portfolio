import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import DecryptedText from './DecryptedText';

const Beams = dynamic(() => import('../background/Beams'), { ssr: false });

const loadingStates = [
  { text: 'Booting up portfolio...', checkpoint: 10 },
  { text: 'Loading experience...', checkpoint: 30 },
  { text: 'Decrypting projects...', checkpoint: 50 },
  { text: 'Fetching skills...', checkpoint: 75 },
  { text: 'Finalizing interface...', checkpoint: 95 },
];

const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}> <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" /> </svg>
);
const CheckFilled = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${className}`}> <circle cx="12" cy="12" r="9" fill="currentColor" /> </svg>
);

function LoaderCore({ loadingStates, progress, currentText }) {
  const currentIdx = loadingStates.findIndex((s, i) => progress < s.checkpoint && (i === 0 || progress >= loadingStates[i - 1].checkpoint));
  const scrollIdx = currentIdx === -1 ? loadingStates.length - 1 : currentIdx;
  const offset = Math.max(0, scrollIdx - 2);
  
  // If we have external text, create a dynamic loading state
  const displayStates = currentText ? [
    ...loadingStates.slice(0, -1),
    { text: currentText, checkpoint: 100 }
  ] : loadingStates;
  
  return (
    <div className="overflow-hidden h-[200px] w-full flex flex-col items-end pr-6 select-none">
      <motion.div
        animate={{ y: -offset * 40 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        className="flex flex-col gap-4 pb-8">
        {displayStates.map((loadingState, index) => {
          const isComplete = progress >= loadingState.checkpoint;
          const isCurrent =
            progress < loadingState.checkpoint &&
            (index === 0 || progress >= displayStates[index - 1].checkpoint);
          return (
            <motion.div
              key={index}
              className="flex items-center gap-3 min-h-[40px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}>
              <span>
                {isComplete ? (
                  <CheckFilled className="text-white" />
                ) : (
                  <CheckIcon className="text-white opacity-40" />
                )}
              </span>
              <DecryptedText
                text={loadingState.text}
                speed={60}
                maxIterations={16}
                sequential={true}
                revealDirection="start"
                className={`major-mono-display-regular text-sm md:text-base tracking-widest ${isComplete ? 'text-white' : isCurrent ? 'text-white/80' : 'text-white/50'}`}
                encryptedClassName="text-white/30"
                animateOn="view"
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function Loader({ onFinish, externalProgress, externalLoadingText }) {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(true);
  const [cameraPhase, setCameraPhase] = useState('initial');
  const [showButton, setShowButton] = useState(false);
  const [currentLoadingText, setCurrentLoadingText] = useState('Booting up portfolio...');
  const containerRef = useRef(null);

  useEffect(() => {
    setShowContent(true);
  }, []);

  // Handle external progress updates
  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      if (externalProgress >= 100) {
        setTimeout(() => {
          setCameraPhase('moveToButton');
        }, 500);
      }
    }
  }, [externalProgress]);

  // Handle external loading text updates
  useEffect(() => {
    if (externalLoadingText) {
      setCurrentLoadingText(externalLoadingText);
    }
  }, [externalLoadingText]);

  // Fallback auto-progress if no external progress is provided
  useEffect(() => {
    if (!loading || externalProgress !== undefined) return;
    
    let progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setCameraPhase('moveToButton');
          }, 500);
          return 100;
        }
        return Math.min(prev + 1, 100);
      });
    }, 45);
    
    return () => clearInterval(progressInterval);
  }, [loading, externalProgress]);

  useEffect(() => {
    if (cameraPhase === 'moveToButton') {
      setTimeout(() => {
        setShowButton(true);
      }, 1500);
    }
  }, [cameraPhase]);

  const handleLetSGoClick = () => {
    setShowButton(false);
    setCameraPhase('fadeToBlack');
    
    setTimeout(() => {
      setCameraPhase('complete');
      setLoading(false);
      if (onFinish) onFinish();
    }, 2000);
  };

  if (cameraPhase === 'complete') return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col min-h-screen min-w-full bg-black major-mono-display-regular overflow-hidden"
    >
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <Beams beamWidth={0.8} beamHeight={14} beamNumber={4} lightColor="#fff" speed={2} noiseIntensity={1.75} scale={0.18} rotation={200} />
      </div>

      <motion.div
        className="relative w-full h-full z-10"
        animate={{
          y: cameraPhase === 'initial' ? 0 : 
             cameraPhase === 'moveToButton' ? '-100vh' :
             cameraPhase === 'fadeToBlack' ? '-200vh' : '-200vh'
        }}
        transition={{
          duration: cameraPhase === 'moveToButton' ? 2 : 
                   cameraPhase === 'fadeToBlack' ? 1.5 : 0,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <div className="relative w-full h-screen flex flex-col">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-6 left-8 text-xs md:text-sm opacity-80 tracking-widest flex flex-col gap-1"
          >
            <DecryptedText
              text={`Local time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs md:text-sm text-white/70"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute bottom-8 left-8 text-lg md:text-2xl font-bold tracking-widest flex flex-col gap-1"
          >
            <DecryptedText
              text={"sriujjwalreddy.com"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-lg md:text-2xl text-white"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <DecryptedText
              text={"since 2022"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs mt-2 text-white/70"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-xs md:text-sm text-right opacity-80 tracking-widest flex flex-col gap-1"
          >
            <DecryptedText
              text={"Welcome"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs md:text-sm text-white"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <DecryptedText
              text={"To My Portfolio"}
              speed={40}
              maxIterations={10}
              sequential={true}
              revealDirection="start"
              className="major-mono-display-regular text-xs md:text-sm text-white"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
          </motion.div>

          <div className="flex flex-1 max-w-8xl mx-auto items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-row items-center justify-center w-full max-w-4xl mx-auto gap-16 md:gap-32"
            >
              <div className="hidden md:flex flex-col items-end mb-10 justify-center min-w-[260px]">
                <LoaderCore loadingStates={loadingStates} progress={progress} currentText={currentLoadingText} />
              </div>
              
              <div className="flex flex-col items-center justify-center w-[260px]">
                <span className="text-5xl md:text-6xl font-bold text-white select-none tracking-widest mb-4" style={{ letterSpacing: '0.15em' }}>
                  {Math.floor(progress)}
                </span>
                <div className="w-44 h-[2px] bg-white/20 mb-6 relative overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-white"
                    style={{ width: `${progress}%` }}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative w-full h-screen flex items-center justify-center">
          {showButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
                boxShadow: [
                  "0 0 20px rgba(255, 255, 255, 0.3)",
                  "0 0 40px rgba(255, 255, 255, 0.5)",
                  "0 0 20px rgba(255, 255, 255, 0.3)"
                ]
              }}
              transition={{ 
                duration: 0.8,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              onClick={handleLetSGoClick}
              className="major-mono-display-regular px-12 py-6 bg-white text-black rounded-lg text-2xl font-bold tracking-widest hover:bg-white/90 transition-all active:scale-95 border-2 border-white"
              style={{ letterSpacing: '0.1em' }}
            >
              LET'S GO
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-black z-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: cameraPhase === 'fadeToBlack' ? 1 : 0 
        }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');
        .major-mono-display-regular {
          font-family: 'Major Mono Display', monospace;
          font-weight: 400;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}