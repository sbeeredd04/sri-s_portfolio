"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
    IconBriefcase,
    IconBrain,
    IconUsers,
    IconBuilding,
    IconExternalLink,
    IconChevronDown,
    IconTrophy,
    IconCode,
    IconRocket,
    IconFlask,
} from "@tabler/icons-react";

const experiences = [
    {
        id: "gml",
        role: "AI/ML Software Engineering Intern",
        company: "Geometric Media Lab",
        location: "Tempe, AZ",
        period: "Jul 2024 – Present",
        accent: "from-violet-500 to-purple-600",
        accentColor: "#8b5cf6",
        icon: IconBrain,
        highlights: [
            { text: "Boosted gunshot detection accuracy from 20% to 80%", bold: true, detail: "by designing an ML pipeline that captured and preprocessed live audio data for training and inference, then deploying the model on a Raspberry Pi for field use in the South American rainforest, helping curb poaching." },
            { text: "Developed ML pipelines and architectures for 6+ research projects", bold: true, detail: "using pretrained VLM models like Gemini VLM API, Hugging Face, and stable video diffusion models with computer vision for rapid prototyping and deployment." },
            { text: "Built custom inference pipelines", bold: true, detail: "by architecting and experimenting with PyTorch ML models based on research papers, leveraging the SOL GPU cluster with CUDA, and using wandb for experiment logging and analysis." },
        ],
        tags: ["PyTorch", "Computer Vision", "CUDA", "Hugging Face", "wandb"],
        image: null,
    },
    {
        id: "mesa",
        role: "Software Engineer",
        company: "Mesa Historical Museum (EPICS)",
        location: "Tempe, AZ",
        period: "Aug 2024 – May 2025",
        accent: "from-amber-500 to-orange-600",
        accentColor: "#f59e0b",
        icon: IconBuilding,
        highlights: [
            { text: "Led a 7-member team from Figma design to production", bold: true, detail: "translating wireframes into a React/Vite application with Three.js for interactive 3D museum exhibits showcasing historic individuals and landmarks." },
            { text: "Architected a CI/CD pipeline on Vercel", bold: true, detail: "for automated deployments and shipped the application to a dedicated kiosk display by configuring a locked-down browser environment on the museum's TV hardware." },
            { text: "Shipped a static-site solution", bold: true, detail: "using JSON data and Vercel, eliminating CMS dependency and reducing maintenance costs while ensuring fast, reliable access for museum visitors." },
        ],
        tags: ["React", "Three.js", "Team Lead", "CI/CD", "Vercel"],
        image: "/experiences/experience-screenshot-1.png",
    },
    {
        id: "biodesign",
        role: "Software Engineering Intern",
        company: "ASU Biodesign Institute",
        location: "Tempe, AZ",
        period: "Jan 2023 – Aug 2024",
        accent: "from-emerald-500 to-teal-600",
        accentColor: "#10b981",
        icon: IconFlask,
        highlights: [
            { text: "Engineered a Django/FastAPI backend", bold: true, detail: "to automate DNA-PAINT image analysis for 100+ datasets, enabling researchers to process 2000+ nanorobot entities per image with ML-driven clustering and tracking." },
            { text: "Optimized analysis time from 4 hours to 10–30 minutes", bold: true, detail: "per image by building a scalable pipeline and REST API, delivering a user-friendly web interface for machine learning analysis and visualization." },
            { text: "Documented codebase with comprehensive API docs and testing", bold: true, detail: "streamlining onboarding for new engineers and enabling reproducible research workflows." },
        ],
        tags: ["Django", "FastAPI", "ML", "93% Time Reduction"],
        image: "/experiences/experience-screenshot-2.jpeg",
    },
];

