"use client";

import Link from "next/link";
import {
    IconBrandGithub,
    IconBrandLinkedin,
    IconBrandSpotify,
    IconDownload,
    IconMail,
} from "@tabler/icons-react";

export default function BottomTabBar({
    activeSection,
    activeTab,
    setActiveTab,
    skillsActiveTab,
    setSkillsActiveTab,
    isMobile,
}) {
    return (
        <div className="flex-shrink-0 h-12 md:h-16 mx-6" id="tab-switcher-tutorial-target">
            <div className="w-full h-full glass flex items-center justify-between px-2 md:px-6">
                {/* Dynamic Tabs based on active section */}
                <div className="glass-segment flex items-center gap-1 md:gap-4 overflow-x-auto scrollbar-none">
                    {activeSection === "home" && (
                        <button className="glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0 md:px-4 md:py-1.5 md:text-sm">
                            Overview
                        </button>
                    )}

                    {activeSection === "about" && (
                        <>
                            {["profile", "education", "hobbies", "side-quests"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap md:px-4 md:py-1.5 md:text-sm ${activeTab === tab
                                            ? "bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0"
                                            : "bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] border-0"
                                        }`}
                                >
                                    {tab === "side-quests" ? "Side Quests" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </>
                    )}

                    {activeSection === "experience" && (
                        <>
                            {["experience", "achievements"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap md:px-4 md:py-1.5 md:text-sm ${activeTab === tab
                                            ? "bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0"
                                            : "bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] border-0"
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </>
                    )}

                    {activeSection === "projects" && (
                        <>
                            {[
                                { key: "all", label: "All Projects" },
                                { key: "deployed", label: "Deployed Projects" },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap md:px-4 md:py-1.5 md:text-sm ${activeTab === key
                                            ? "bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0"
                                            : "bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] border-0"
                                        }`}
                                    onClick={() => setActiveTab(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </>
                    )}

                    {activeSection === "skills" && (
                        <>
                            {[
                                { key: "overview", label: "Skill Overview" },
                                { key: "github", label: "GitHub Analytics" },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap md:px-4 md:py-1.5 md:text-sm ${skillsActiveTab === key
                                            ? "bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0"
                                            : "bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] border-0"
                                        }`}
                                    onClick={() => setSkillsActiveTab(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </>
                    )}

                    {activeSection === "blog" && (
                        <>
                            <button className="glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0 md:px-4 md:py-1.5 md:text-sm">
                                All Posts
                            </button>
                            <button className="glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] border-0 md:px-4 md:py-1.5 md:text-sm">
                                Tech
                            </button>
                            <button className="glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] border-0 md:px-4 md:py-1.5 md:text-sm">
                                Tutorials
                            </button>
                        </>
                    )}

                    {activeSection === "contact" && (
                        <button className="glass-segment-item px-2 py-1 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-0 md:px-4 md:py-1.5 md:text-sm">
                            Contact Form
                        </button>
                    )}
                </div>

                {/* Social Links - Only visible on desktop */}
                {!isMobile && (
                    <div className="hidden md:flex items-center gap-4" id="social-links-tutorial-target">
                        <Link
                            href="https://github.com/sbeeredd04"
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white/60 hover:text-white transition-all"
                        >
                            <IconBrandGithub size={24} stroke={1.25} />
                            <span className="text-sm font-medium">GitHub</span>
                        </Link>
                        <Link
                            href="https://www.linkedin.com/in/sriujjwal/"
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white/60 hover:text-white transition-all"
                        >
                            <IconBrandLinkedin size={24} stroke={1.25} />
                            <span className="text-sm font-medium">LinkedIn</span>
                        </Link>
                        <Link
                            href="mailto:srisubspace@gmail.com"
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white/60 hover:text-white transition-all"
                        >
                            <IconMail size={24} stroke={1.25} />
                            <span className="text-sm font-medium">Email</span>
                        </Link>
                        <Link
                            href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6"
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white/60 hover:text-white transition-all"
                        >
                            <IconBrandSpotify size={24} stroke={1.25} />
                            <span className="text-sm font-medium">Spotify</span>
                        </Link>
                        <Link
                            href="/sri_resume.pdf"
                            download
                            className="flex items-center gap-2 px-4 py-1.5 glass-pill text-white/80 hover:text-white transition-all"
                        >
                            <IconDownload size={24} stroke={1.25} />
                            <span className="text-sm font-medium">Resume</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
