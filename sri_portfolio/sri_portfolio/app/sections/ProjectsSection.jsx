"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import projects from "../json/projects.json";
import deployedProjects from "../json/deployed.json";
import {
    IconBrandGithub,
    IconExternalLink,
} from "@tabler/icons-react";

const fadeInUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

function ProjectCard({ project, index }) {
    const imageUrl = project.image?.startsWith("/")
        ? project.image
        : `/${project.image || "projects/default-project.jpg"}`;

    return (
        <motion.div variants={fadeInUp} className="group">
            <div className="glass-light rounded-2xl overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-white/15 hover:translate-y-[-2px]">
                {/* Image */}
                <div className="relative h-40 md:h-48 overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {/* Action Buttons on Image */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {project.github && (
                            <a
                                href={project.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                            >
                                <IconBrandGithub size={15} />
                            </a>
                        )}
                        {project.href && (
                            <a
                                href={project.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                            >
                                <IconExternalLink size={15} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                    <h3 className="text-white text-base font-semibold tracking-tight truncate">
                        {project.title}
                    </h3>
                    <p className="text-white/50 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {project.description}
                    </p>

                    {/* Tech Tags */}
                    {project.technologies && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {project.technologies.slice(0, 4).map((tech, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.06]"
                                >
                                    {tech}
                                </span>
                            ))}
                            {project.technologies.length > 4 && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                                    +{project.technologies.length - 4}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function ProjectsSection({ activeTab, isMobile }) {
    const items = activeTab === "all" ? projects : deployedProjects;

    return (
        <section className="w-full h-full">
            <div
                className="w-full h-full overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5 md:space-y-6">
                            {/* Section Header */}
                            <motion.div {...fadeInUp}>
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                    {activeTab === "all"
                                        ? "Featured Projects"
                                        : "Deployed Projects"}
                                </h1>
                                <p className="text-white/40 text-sm md:text-base mt-1">
                                    {activeTab === "all"
                                        ? `${projects.length} projects built with passion`
                                        : `${deployedProjects.length} live and deployed`}
                                </p>
                            </motion.div>

                            {/* Project Grid */}
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                initial="initial"
                                animate="animate"
                                variants={{
                                    animate: {
                                        transition: { staggerChildren: 0.06 },
                                    },
                                }}
                            >
                                {items.map((project, index) => (
                                    <ProjectCard
                                        key={project.title + index}
                                        project={project}
                                        index={index}
                                    />
                                ))}
                            </motion.div>

                            <div className="h-20" />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