const activities = [
    {
        id: "soda",
        role: "Director of Technology",
        company: "Software Developers Association (SoDA)",
        location: "Tempe, AZ",
        period: "Jan 2024 – Nov 2025",
        accent: "from-cyan-500 to-blue-600",
        accentColor: "#06b6d4",
        icon: IconUsers,
        highlights: [
            { text: "Built and scaled SoDA's internal tools platform", bold: true, detail: "(Discord OAuth2.0-secured admin site, summarizer bot, and member rewards/storefront), supporting 3,000+ members across multiple clubs (ACM, WiCS) and enabling secure, automated management." },
            { text: "Empowered 600+ students with hands-on software skills", bold: true, detail: "by leading an 11-member team to deliver 12+ technical workshops (Docker, Flask, Chrome Extensions) and hackathons, while fostering a creative and collaborative culture." },
        ],
        tags: ["Leadership", "3,000+ Members", "12+ Workshops", "Full-Stack"],
        website: "https://thesoda.io/",
        image: null,
    },
    {
        id: "hackathons",
        role: "5x Hackathon Winner",
        company: "Various Hackathons",
        location: "",
        period: "2022 – Present",
        accent: "from-amber-500 to-orange-600",
        accentColor: "#f59e0b",
        icon: IconTrophy,
        highlights: [
            { text: "Won 5 hackathons, earning over $8K in prize money", bold: true, detail: "by delivering solutions using Python, Flask, React, OpenAI API, and Docker." },
            { text: "Led teams and executed under pressure", bold: true, detail: "demonstrating collaboration, problem-solving, and leadership across fast-paced, cross-functional MVP projects." },
        ],
        tags: ["$8K+ Prizes", "5 Wins", "Team Lead", "Rapid Prototyping"],
        image: null,
    },
];

const achievements = [
    {
        year: "2022",
        title: "Discovering Programming",
        subtitle: "Introduction to Coding",
        description: "Programming journey began with Java, sparking a passion for creating impactful software solutions. Built foundation in OOP, data structures, and algorithmic thinking.",
        icon: IconCode,
        accent: "from-blue-400 to-cyan-500",
        image: "/achievements/ac (1).webp",
    },
    {
        year: "2023",
        title: "Winning Five Hackathons",
        subtitle: "$8K+ in Prizes",
        description: "Won 5 hackathons earning over $8K in prize money, including Devil's Invent, AZ Spark, and DAASH events. Created Mine Alliance (sustainable mining + OpenAI — $1.5K prize) and Sage AI (data science tutor with RAG pipeline).",
        icon: IconTrophy,
        accent: "from-amber-400 to-orange-500",
        image: "/achievements/ac (2).webp",
    },
    {
        year: "2023",
        title: "Growing in Machine Learning",
        subtitle: "ML Specialization",
        description: "Developed expertise in unsupervised models and generative AI. Created Amano — an emotion-based song recommendation system using reinforcement learning and sentiment analysis.",
        icon: IconBrain,
        accent: "from-violet-400 to-purple-500",
        image: "/achievements/ac (3).webp",
    },
    {
        year: "2024",
        title: "Software Engineering Mastery",
        subtitle: "Advanced Development",
        description: "Refined full-stack development skills with Next.js, React, Flask, and Three.js. Led teams as Lead Software Engineer for research and industry projects.",
        icon: IconRocket,
        accent: "from-emerald-400 to-teal-500",
        image: "/achievements/ac (4).webp",
    },
];

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

