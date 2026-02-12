"use client";

import GameSkillsView from "../components/GameSkillsView";
import GitHubStatsView from "../components/GitHubStatsView";
import { radarSkillsData, detailedSkillsData, gameStatsData, achievementsData } from "../json/skillsData";

/**
 * SkillsSection Component
 * Displays skills overview and GitHub analytics
 * 
 * @param {Object} props
 * @param {string} props.skillsActiveTab - Currently active tab ("overview" or "github")
 * @param {Function} props.setSkillsActiveTab - Function to set active tab
 * @returns {JSX.Element}
 */
export default function SkillsSection({ skillsActiveTab, setSkillsActiveTab }) {
  return (
    <section className="w-full h-full">
      <div className="w-full h-full max-w-7xl mx-auto">
        <div className="w-full h-full rounded-2xl bg-neutral-800/10 backdrop-blur-xl border border-white/10 overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
             }}>
          {skillsActiveTab === "overview" ? (
            <GameSkillsView
              radarSkills={radarSkillsData}
              detailedSkills={detailedSkillsData}
              playerStats={gameStatsData}
              achievements={achievementsData}
              activeView={skillsActiveTab}
            />
          ) : skillsActiveTab === "github" ? (
            <GitHubStatsView />
          ) : (
            <GameSkillsView
              radarSkills={radarSkillsData}
              detailedSkills={detailedSkillsData}
              playerStats={gameStatsData}
              achievements={achievementsData}
              activeView={skillsActiveTab}
            />
          )}
        </div>
      </div>
    </section>
  );
}
