"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Upload, Sparkles, Play, Check } from "lucide-react";

/**
 * HeroDemo - Animated mockup showing the VeoGen workflow
 * 1. Product image appears
 * 2. AI processing animation
 * 3. Video result with play button
 */
export function HeroDemo() {
    const [step, setStep] = useState(0);

    // Auto-advance through steps
    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full max-w-[380px] mx-auto">
            {/* Phone Frame */}
            <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-[3rem] p-3 shadow-2xl shadow-violet-500/20 border border-white/10">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />

                {/* Screen */}
                <div className="relative bg-[#0a0a0f] rounded-[2.5rem] overflow-hidden aspect-[9/16]">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10" />

                    <AnimatePresence mode="wait">
                        {/* Step 0: Empty state */}
                        {step === 0 && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-8"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-violet-500/20 border-2 border-dashed border-violet-400/50 flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-violet-400" />
                                </div>
                                <p className="text-zinc-400 text-sm text-center">Drop product image</p>
                            </motion.div>
                        )}

                        {/* Step 1: Image uploaded */}
                        {step === 1 && (
                            <motion.div
                                key="image"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 flex items-center justify-center p-6"
                            >
                                {/* Fake product image placeholder */}
                                <div className="relative w-40 h-40 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg flex items-center justify-center">
                                    <span className="text-6xl">🍳</span>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                    >
                                        <Check className="w-5 h-5 text-white" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: AI Processing */}
                        {step === 2 && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-8"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500 mb-6"
                                />
                                <div className="flex items-center gap-2 text-violet-400">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="text-sm font-medium">AI generating video...</span>
                                </div>
                                {/* Progress dots */}
                                <div className="flex gap-2 mt-4">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                            className="w-2 h-2 bg-violet-500 rounded-full"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Video Result */}
                        {step === 3 && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0"
                            >
                                {/* Fake video preview with kitchen background */}
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-200/20 via-orange-100/10 to-zinc-900">
                                    {/* Counter surface simulation */}
                                    <div className="absolute top-[35%] left-0 right-0 h-1/2 bg-gradient-to-b from-stone-400/30 to-stone-600/20" />

                                    {/* Product on counter */}
                                    <div className="absolute top-[25%] left-1/2 -translate-x-1/2">
                                        <motion.div
                                            animate={{ y: [-5, 5, -5] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                            className="text-7xl"
                                        >
                                            🍳
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Text overlays */}
                                <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-2">
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="px-4 py-2 bg-red-500 rounded-full text-white text-xs font-bold"
                                    >
                                        🔥 50% OFF TODAY
                                    </motion.div>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-white text-sm font-medium"
                                    >
                                        Premium Cookware Set
                                    </motion.p>
                                </div>

                                {/* Price tag */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/80 rounded-full"
                                >
                                    <span className="text-yellow-400 font-bold">💰 $29.99</span>
                                </motion.div>

                                {/* Play button */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.9, type: "spring" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                >
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mt-6">
                {["Upload", "AI Magic", "Video Ready"].map((label, i) => (
                    <div
                        key={i}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${step >= i + 1
                                ? "bg-violet-500 text-white"
                                : "bg-white/10 text-zinc-400"
                            }`}
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