function ExperienceCard({ exp, index, isExpanded, onToggle }) {
    const Icon = exp.icon;
    return (
        <motion.div
            variants={fadeInUp}
            className="group"
        >
            <div className={`glass-light rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-white/20" : ""}`}>
                {/* Card Header */}
                <button
                    onClick={onToggle}
                    className="w-full flex items-start gap-4 p-4 md:p-5 text-left hover:bg-white/[0.03] transition-colors"
                >
                    <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${exp.accent} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <Icon size={20} className="text-white" stroke={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white text-base md:text-lg font-semibold tracking-tight">{exp.role}</h3>
                        </div>
                        <p className="text-white/60 text-sm mt-0.5">{exp.company} · {exp.location}</p>
                        <p className="text-white/35 text-xs mt-0.5">{exp.period}</p>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/30 flex-shrink-0 mt-1"
                    >
                        <IconChevronDown size={18} />
                    </motion.div>
                </button>

                {/* Tags Row (always visible) */}
                <div className="flex flex-wrap gap-1.5 px-4 pb-3 md:px-5">
                    {exp.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-[10px] md:text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.06]"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3 border-t border-white/[0.06] pt-3">
                                {/* Image preview */}
                                {exp.image && (
                                    <div className="relative h-40 md:h-52 rounded-xl overflow-hidden">
                                        <Image
                                            src={exp.image}
                                            alt={exp.company}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    </div>
                                )}

                                {/* Website link */}
                                {exp.website && (
                                    <a
                                        href={exp.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                                        style={{ color: exp.accentColor }}
                                    >
                                        <IconExternalLink size={14} />
                                        {exp.website.replace("https://", "")}
                                    </a>
                                )}

                                {/* Highlights */}
                                <div className="space-y-2.5">
                                    {exp.highlights.map((h, hi) => (
                                        <motion.div
                                            key={hi}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: hi * 0.06 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${exp.accent} mt-2 flex-shrink-0`} />
                                            <p className="text-white/70 text-sm leading-relaxed">
                                                <strong className="text-white/90">{h.text}</strong>{" "}
                                                {h.detail}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function ExperienceSection({ activeTab }) {
    const [expandedExp, setExpandedExp] = useState(null);
    const [expandedAch, setExpandedAch] = useState(null);

    return (
        <section className="w-full h-full">
            <div className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <AnimatePresence mode="wait">
                    {activeTab === "experience" ? (
                        <motion.div
                            key="experience"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5 md:space-y-6">
                                {/* Section Header */}
                                <motion.div {...fadeInUp}>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        Professional Experience
                                    </h1>
                                    <p className="text-white/40 text-sm md:text-base mt-1">
                                        Software engineering, machine learning, and leadership
                                    </p>
                                </motion.div>

                                {/* Experience Cards */}
                                <motion.div
                                    className="space-y-3"
                                    initial="initial"
                                    animate="animate"
                                    variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
                                >
                                    {experiences.map((exp, index) => (
                                        <ExperienceCard
                                            key={exp.id}
                                            exp={exp}
                                            index={index}
                                            isExpanded={expandedExp === exp.id}
                                            onToggle={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                                        />
                                    ))}
                                </motion.div>

                                {/* Activities Section */}
                                <motion.div {...fadeInUp}>
                                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-4">
                                        Activities & Leadership
                                    </h2>
                                    <p className="text-white/40 text-sm md:text-base mt-1">
                                        Community building and competition
                                    </p>
                                </motion.div>

                                <motion.div
                                    className="space-y-3"
                                    initial="initial"
                                    animate="animate"
                                    variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
                                >
                                    {activities.map((exp, index) => (
                                        <ExperienceCard
                                            key={exp.id}
                                            exp={exp}
                                            index={index}
                                            isExpanded={expandedExp === exp.id}
                                            onToggle={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                                        />
                                    ))}
                                </motion.div>

                                <div className="h-6" />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5 md:space-y-6">
                                {/* Section Header */}
                                <motion.div {...fadeInUp}>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        Key Achievements
                                    </h1>
                                    <p className="text-white/40 text-sm md:text-base mt-1">
                                        Milestones in my programming journey
                                    </p>
                                </motion.div>

                                {/* Achievement Cards */}
                                <motion.div
                                    className="space-y-3"
                                    initial="initial"
                                    animate="animate"
                                    variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
                                >
                                    {achievements.map((ach, index) => {
                                        const Icon = ach.icon;
                                        const isExpanded = expandedAch === index;

                                        return (
                                            <motion.div key={index} variants={fadeInUp}>
                                                <div className={`glass-light rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-white/20" : ""}`}>
                                                    <button
                                                        onClick={() => setExpandedAch(isExpanded ? null : index)}
                                                        className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-white/[0.03] transition-colors"
                                                    >
                                                        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${ach.accent} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                            <Icon size={20} className="text-white" stroke={1.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-white text-base md:text-lg font-semibold tracking-tight">
                                                                {ach.title}
                                                            </h3>
                                                            <p className="text-white/40 text-sm mt-0.5">
                                                                {ach.year} · {ach.subtitle}
                                                            </p>
                                                        </div>
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="text-white/30 flex-shrink-0"
                                                        >
                                                            <IconChevronDown size={18} />
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
                                                                <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3 border-t border-white/[0.06] pt-3">
                                                                    <div className="relative h-44 md:h-60 rounded-xl overflow-hidden">
                                                                        <Image
                                                                            src={ach.image}
                                                                            alt={ach.title}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                                    </div>
                                                                    <p className="text-white/70 text-sm md:text-base leading-relaxed">
                                                                        {ach.description}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>

                                <div className="h-6" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
