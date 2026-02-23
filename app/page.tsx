"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Camera, Waves, TrendingUp, Check, Star, Flame } from "lucide-react";
import Link from "next/link";
import { WorkflowDemo } from "@/components/WorkflowDemo";
import { HeroDemo } from "@/components/HeroDemo";

export default function Landing() {
    const features = [
        {
            icon: Camera,
            title: "🎯 Sales Hooks",
            description: "Attention-grabbing intros",
            color: "from-orange-500 to-red-500"
        },
        {
            icon: Waves,
            title: "🎙️ AI Voice",
            description: "4 professional voices",
            color: "from-violet-500 to-purple-500"
        },
        {
            icon: Sparkles,
            title: "✨ Text Overlays",
            description: "Auto-generated captions",
            color: "from-cyan-500 to-blue-500"
        },
        {
            icon: TrendingUp,
            title: "🚀 Ready to Post",
            description: "Hashtags included",
            color: "from-green-500 to-emerald-500"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Zap className="w-7 h-7" style={{ fill: 'url(#logoGradient)', stroke: 'none' }} />
                        <span className="font-semibold text-2xl tracking-tight" style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #d946ef 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>VeoGen</span>
                        {/* SVG Gradient Definition */}
                        <svg width="0" height="0">
                            <defs>
                                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="50%" stopColor="#c084fc" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </Link>
                    <div className="flex items-center gap-6">
                        <a href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            Pricing
                        </a>
                        <Link href="/create">
                            <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold px-6 py-2.5 flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25">
                                Start Free <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-violet-600/10 blur-[160px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-fuchsia-600/10 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/5 blur-[180px] rounded-full" />
                <div
                    className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="min-h-screen flex items-center justify-center pt-32 pb-20 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left: Text content */}
                            <div className="text-center lg:text-left">
                                {/* Main Headline */}
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8"
                                >
                                    Turn Any Product Into a{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                                        Selling
                                    </span>{" "}
                                    TikTok
                                </motion.h1>

                                {/* Subheadline */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.1 }}
                                    className="text-lg md:text-2xl text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-10"
                                >
                                    Built for TikTok Shop & affiliate sellers. No filming. No editing.
                                </motion.p>

                                {/* Primary CTA */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="flex flex-col items-center lg:items-start gap-4"
                                >
                                    <Link href="/create">
                                        <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl px-10 h-14 text-lg font-bold shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:scale-105 transition-all flex items-center gap-3">
                                            Generate My First TikTok <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </Link>
                                    <p className="text-sm text-zinc-500">
                                        3 free TikToks • No watermark • Cancel anytime
                                    </p>
                                </motion.div>
                            </div>

                            {/* Right: Animated Demo */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="hidden lg:block"
                            >
                                <HeroDemo />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Social Proof Bar */}
                <section className="py-6 border-y border-white/5 bg-white/[0.02]">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-2"
                            >
                                <Check className="w-5 h-5 text-green-400" />
                                <span className="text-zinc-300 font-semibold">No Watermark</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-2"
                            >
                                <Sparkles className="w-5 h-5 text-violet-400" />
                                <span className="text-zinc-300 font-semibold">1 Free Video</span>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Workflow Demo Section */}
                <section className="py-24 md:py-32 border-t border-white/5">
                    <div className="max-w-5xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                                From Product → TikTok Automatically
                            </h2>
                            <p className="text-zinc-400 text-xl">Paste a product image, title, and price.<br />Get a TikTok video with voiceover, text, and captions — ready to post.</p>
                        </motion.div>
                        <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] shadow-2xl">
                            <WorkflowDemo />
                        </div>
                        <p className="text-center text-zinc-500 text-sm mt-6">This is the exact format working on TikTok right now.</p>
                    </div>
                </section>

                {/* Problem → Solution Section */}
                <section className="py-24 md:py-32 border-t border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                                Still Editing Videos <span className="text-red-400">Manually?</span>
                            </h2>
                            <p className="text-zinc-400 text-xl">Every hour you spend editing is an hour you&apos;re not posting.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Old Way */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5"
                            >
                                <div className="text-red-400 text-sm font-bold mb-4 uppercase tracking-wider">❌ The Old Way</div>
                                <ul className="space-y-4 text-zinc-400">
                                    <li className="flex items-center gap-3"><span className="text-red-400">→</span> Film product footage</li>
                                    <li className="flex items-center gap-3"><span className="text-red-400">→</span> Edit in CapCut</li>
                                    <li className="flex items-center gap-3"><span className="text-red-400">→</span> Record voiceover</li>
                                    <li className="flex items-center gap-3"><span className="text-red-400">→</span> Add text overlays</li>
                                    <li className="flex items-center gap-3"><span className="text-red-400">→</span> Export & upload</li>
                                </ul>
                                <div className="mt-6 pt-6 border-t border-red-500/20">
                                    <span className="text-3xl font-bold text-red-400">2+ hours</span>
                                    <span className="text-zinc-500 ml-2">per video</span>
                                </div>
                            </motion.div>

                            {/* VeoGen Way */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl border border-green-500/20 bg-green-500/5"
                            >
                                <div className="text-green-400 text-sm font-bold mb-4 uppercase tracking-wider">✅ With VeoGen</div>
                                <ul className="space-y-4 text-zinc-300">
                                    <li className="flex items-center gap-3"><span className="text-green-400">→</span> Upload product image</li>
                                    <li className="flex items-center gap-3"><span className="text-green-400">→</span> Add title & price</li>
                                    <li className="flex items-center gap-3"><span className="text-green-400">→</span> Click generate</li>
                                    <li className="flex items-center gap-3"><span className="text-green-400">→</span> Download & post</li>
                                    <li className="flex items-center gap-3 text-zinc-500"><span className="text-zinc-600">→</span> That&apos;s it</li>
                                </ul>
                                <div className="mt-6 pt-6 border-t border-green-500/20">
                                    <span className="text-3xl font-bold text-green-400">2 minutes</span>
                                    <span className="text-zinc-500 ml-2">per video</span>
                                </div>
                            </motion.div>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center text-violet-400 font-semibold text-lg mt-12"
                        >
                            10x your posting volume without 10x the work.
                        </motion.p>
                    </div>
                </section>

                {/* Why VeoGen Works Section - Focus on time savings */}
                <section className="py-24 md:py-32 bg-gradient-to-b from-violet-500/[0.05] to-transparent">
                    <div className="max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                                More Posts = <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">More Sales</span>
                            </h2>
                            <p className="text-zinc-400 text-xl">The math is simple</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "Per Video", value: "2 min", sublabel: "vs 2 hours manual", icon: "⚡" },
                                { label: "Daily Output", value: "10+", sublabel: "Videos possible", icon: "📈" },
                                { label: "Hours Saved", value: "20+", sublabel: "Per week", icon: "⏰" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="text-3xl mb-3">{stat.icon}</div>
                                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-white font-semibold text-lg">{stat.label}</div>
                                    <div className="text-zinc-500 text-sm">{stat.sublabel}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 md:py-28 bg-violet-500/[0.02]">
                    <div className="max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                                Everything You Need
                            </h2>
                            <p className="text-zinc-400 text-lg">
                                Pro scripts. Pro voice. Pro results.
                            </p>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    viewport={{ once: true }}
                                    className="p-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group text-center"
                                >
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} w-fit mx-auto mb-4 group-hover:scale-110 transition-all shadow-lg`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-bold mb-2 text-lg">{feature.title}</h3>
                                    <p className="text-zinc-400 text-sm">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Video Examples Section */}
                <section className="py-24 md:py-32 border-t border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                                See What VeoGen Creates
                            </h2>
                            <p className="text-zinc-400 text-xl">Real examples from real products</p>
                        </motion.div>

                        {/* Phone Mockups - Placeholders for user videos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { category: "Kitchen", emoji: "🍳" },
                                { category: "Beauty", emoji: "💄" },
                                { category: "Tech", emoji: "📱" },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.15 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center"
                                >
                                    {/* Phone Frame */}
                                    <div className="relative w-[220px] h-[440px] rounded-[3rem] border-4 border-zinc-700 bg-zinc-900 overflow-hidden shadow-2xl">
                                        {/* Video placeholder */}
                                        <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                            <div className="text-6xl">{item.emoji}</div>
                                        </div>
                                        {/* Play button overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all">
                                                <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-zinc-400 font-medium">{item.category} Product</p>
                                </motion.div>
                            ))}
                        </div>

                        <p className="text-center text-zinc-500 text-sm mt-10">
                            Your videos will have your product, your price, and your promo
                        </p>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 md:py-32 bg-gradient-to-b from-transparent to-violet-500/[0.03]">
                    <div className="max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                                Sellers Love VeoGen
                            </h2>
                            <p className="text-zinc-400 text-xl">Join thousands of TikTok Shop sellers</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "I used to spend 3 hours on each video. Now I post 10+ a day. My sales literally 5x'd in a month.",
                                    name: "Sarah M.",
                                    role: "TikTok Shop Seller",
                                    emoji: "👩‍💼"
                                },
                                {
                                    quote: "Finally I can test multiple products without burning out on content creation. Game changer for affiliates.",
                                    name: "Marcus T.",
                                    role: "Amazon Affiliate",
                                    emoji: "👨‍💻"
                                },
                                {
                                    quote: "The voiceovers sound way better than I expected. My audience thinks I hired a voice actor.",
                                    name: "Jessica L.",
                                    role: "Dropshipper",
                                    emoji: "👩‍🎤"
                                },
                            ].map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]"
                                >
                                    <div className="flex items-center gap-1 text-yellow-400 mb-4">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                    </div>
                                    <p className="text-zinc-300 mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl">
                                            {testimonial.emoji}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{testimonial.name}</div>
                                            <div className="text-zinc-500 text-sm">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 md:py-32 bg-violet-500/[0.02]">
                    <div className="max-w-5xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                                Simple Pricing
                            </h2>
                            <p className="text-zinc-400 text-xl">No long-term contracts. Cancel anytime.</p>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: "Starter",
                                    subtitle: "For Testing Products",
                                    videos: "20 videos/month",
                                    price: "$29",
                                    priceNote: "/month",
                                    perVideo: "≈ $1.45 per video",
                                    features: ["Unused videos roll over (max 40)", "Commercial rights"],
                                    cta: "Start Testing"
                                },
                                {
                                    name: "Creator",
                                    subtitle: "For Daily Posting",
                                    videos: "100 videos/month",
                                    price: "$89",
                                    priceNote: "/month",
                                    perVideo: "≈ $0.89 per video",
                                    featured: true,
                                    features: ["⚡ Priority processing", "Unused videos roll over (max 200)"],
                                    cta: "Start Scaling"
                                },
                                {
                                    name: "Agency",
                                    subtitle: "For High Volume",
                                    videos: "Volume pricing",
                                    price: "Custom",
                                    priceNote: "",
                                    perVideo: "",
                                    features: ["API access", "White-label options", "Dedicated support"],
                                    cta: "Contact Sales"
                                },
                            ].map((plan, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    viewport={{ once: true }}
                                    className={`p-10 rounded-3xl border transition-all relative text-center ${plan.featured
                                        ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_60px_rgba(139,92,246,0.15)]"
                                        : "border-white/[0.08] bg-white/[0.02]"
                                        }`}
                                >
                                    {plan.featured && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold rounded-full">
                                            Best Value
                                        </div>
                                    )}
                                    <h3 className="font-bold text-2xl mb-1">{plan.name}</h3>
                                    <p className="text-zinc-500 text-sm mb-6">{plan.subtitle}</p>
                                    <div className="mb-2">
                                        <span className="text-5xl font-bold">{plan.price}</span>
                                        <span className="text-zinc-400 text-lg">{plan.priceNote}</span>
                                    </div>
                                    <p className="text-lg font-bold text-violet-400 mb-2">{plan.videos}</p>
                                    {plan.perVideo && (
                                        <p className="text-sm text-green-400 mb-4">{plan.perVideo}</p>
                                    )}
                                    <ul className="text-sm text-zinc-400 mb-8 space-y-2">
                                        {plan.features.map((f, i) => <li key={i}>• {f}</li>)}
                                    </ul>
                                    <Link href="/create" className="block">
                                        <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${plan.featured
                                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                                            : "border border-white/10 hover:border-white/20 text-white hover:bg-white/5"
                                            }`}>
                                            {plan.cta}
                                        </button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                        <p className="text-center text-zinc-500 mt-10 text-lg">One video that hits usually pays for everything.</p>
                    </div>
                </section>

                {/* Footer with final CTA */}
                <footer className="pt-32 pb-20 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-32">
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6">
                                Stop Editing.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Start Posting.</span>
                            </h2>
                            <p className="text-zinc-400 text-xl mb-10">1 free video • No risk</p>
                            <Link href="/create">
                                <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl px-14 h-20 text-2xl font-bold shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:scale-105 transition-all flex items-center gap-4 mx-auto">
                                    Generate Your First TikTok <ArrowRight className="w-8 h-8" />
                                </button>
                            </Link>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-12 gap-8">
                            <div className="flex items-center gap-2">
                                <Zap className="w-6 h-6" style={{ fill: 'url(#footerLogoGradient)', stroke: 'none' }} />
                                <span className="font-semibold text-xl" style={{
                                    background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #d946ef 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>VeoGen</span>
                                <svg width="0" height="0">
                                    <defs>
                                        <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#a855f7" />
                                            <stop offset="50%" stopColor="#c084fc" />
                                            <stop offset="100%" stopColor="#d946ef" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-500 font-medium">
                                © 2025 VeoGen. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
