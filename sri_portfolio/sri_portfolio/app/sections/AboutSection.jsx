"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IconDownload, IconEye, IconPlus } from "@tabler/icons-react";
import { StickyScroll } from "../components/sticky-scroll-reveal";
import aboutMeContent from "../json/aboutme.json";

/**
 * AboutSection Component
 * Displays user profile, education, hobbies, and side quests
 * 
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ("profile", "education", "hobbies", "side-quests")
 * @param {Function} props.setActiveTab - Function to set active tab
 * @returns {JSX.Element}
 */
export default function AboutSection({ activeTab, setActiveTab }) {
  const [showResumePreview, setShowResumePreview] = useState(false);

  const handleClickOutside = (e) => {
    if (e.target.id === "resume-modal-overlay") {
      setShowResumePreview(false);
    }
  };

  return (
    <section className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full relative"
          >
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <div className="w-full h-full">
                <StickyScroll content={aboutMeContent} />
              </div>
            </div>
            
            {/* Resume Buttons */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 md:gap-4 px-4 z-50 pb-2">
              <Link href="/sri_resume.pdf" download>
                <button className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black hover:from-cyan-500 hover:to-emerald-600 transition-all md:px-6 md:py-3 md:text-base shadow-lg hover:shadow-cyan-500/40 active:scale-95">
                  <IconDownload size="1.1em" strokeWidth={2} className="mr-1.5 md:mr-2 flex-shrink-0" />
                  Download Resume
                </button>
              </Link>
              <button
                className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/20 backdrop-blur-md border border-cyan-400/60 text-cyan-300 hover:bg-black/30 hover:border-cyan-300 hover:text-cyan-200 transition-all md:px-6 md:py-3 md:text-base active:scale-95"
                onClick={() => setShowResumePreview(true)}
              >
                <IconEye size="1.1em" strokeWidth={2} className="mr-1.5 md:mr-2 flex-shrink-0" />
                View Resume
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "education" && (
          <motion.div
            key="education"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 md:gap-8 p-3 md:p-8 h-full w-full"
          >
            {/* Top Section - Education Details */}
            <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-3 md:p-8 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                {/* Logo and Title */}
                <div className="flex items-center gap-3 md:gap-6 md:col-span-3">
                  <img 
                    src="/logos/asulogo.png" 
                    alt="ASU Logo" 
                    className="w-10 h-10 md:w-16 md:h-16 object-contain"
                  />
                  <div>
                    <h2 className="text-xl md:text-4xl font-bold text-white">Education</h2>
                    <p className="text-sm md:text-lg text-emerald-400">2022 - 2026</p>
                  </div>
                </div>

                {/* University Info */}
                <div className="md:col-span-1">
                  <h3 className="text-base font-semibold text-cyan-400 md:text-2xl">Arizona State University</h3>
                  <p className="text-sm text-white/80 mt-1 md:text-lg md:mt-2">Bachelor of Science in Computer Science</p>
                  <p className="text-xs text-white/60 md:text-md">Software Engineering Track</p>
                  <div className="mt-2 px-2 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30 md:mt-4 md:px-4 md:py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/80 md:text-base">GPA</span>
                      <span className="text-lg font-bold text-emerald-400 md:text-2xl">4.0/4.0</span>
                    </div>
                  </div>
                </div>

                {/* Academic Achievements */}
                <div className="md:col-span-1 md:ml-8">
                  <h4 className="text-sm font-semibold text-white/90 mt-2 md:text-xl md:mt-0">Academic Achievements</h4>
                  <div className="mt-1 space-y-1 md:space-y-3 md:mt-2">
                    <p className="text-xs text-white/80 md:text-md">• Dean's List (All Semesters)</p>
                    <p className="text-xs text-white/80 md:text-md">• New American University Scholar</p>
                    <p className="text-xs text-white/80 md:text-md">• Minor in Entrepreneurship</p>
                  </div>
                </div>

                {/* Location */}
                <div className="md:col-span-1">
                  <h4 className="text-sm font-semibold text-white/90 mt-2 md:text-xl md:mt-0">Location</h4>
                  <p className="text-xs text-white/60 mt-1 md:text-md md:mt-2">Tempe, Arizona</p>
                  <p className="text-xs text-white/60 md:text-md">United States</p>
                </div>
              </div>
            </div>

            {/* Bottom Section - Coursework Grid */}
            <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-3 md:p-8 border border-white/10">
              <h3 className="text-base font-semibold text-cyan-400 mb-3 md:text-2xl md:mb-6">Key Coursework</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-h-[40vh] md:max-h-[calc(100vh-450px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* CS Core */}
                <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                  <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Computer Science Core</h4>
                  <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                    <li>• Data Structures and Algorithms</li>
                    <li>• Operating Systems</li>
                    <li>• Computer Organization & Assembly</li>
                    <li>• Theoretical Computer Science</li>
                    <li>• Software Engineering</li>
                    <li>• Object-Oriented Programming</li>
                    <li>• Programming Language Principles</li>
                    <li>• Digital Design Fundamentals</li>
                  </ul>
                </div>

                {/* Software Engineering Track */}
                <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                  <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Software Engineering Track</h4>
                  <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                    <li>• Software Analysis and Design</li>
                    <li>• Software QA and Testing</li>
                    <li>• Distributed Software Development</li>
                    <li>• Information Assurance</li>
                  </ul>
                </div>

                {/* Mathematics & Theory */}
                <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                  <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Mathematics & Theory</h4>
                  <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                    <li>• Discrete Mathematics</li>
                    <li>• Calculus for Engineers I, II, III</li>
                    <li>• Applied Linear Algebra</li>
                    <li>• Engineering Statistics</li>
                  </ul>
                </div>

                {/* Entrepreneurship Minor */}
                <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                  <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Entrepreneurship Minor</h4>
                  <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                    <li>• Principles of Entrepreneurship</li>
                    <li>• Creativity and Innovation</li>
                    <li>• Entrepreneurship & Value Creation</li>
                  </ul>
                </div>

                {/* Projects & Practice */}
                <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                  <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Projects & Practice</h4>
                  <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                    <li>• EPICS Gold Program</li>
                    <li>• Computer Science Capstone</li>
                    <li>• Grand Challenge Scholars Program</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "hobbies" && (
          <motion.div
            key="hobbies"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center p-4 md:p-8 h-full"
          >
            <div className="text-lg text-white/60 md:text-2xl">Hobbies content coming soon...</div>
          </motion.div>
        )}

        {activeTab === "side-quests" && (
          <motion.div
            key="side-quests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center p-4 md:p-8 h-full"
          >
            <div className="text-lg text-white/60 md:text-2xl">Side Quests content coming soon...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Preview Modal */}
      {showResumePreview && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResumePreview(false);
            }
          }}
        >
          <div className="w-[90%] h-[90%] bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Link 
                href="/sri_resume.pdf" 
                download
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </Link>
              <button
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                onClick={() => setShowResumePreview(false)}
              >
                <IconPlus className="rotate-45" size={24} />
              </button>
            </div>
            <iframe
              src="/sri_resume.pdf#view=FitH"
              className="w-full h-full"
              style={{ background: 'white' }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
