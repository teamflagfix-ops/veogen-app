"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Upload, Sparkles, Download, Zap } from "lucide-react";

type Step = "idle" | "upload" | "processing" | "output";

export function WorkflowDemo() {
    const [step, setStep] = useState<Step>("idle");

    useEffect(() => {
        const sequence = async () => {
            setStep("upload");
            await new Promise((r) => setTimeout(r, 2000));
            setStep("processing");
            await new Promise((r) => setTimeout(r, 2500));
            setStep("output");
            await new Promise((r) => setTimeout(r, 2000));
            setStep("idle");
            await new Promise((r) => setTimeout(r, 1500));
        };
        sequence();
        const interval = setInterval(sequence, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {/* Idle State */}
                        {step === "idle" && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="p-4 rounded-full bg-violet-500/10"
                                >
                                    <Sparkles className="w-8 h-8 text-violet-500" />
                                </motion.div>
                                <p className="text-sm text-zinc-400">Ready to create</p>
                            </motion.div>
                        )}

                        {/* Upload Step */}
                        {step === "upload" && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6 w-full h-full justify-center px-8"
                            >
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="p-6 rounded-xl bg-violet-500/10 border border-violet-500/30"
                                >
                                    <Upload className="w-12 h-12 text-violet-500" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="text-center"
                                >
                                    <div className="text-sm font-semibold mb-1">Step 1: Upload Product</div>
                                    <div className="text-xs text-zinc-400">Your image is being analyzed</div>
                                </motion.div>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: "80px" }}
                                    transition={{ duration: 2, ease: "easeIn" }}
                                />
                            </motion.div>
                        )}

                        {/* Processing Step */}
                        {step === "processing" && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6 w-full h-full justify-center px-8 relative"
                            >
                                {/* Animated particles */}
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full bg-violet-500"
                                        initial={{
                                            x: 0,
                                            y: 0,
                                            opacity: 1,
                                            scale: 1
                                        }}
                                        animate={{
                                            x: Math.cos((i / 6) * Math.PI * 2) * 80,
                                            y: Math.sin((i / 6) * Math.PI * 2) * 80,
                                            opacity: [1, 1, 0],
                                            scale: [1, 0.8, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: (i / 6) * 0.3,
                                        }}
                                    />
                                ))}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="p-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                >
                                    <Zap className="w-12 h-12 text-white" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="text-center"
                                >
                                    <div className="text-sm font-semibold mb-1">Step 2: AI Processing</div>
                                    <div className="text-xs text-zinc-400">Generating video in 4K</div>
                                </motion.div>
                                {/* Progress bar */}
                                <motion.div
                                    className="h-1 bg-zinc-700 rounded-full overflow-hidden w-32"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2.5, ease: "easeInOut" }}
                                    />
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Output Step */}
                        {step === "output" && (
                            <motion.div
                                key="output"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6 w-full h-full justify-center px-8"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.6, type: "spring" }}
                                    className="p-6 rounded-xl bg-green-500/10 border border-green-500/30"
                                >
                                    <Download className="w-12 h-12 text-green-400" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="text-center"
                                >
                                    <div className="text-sm font-semibold mb-1">Step 3: Download</div>
                                    <div className="text-xs text-zinc-400">4K Video Ready • No Watermarks</div>
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="flex gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/30"
                                >
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                        ✓
                                    </motion.div>
                                    Ready to use
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Steps indicator */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center justify-center gap-4 mt-8"
            >
                {[
                    { label: "Upload", icon: Upload },
                    { label: "Process", icon: Zap },
                    { label: "Download", icon: Download },
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                        <div
                            className={`p-2 rounded-full transition-all ${step === "idle"
                                    ? "bg-zinc-800 text-zinc-500"
                                    : step === "upload" && idx === 0
                                        ? "bg-violet-500 text-white"
                                        : step === "processing" && idx === 1
                                            ? "bg-violet-500 text-white"
                                            : step === "output" && idx === 2
                                                ? "bg-green-500 text-white"
                                                : idx < (step === "processing" ? 2 : step === "output" ? 3 : 1)
                                                    ? "bg-violet-500/50 text-white"
                                                    : "bg-zinc-800 text-zinc-500"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                        </div>
                        {idx < 2 && (
                            <div className="w-8 h-0.5 bg-zinc-700 rounded-full" />
                        )}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
