"use client";

import { radarSkillsData, detailedSkillsData, gameStatsData, achievementsData } from "../json/skillsData";
import GameSkillsView from "../components/GameSkillsView";
import GitHubStatsView from "../components/GitHubStatsView";

export default function SkillsSection({ skillsActiveTab }) {
    return (
        <section className="w-full h-full">
            <div className="w-full h-full max-w-7xl mx-auto">
                <div className="w-full h-full overflow-hidden">
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
