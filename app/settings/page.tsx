"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, User, Bell, CreditCard, Shield, LogOut } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
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
                            Create <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600/8 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-600/8 blur-[140px] rounded-full" />
            </div>

            <div className="relative z-10 pt-28 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
                        <p className="text-zinc-400">Manage your account and preferences</p>
                    </motion.div>

                    {/* Settings Sections */}
                    <div className="space-y-6">
                        {/* Profile Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-violet-500/10">
                                    <User className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Profile</h2>
                                    <p className="text-sm text-zinc-400">Your personal information</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Subscription Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-violet-500/10">
                                    <CreditCard className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Subscription</h2>
                                    <p className="text-sm text-zinc-400">Manage your plan</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                                <div>
                                    <p className="font-semibold">Free Trial</p>
                                    <p className="text-sm text-zinc-400">3 videos remaining</p>
                                </div>
                                <Link href="/pricing">
                                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:from-violet-500 hover:to-fuchsia-500 transition-all">
                                        Upgrade
                                    </button>
                                </Link>
                            </div>
                            <Link href="/pricing" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                                View all plans →
                            </Link>
                        </motion.div>

                        {/* Notifications Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-violet-500/10">
                                    <Bell className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Notifications</h2>
                                    <p className="text-sm text-zinc-400">Email preferences</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm">Video completion alerts</span>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-violet-600 transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                    </div>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm">Product updates</span>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-violet-600 transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                    </div>
                                </label>
                            </div>
                        </motion.div>

                        {/* Security Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-violet-500/10">
                                    <Shield className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Security</h2>
                                    <p className="text-sm text-zinc-400">Password and authentication</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">
                                Change Password
                            </button>
                        </motion.div>

                        {/* Danger Zone */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-red-500/10">
                                    <LogOut className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Danger Zone</h2>
                                    <p className="text-sm text-zinc-400">Irreversible actions</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                                Delete Account
                            </button>
                        </motion.div>
                    </div>

                    {/* Save Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="mt-8"
                    >
                        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/25 transition-all">
                            Save Changes
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
