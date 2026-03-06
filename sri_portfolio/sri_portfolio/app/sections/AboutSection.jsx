"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import aboutMeContent from "../json/aboutme.json";
import {
    IconDownload,
    IconEye,
    IconPlus,
    IconMapPin,
    IconSchool,
    IconTrophy,
    IconCode,
    IconBulb,
    IconRocket,
    IconHeart,
    IconTarget,
} from "@tabler/icons-react";
import { useState } from "react";

const sectionIcons = [IconHeart, IconCode, IconBulb, IconTarget, IconRocket];
const sectionAccents = [
    "from-cyan-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
];

function parseDescription(text) {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={i} className="text-white/80 italic">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={i} className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded text-sm">{part.slice(1, -1)}</code>;
        }
        return part;
    });
}

function parseBulletDescription(desc) {
    const lines = desc.split("\n").filter(Boolean);
    const bullets = [];
    let intro = "";
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ")) {
            bullets.push(trimmed.slice(2));
        } else {
            intro = trimmed;
        }
    }
    return { intro, bullets };
}

const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
    animate: { transition: { staggerChildren: 0.08 } },
};

export default function AboutSection({ activeTab }) {
    const [showResumePreview, setShowResumePreview] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null);

    return (
        <section className="w-full h-full flex flex-col">
            <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full overflow-y-auto"
                        style={{ scrollbarWidth: "none" }}
                    >
                        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
                            {/* Hero Card */}
                            <motion.div
                                className="relative overflow-hidden rounded-3xl"
                                {...fadeInUp}
                            >
                                <div className="relative h-48 md:h-64 overflow-hidden rounded-3xl">
                                    <Image
                                        src={aboutMeContent[0].content}
                                        alt="Sri Ujjwal Reddy"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                                                Sri Ujjwal Reddy
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <IconMapPin size={14} className="text-white/50" />
                                                <p className="text-white/60 text-sm md:text-base">
                                                    Hyderabad, India → Tempe, Arizona
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Content Cards */}
                            <motion.div
                                className="space-y-4 md:space-y-5"
                                variants={stagger}
                                initial="initial"
                                animate="animate"
                            >
                                {aboutMeContent.map((section, index) => {
                                    const Icon = sectionIcons[index];
                                    const accent = sectionAccents[index];
                                    const { intro, bullets } = parseBulletDescription(section.description);
                                    const isExpanded = expandedCard === index;

                                    return (
                                        <motion.div
                                            key={section.title}
                                            variants={fadeInUp}
                                            className="group"
                                        >
                                            <div
                                                className={`glass-light rounded-2xl overflow-hidden transition-all duration-300 ${
                                                    isExpanded ? "ring-1 ring-white/20" : ""
                                                }`}
                                            >
                                                <button
                                                    onClick={() => setExpandedCard(isExpanded ? null : index)}
                                                    className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-white/[0.03] transition-colors"
                                                >
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                        <Icon size={20} className="text-white" stroke={1.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white text-base md:text-lg font-semibold tracking-tight">
                                                            {section.title}
                                                        </h3>
                                                        {!isExpanded && (
                                                            <p className="text-white/40 text-sm truncate mt-0.5">
                                                                {intro || (bullets.length > 0 ? bullets[0].replace(/\*\*/g, "") : "")}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <motion.div
                                                        animate={{ rotate: isExpanded ? 45 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="text-white/30 flex-shrink-0"
                                                    >
                                                        <IconPlus size={18} />
                                                    </motion.div>
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3">
                                                                {index > 0 && (
                                                                    <div className="relative h-40 md:h-56 rounded-xl overflow-hidden">
                                                                        <Image
                                                                            src={section.content}
                                                                            alt={section.title}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                                    </div>
                                                                )}
                                                                {intro && (
                                                                    <p className="text-white/70 text-sm md:text-base leading-relaxed">
                                                                        {parseDescription(intro)}
                                                                    </p>
                                                                )}
                                                                {bullets.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        {bullets.map((bullet, bi) => (
                                                                            <motion.div
                                                                                key={bi}
                                                                                initial={{ opacity: 0, x: -8 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: bi * 0.05 }}
                                                                                className="flex items-start gap-3"
                                                                            >
                                                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${accent} mt-2 flex-shrink-0`} />
                                                                                <p className="text-white/70 text-sm md:text-base leading-relaxed">
                                                                                    {parseDescription(bullet)}
                                                                                </p>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {!intro && bullets.length === 0 && (
                                                                    <p className="text-white/70 text-sm md:text-base leading-relaxed">
                                                                        {parseDescription(section.description)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {/* Resume Actions */}
                            <motion.div
                                className="flex items-center justify-center gap-3 pb-6"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                            >
                                <Link href="/sri_resume.pdf" download>
                                    <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full glass-light text-white hover:bg-white/15 transition-all active:scale-95">
                                        <IconDownload size={16} stroke={2} />
                                        Download Resume
                                    </button>
                                </Link>
                                <button
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full glass-dark text-white hover:bg-white/10 transition-all active:scale-95"
                                    onClick={() => setShowResumePreview(true)}
                                >
                                    <IconEye size={16} stroke={2} />
                                    View Resume
                                </button>
                            </motion.div>
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
                        className="h-full overflow-y-auto"
                        style={{ scrollbarWidth: "none" }}
                    >
                        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5 md:space-y-6">
                            {/* Education Hero */}
                            <motion.div className="glass-light rounded-2xl p-5 md:p-8" {...fadeInUp}>
                                <div className="flex items-start gap-4 md:gap-6">
                                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                                        <img src="/logos/asulogo.png" alt="ASU Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs md:text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                                            2022 — 2026
                                        </span>
                                        <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight mt-1.5">
                                            Arizona State University
                                        </h2>
                                        <p className="text-white/60 text-sm md:text-base mt-1">B.S. Computer Science · Software Engineering Track</p>
                                        <p className="text-white/40 text-sm mt-0.5">Minor in Entrepreneurship · Tempe, Arizona · Graduating May 2026</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-5 md:mt-6">
                                    <div className="glass rounded-xl p-3 md:p-4 text-center">
                                        <p className="text-xl md:text-3xl font-bold text-emerald-400">4.0</p>
                                        <p className="text-white/40 text-xs md:text-sm mt-0.5">GPA</p>
                                    </div>
                                    <div className="glass rounded-xl p-3 md:p-4 text-center">
                                        <IconTrophy className="inline-block text-cyan-400" size={24} />
                                        <p className="text-white/40 text-xs md:text-sm mt-0.5">Dean&apos;s List</p>
                                    </div>
                                    <div className="glass rounded-xl p-3 md:p-4 text-center">
                                        <IconSchool className="inline-block text-violet-400" size={24} />
                                        <p className="text-white/40 text-xs md:text-sm mt-0.5">NAU Scholar</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Coursework Grid */}
                            <motion.div className="space-y-3" variants={stagger} initial="initial" animate="animate">
                                <motion.h3 variants={fadeInUp} className="text-white/50 text-xs font-semibold uppercase tracking-widest px-1">
                                    Key Coursework
                                </motion.h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[
                                        { title: "CS Core", icon: IconCode, accent: "from-blue-400 to-cyan-400", items: ["Data Structures & Algorithms", "Operating Systems", "Distributed Systems", "Machine Learning", "Computer Organization", "Theoretical CS", "Software Engineering", "OOP", "PL Principles", "Digital Design"] },
                                        { title: "Software Engineering", icon: IconBulb, accent: "from-violet-400 to-purple-400", items: ["Software Analysis & Design", "Software QA & Testing", "Distributed Development", "Information Assurance"] },
                                        { title: "Mathematics", icon: IconTarget, accent: "from-amber-400 to-orange-400", items: ["Discrete Mathematics", "Calculus I, II, III", "Applied Linear Algebra", "Engineering Statistics"] },
                                        { title: "Entrepreneurship", icon: IconRocket, accent: "from-emerald-400 to-teal-400", items: ["Principles of Entrepreneurship", "Creativity & Innovation", "Value Creation"] },
                                        { title: "Projects & Practice", icon: IconTrophy, accent: "from-rose-400 to-pink-400", items: ["EPICS Gold Program", "CS Capstone", "Grand Challenge Scholars"] },
                                    ].map((category) => (
                                        <motion.div key={category.title} variants={fadeInUp} className="glass-light rounded-2xl p-4 md:p-5">
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.accent} flex items-center justify-center`}>
                                                    <category.icon size={16} className="text-white" stroke={1.5} />
                                                </div>
                                                <h4 className="text-white/90 text-sm font-semibold">{category.title}</h4>
                                            </div>
                                            <div className="space-y-1.5">
                                                {category.items.map((item, ii) => (
                                                    <p key={ii} className="text-white/50 text-xs md:text-sm leading-relaxed flex items-center gap-2">
                                                        <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${category.accent} flex-shrink-0`} />
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                            <div className="h-4" />
                        </div>
                    </motion.div>
                )}

                {activeTab === "hobbies" && (
                    <motion.div key="hobbies" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex items-center justify-center p-4 md:p-8 h-full">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <p className="text-white/40 text-base md:text-lg font-medium">Coming soon</p>
                        </div>
                    </motion.div>
                )}

                {activeTab === "side-quests" && (
                    <motion.div key="side-quests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex items-center justify-center p-4 md:p-8 h-full">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🗺️</div>
                            <p className="text-white/40 text-base md:text-lg font-medium">Coming soon</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resume Preview Modal */}
            <AnimatePresence>
                {showResumePreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowResumePreview(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 200 }}
                            className="w-[90%] h-[90%] bg-white rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                                <Link href="/sri_resume.pdf" download className="px-4 py-2 bg-white/90 hover:bg-white text-black text-sm font-semibold rounded-full transition-colors shadow-lg" onClick={(e) => e.stopPropagation()}>
                                    Download
                                </Link>
                                <button className="w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors" onClick={() => setShowResumePreview(false)}>
                                    <IconPlus className="rotate-45" size={16} />
                                </button>
                            </div>
                            <iframe src="/sri_resume.pdf#view=FitH" className="w-full h-full" style={{ background: "white" }} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
