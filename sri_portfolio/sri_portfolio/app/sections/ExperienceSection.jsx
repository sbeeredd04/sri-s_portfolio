"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TimelineDemo } from "../timeline";
import { AchievementTimelineDemo } from "../AcheivementTimeline";

/**
 * ExperienceSection Component
 * Displays experience timeline and achievements
 * 
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ("experience" or "achievements")
 * @param {Function} props.setActiveTab - Function to set active tab
 * @returns {JSX.Element}
 */
export default function ExperienceSection({ activeTab, setActiveTab }) {
  return (
    <section className="w-full h-full">
      <div className="w-full h-full overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-full"
          >
            {activeTab === "experience" ? (
              <TimelineDemo theme="experience" />
            ) : (
              <AchievementTimelineDemo theme="achievements" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
