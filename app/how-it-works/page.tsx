"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
    const steps = [
        {
            step: "1",
            title: "Paste product image & details",
            desc: "Upload your product image, add the name and price. Takes 30 seconds.",
            icon: "📸"
        },
        {
            step: "2",
            title: "AI builds the video",
            desc: "Our AI writes the script, generates voiceover, adds text overlays, and composes everything.",
            icon: "🤖"
        },
        {
            step: "3",
            title: "Download & post",
            desc: "Get your ready-to-post TikTok with captions and hashtags. No editing needed.",
            icon: "📲"
        },
        {
            step: "4",
            title: "Repeat at scale",
            desc: "Generate as many videos as your plan allows. Post daily without the work.",
            icon: "🚀"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight">VeoGen</span>
                    </Link>
                    <Link href="/create">
                        <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold px-6 py-2.5 flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25">
                            Start Free <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-violet-600/10 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-fuchsia-600/10 blur-[160px] rounded-full" />
            </div>

            <div className="relative z-10 pt-32 pb-20">
                {/* Header */}
                <div className="max-w-4xl mx-auto px-6 text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                            How It Works
                        </h1>
                        <p className="text-xl text-zinc-400">
                            From product image to ready-to-post TikTok in under 2 minutes
                        </p>
                    </motion.div>
                </div>

                {/* Steps */}
                <div className="max-w-4xl mx-auto px-6">
                    <div className="space-y-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                className="flex gap-6 p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02]"
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl">
                                        {step.icon}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-violet-400 mb-2">Step {step.step}</div>
                                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                                    <p className="text-zinc-400 text-lg">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="text-center mt-16"
                    >
                        <Link href="/create">
                            <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl px-12 h-16 text-xl font-bold shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                Generate My First Selling TikTok <ArrowRight className="w-6 h-6" />
                            </button>
                        </Link>
                        <p className="text-sm text-zinc-500 mt-4">3 free videos • No credit card required</p>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">VeoGen</span>
                    </Link>
                    <p className="text-sm text-zinc-500">
                        © 2025 VeoGen. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
