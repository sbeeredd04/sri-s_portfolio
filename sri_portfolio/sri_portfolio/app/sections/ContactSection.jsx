"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    IconBrandLinkedin,
    IconBrandGithub,
    IconMail,
    IconSend,
    IconCheck,
} from "@tabler/icons-react";

const fadeInUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export default function ContactSection() {
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;

        try {
            setStatus("sending");

            const formData = new FormData(form);
            formData.append("service_id", "service_5g2m4xh");
            formData.append("template_id", "template_wl8ymvl");
            formData.append("user_id", "RLJxuFXWF45rA7V4o");
            formData.append("subject", "WEBSITE CONTACT");

            const response = await fetch(
                "https://api.emailjs.com/api/v1.0/email/send-form",
                { method: "POST", body: formData }
            );

            if (response.ok) {
                setStatus("sent");
                form.reset();
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            console.error("Email error:", error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    const socials = [
        {
            label: "LinkedIn",
            href: "https://www.linkedin.com/in/sriujjwal/",
            icon: IconBrandLinkedin,
            accent: "from-blue-500 to-blue-600",
        },
        {
            label: "GitHub",
            href: "https://github.com/sbeeredd04",
            icon: IconBrandGithub,
            accent: "from-gray-500 to-gray-600",
        },
        {
            label: "Email",
            href: "mailto:srisubspace@gmail.com?subject=WEBSITE CONTACT",
            icon: IconMail,
            accent: "from-cyan-500 to-blue-500",
        },
    ];

    return (
        <section className="w-full h-full">
            <div
                className="w-full h-full overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
            >
                <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
                    {/* Header */}
                    <motion.div {...fadeInUp}>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Get in Touch
                        </h1>
                        <p className="text-white/60 text-sm md:text-base mt-1">
                            Let&apos;s collaborate on something great
                        </p>
                    </motion.div>

                    {/* Social Links */}
                    <motion.div
                        className="grid grid-cols-3 gap-3"
                        initial="initial"
                        animate="animate"
                        variants={{
                            animate: { transition: { staggerChildren: 0.06 } },
                        }}
                    >
                        {socials.map((s) => {
                            const Icon = s.icon;
                            return (
                                <motion.a
                                    key={s.label}
                                    variants={fadeInUp}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass-light rounded-2xl p-4 flex flex-col items-center gap-2 hover:ring-1 hover:ring-white/15 transition-all group"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center shadow-lg`}
                                    >
                                        <Icon
                                            size={18}
                                            className="text-white"
                                            stroke={1.5}
                                        />
                                    </div>
                                    <span className="text-white/70 text-xs font-medium group-hover:text-white/90 transition-colors">
                                        {s.label}
                                    </span>
                                </motion.a>
                            );
                        })}
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        {...fadeInUp}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="glass-light rounded-2xl p-5 md:p-6">
                            <h3 className="text-white/90 text-sm font-semibold mb-4 tracking-tight">
                                Send a Message
                            </h3>
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-3"
                            >
                                <input
                                    type="text"
                                    name="from_name"
                                    placeholder="Your Name"
                                    required
                                    className="w-full px-4 py-3 text-sm text-white bg-white/[0.06] border border-white/[0.12] rounded-xl focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition-all placeholder:text-white/35"
                                />
                                <input
                                    type="email"
                                    name="from_email"
                                    placeholder="Your Email"
                                    required
                                    className="w-full px-4 py-3 text-sm text-white bg-white/[0.06] border border-white/[0.12] rounded-xl focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition-all placeholder:text-white/35"
                                />
                                <input
                                    type="hidden"
                                    name="subject"
                                    value="WEBSITE CONTACT"
                                />
                                <textarea
                                    name="message"
                                    placeholder="Your Message"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 text-sm text-white bg-white/[0.06] border border-white/[0.12] rounded-xl focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition-all placeholder:text-white/35 resize-none"
                                />
                                <motion.button
                                    type="submit"
                                    disabled={status === "sending"}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                        status === "sent"
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : status === "error"
                                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                            : "bg-white/10 text-white hover:bg-white/15 border border-white/[0.08]"
                                    } disabled:opacity-50`}
                                >
                                    {status === "sending" ? (
                                        "Sending..."
                                    ) : status === "sent" ? (
                                        <>
                                            <IconCheck size={16} /> Sent!
                                        </>
                                    ) : status === "error" ? (
                                        "Failed — Try Again"
                                    ) : (
                                        <>
                                            <IconSend size={16} /> Send Message
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Direct email footer */}
                    <motion.p
                        className="text-center text-white/25 text-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Or email directly at{" "}
                        <a
                            href="mailto:srisubspace@gmail.com?subject=WEBSITE CONTACT"
                            className="text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors"
                        >
                            srisubspace@gmail.com
                        </a>
                    </motion.p>

                    <div className="h-10" />
                </div>
            </div>
        </section>
    );
}
