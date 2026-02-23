"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Video, Settings, Plus, X } from "lucide-react";
import styles from "./page.module.css";

// Voice options - 4 strategic TikTok voices (mapped from OpenAI)
const VOICE_OPTIONS = {
    nova: { name: "Viral / Energetic", style: "Fast, TikTok native", emoji: "⚡", best: "Kitchen, Gadgets, Toys" },
    shimmer: { name: "Beauty / Soft", style: "Warm, breathy, trustworthy", emoji: "💄", best: "Bathroom, Skincare, Decor" },
    onyx: { name: "Deep / Bold", style: "Masculine, authoritative", emoji: "🎙️", best: "Gym, Garage, Tech" },
    alloy: { name: "Professional", style: "Clear, gender-neutral", emoji: "🏢", best: "Office, Digital Products" },
};

// Promo preset options - each type has different input needs
const PROMO_PRESETS = [
    { id: "percent_off", label: "🏷️ % OFF", inputType: "percent", template: "{value}% OFF" },
    { id: "bogo", label: "🎁 Buy X Get X", inputType: "bogo", template: "BUY {buy} GET {get}" },
    { id: "ends_date", label: "⏰ Ends ___", inputType: "date", template: "ENDS {date}!" },
    { id: "limited", label: "🔥 Limited Stock", inputType: "none", discount: "", urgency: "LIMITED STOCK!" },
    { id: "restocked", label: "📦 Just Restocked", inputType: "none", discount: "", urgency: "JUST RESTOCKED!" },
    { id: "free_ship", label: "🚚 Free Shipping", inputType: "none", discount: "FREE SHIPPING", urgency: "" },
    { id: "ships_tomorrow", label: "📬 Ships Tomorrow", inputType: "none", discount: "", urgency: "SHIPS TOMORROW!" },
    { id: "custom", label: "✏️ Custom", inputType: "custom", discount: "", urgency: "" },
];

// Animated typing examples for promo hint
const PROMO_EXAMPLES = ["50% OFF", "ENDS TODAY", "BUY 1 GET 1", "FREE SHIP"];

// Product categories - determines AI background style
const CATEGORIES = {
    kitchen: { name: "Kitchen", emoji: "🍳" },
    living_room: { name: "Living Room", emoji: "🛋️" },
    office: { name: "Office", emoji: "💻" },
    outdoor: { name: "Outdoor", emoji: "🌳" },
    gym: { name: "Gym", emoji: "💪" },
    garage: { name: "Garage/Workbench", emoji: "🔧" },
    bathroom: { name: "Bathroom", emoji: "🛁" },
};

export default function CreatePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        price: "", // Optional
        discount: "", // e.g., "50% OFF"
        urgency: "", // e.g., "ENDS TODAY"
        voice: "nova", // Default: Viral/Energetic
        category: "",
    });

    const [promoExpanded, setPromoExpanded] = useState(false); // Show/hide promo fields
    const [selectedPromos, setSelectedPromos] = useState<string[]>([]); // Multiple selected promos
    const [typingText, setTypingText] = useState(""); // For typing animation
    const [promoHintIndex, setPromoHintIndex] = useState(0);

    // Promo input values
    const [percentValue, setPercentValue] = useState("");
    const [bogoValues, setBogoValues] = useState({ buy: "1", get: "1" });
    const [endsDate, setEndsDate] = useState("");
    const [customDiscount, setCustomDiscount] = useState(""); // Custom promo text

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [error, setError] = useState("");
    const [testMode, setTestMode] = useState(false);
    // AI Scene toggle removed - always use composite approach
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<{ id: string; url: string } | null>(null);

    // Test placement state
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        originalUrl: string;
        results: Array<{ id: string; name: string; previewUrl: string; fullUrl: string; success: boolean }>;
    } | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Typing animation effect - type and delete
    useEffect(() => {
        if (promoExpanded) return;

        const currentWord = PROMO_EXAMPLES[promoHintIndex];
        let charIndex = 0;
        let isDeleting = false;

        const typeInterval = setInterval(() => {
            if (!isDeleting) {
                // Typing forward
                setTypingText(currentWord.substring(0, charIndex + 1));
                charIndex++;
                if (charIndex >= currentWord.length) {
                    isDeleting = true;
                    // Pause before deleting
                    setTimeout(() => { }, 1000);
                }
            } else {
                // Deleting
                setTypingText(currentWord.substring(0, charIndex - 1));
                charIndex--;
                if (charIndex <= 0) {
                    isDeleting = false;
                    setPromoHintIndex((prev) => (prev + 1) % PROMO_EXAMPLES.length);
                    clearInterval(typeInterval);
                }
            }
        }, isDeleting ? 50 : 100);

        return () => clearInterval(typeInterval);
    }, [promoExpanded, promoHintIndex]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!imageFile) {
            setError("Please upload a product image");
            return;
        }

        if (!formData.category) {
            setError("Please select a product category");
            return;
        }

        if (!formData.title) {
            setError("Please fill in at least the product title");
            return;
        }

        setIsGenerating(true);
        setProgress(0);

        try {
            const progressSteps = [
                { progress: 5, text: "Analyzing product..." },
                { progress: 12, text: "Enhancing image with AI scene..." },
                { progress: 25, text: "Writing TikTok-style script..." },
                { progress: 35, text: "Generating HD voiceover..." },
                { progress: 50, text: "Creating 10-sec AI video..." },
                { progress: 70, text: "Adding cinematic effects..." },
                { progress: 85, text: "Burning text overlays..." },
                { progress: 95, text: "Finalizing..." },
            ];

            let stepIndex = 0;
            const progressInterval = setInterval(() => {
                if (stepIndex < progressSteps.length) {
                    setProgress(progressSteps[stepIndex].progress);
                    setProgressText(progressSteps[stepIndex].text);
                    stepIndex++;
                }
            }, 3000);

            const submitData = new FormData();
            submitData.append("image", imageFile);
            submitData.append("title", formData.title);
            submitData.append("price", formData.price || ""); // Optional
            submitData.append("discount", formData.discount || ""); // e.g., "50% OFF"
            submitData.append("urgencyText", formData.urgency || ""); // e.g., "ENDS TODAY"
            submitData.append("category", formData.category);
            submitData.append("voice", formData.voice);
            submitData.append("testMode", testMode.toString());
            submitData.append("useAIScene", "false"); // Always use composite approach (AI scene removed)

            const response = await fetch("/api/generate", {
                method: "POST",
                body: submitData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Generation failed");
            }

            const result = await response.json();
            setProgress(100);
            setProgressText("Complete!");

            // Show video inline in studio
            setGeneratedVideo({
                id: result.id,
                url: `/output/${result.id}/final.mp4`
            });
            setIsGenerating(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setIsGenerating(false);
            setProgress(0);
        }
    };

    // Quick test placement - tests all backgrounds for selected category
    const handleTestPlacement = async () => {
        if (!imageFile) {
            setError("Please upload an image first");
            return;
        }
        if (!formData.category) {
            setError("Please select a category first");
            return;
        }

        setIsTesting(true);
        setError("");
        setTestResult(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("image", imageFile);
            formDataToSend.append("category", formData.category);

            const response = await fetch("/api/test-placement", {
                method: "POST",
                body: formDataToSend,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Test failed");
            }

            // Store all results
            setTestResult({
                originalUrl: result.originalUrl,
                results: result.results,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Test failed");
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <Link href="/" className={styles.logo}>
                        <Zap className="w-6 h-6" style={{ fill: 'url(#sidebarLogoGradient)', stroke: 'none' }} />
                        <span style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #d946ef 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            letterSpacing: '-0.02em'
                        }}>VeoGen</span>
                        <svg width="0" height="0">
                            <defs>
                                <linearGradient id="sidebarLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="50%" stopColor="#c084fc" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </Link>
                    <nav className={styles.sidebarNav}>
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className={`${styles.navItem} ${!settingsOpen ? styles.active : ''}`}
                            style={{ cursor: "pointer", background: "transparent", border: "none", textAlign: "left", width: "100%" }}
                        >
                            <Video className="w-5 h-5" />
                            <span>Create</span>
                        </button>
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className={`${styles.navItem} ${settingsOpen ? styles.active : ''}`}
                            style={{ cursor: "pointer", background: "transparent", border: "none", textAlign: "left", width: "100%" }}
                        >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </button>
                    </nav>
                </div>
                <div className={styles.sidebarBottom}>
                    <div className={styles.credits}>
                        <div className={styles.creditsHeader}>
                            <span>Videos Left</span>
                            <span className={styles.creditsAmount}>3</span>
                        </div>
                        <div className={styles.creditsBar}>
                            <div className={styles.creditsBarFill} style={{ width: "100%" }}></div>
                        </div>
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>U</div>
                        <span>Free Trial</span>
                    </div>
                </div>
            </aside>

            {/* Purple Background with Grain - Static */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-violet-600/15 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/12 blur-[140px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-800/8 blur-[180px] rounded-full" />
                <div
                    className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.mainContent}>
                    {/* Header */}
                    <header className={styles.header}>
                        <h1>Generate Your TikTok</h1>
                        <p>Turn any product into a ready-to-post TikTok in under 2 minutes</p>
                    </header>

                    {/* Upload Area */}
                    <div
                        className={`${styles.uploadArea} ${imagePreview ? styles.hasImage : ""}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className={styles.hiddenInput}
                        />
                        {imagePreview ? (
                            <div className={styles.previewContainer}>
                                <img src={imagePreview} alt="Preview" className={styles.previewImage} />
                                <div className={styles.previewOverlay}>
                                    <span>Click to change</span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.uploadContent}>
                                <div className={styles.uploadIcon}>📸</div>
                                <h3>Drop your product image here</h3>
                                <p>or click to browse</p>
                                <span className={styles.uploadHint}>✨ Just the product in the photo works best</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Suggestions */}
                    <div className={styles.suggestions}>
                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                            <button
                                key={key}
                                className={`${styles.suggestionPill} ${formData.category === key ? styles.active : ""}`}
                                onClick={() => setFormData({ ...formData, category: key })}
                            >
                                {cat.emoji} {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Premium Wireless Headphones"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Price <span className={styles.optionalLabel}>(optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="$49.99"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>

                            {/* Always Visible Promo Section */}
                            <div className={styles.promoSectionAlways}>
                                {/* Count overlays: name (if filled) + price (if filled) + promos */}
                                {(() => {
                                    const overlayCount = (formData.title ? 1 : 0) + (formData.price ? 1 : 0) + selectedPromos.length;
                                    const remaining = 4 - overlayCount;
                                    return (
                                        <label>💰 Sale / Promo <span className={styles.optionalLabel}>
                                            ({remaining} of 4 slots remaining)
                                        </span></label>
                                    );
                                })()}

                                {/* Promo Preset Pills */}
                                <div className={styles.promoPills}>
                                    {PROMO_PRESETS.map((preset) => {
                                        const overlayCount = (formData.title ? 1 : 0) + (formData.price ? 1 : 0) + selectedPromos.length;
                                        const isSelected = selectedPromos.includes(preset.id);
                                        const atLimit = overlayCount >= 4 && !isSelected;

                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                className={`${styles.promoPill} ${isSelected ? styles.active : ""} ${atLimit ? styles.disabled : ""}`}
                                                disabled={atLimit}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        // Remove from selection and remove that specific text
                                                        const newPromos = selectedPromos.filter(p => p !== preset.id);
                                                        setSelectedPromos(newPromos);

                                                        // Remove this preset's text from discount/urgency
                                                        let newDiscount = formData.discount;
                                                        let newUrgency = formData.urgency;

                                                        if (preset.discount) {
                                                            newDiscount = newDiscount.replace(new RegExp(`\\s*\\|?\\s*${preset.discount}`, 'g'), '').replace(/^\s*\|\s*/, '').trim();
                                                        }
                                                        if (preset.urgency) {
                                                            newUrgency = newUrgency.replace(new RegExp(`\\s*\\|?\\s*${preset.urgency}`, 'g'), '').replace(/^\s*\|\s*/, '').trim();
                                                        }

                                                        setFormData({ ...formData, discount: newDiscount, urgency: newUrgency });
                                                    } else if (!atLimit) {
                                                        // Add to selection - only add if not already present
                                                        const newPromos = [...selectedPromos, preset.id];
                                                        setSelectedPromos(newPromos);
                                                        if (preset.inputType === "none") {
                                                            let newDiscount = formData.discount;
                                                            let newUrgency = formData.urgency;

                                                            // Only add if not already present
                                                            if (preset.discount && !newDiscount.includes(preset.discount)) {
                                                                newDiscount = newDiscount ? `${newDiscount} | ${preset.discount}` : preset.discount;
                                                            }
                                                            if (preset.urgency && !newUrgency.includes(preset.urgency)) {
                                                                newUrgency = newUrgency ? `${newUrgency} | ${preset.urgency}` : preset.urgency;
                                                            }

                                                            setFormData({ ...formData, discount: newDiscount, urgency: newUrgency });
                                                        }
                                                    }
                                                }}
                                            >
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Animated Input Fields */}
                                <div className={`${styles.promoInputsWrapper} ${selectedPromos.some(p => ["percent_off", "bogo", "ends_date", "custom"].includes(p)) ? styles.expanded : ""}`}>
                                    {selectedPromos.includes("percent_off") && (
                                        <div className={styles.promoInputRow}>
                                            <input
                                                type="number"
                                                placeholder="50"
                                                value={percentValue}
                                                onChange={(e) => {
                                                    setPercentValue(e.target.value);
                                                    const existingDiscount = formData.discount.replace(/\d+% OFF\s*\|?\s*/g, '').trim();
                                                    const newDiscount = `${e.target.value}% OFF${existingDiscount ? ` | ${existingDiscount}` : ''}`;
                                                    setFormData({ ...formData, discount: newDiscount });
                                                }}
                                                className={styles.promoInput}
                                            />
                                            <span className={styles.promoInputLabel}>% OFF</span>
                                        </div>
                                    )}

                                    {selectedPromos.includes("bogo") && (
                                        <div className={styles.promoInputRow}>
                                            <span className={styles.promoInputLabel}>BUY</span>
                                            <input
                                                type="number"
                                                value={bogoValues.buy}
                                                onChange={(e) => {
                                                    const newBogo = { ...bogoValues, buy: e.target.value };
                                                    setBogoValues(newBogo);
                                                    const bogoText = `BUY ${newBogo.buy} GET ${newBogo.get} FREE`;
                                                    const existingDiscount = formData.discount.replace(/BUY \d+ GET \d+ FREE\s*\|?\s*/g, '').trim();
                                                    setFormData({ ...formData, discount: existingDiscount ? `${bogoText} | ${existingDiscount}` : bogoText });
                                                }}
                                                className={styles.promoInputSmall}
                                                min="1"
                                            />
                                            <span className={styles.promoInputLabel}>GET</span>
                                            <input
                                                type="number"
                                                value={bogoValues.get}
                                                onChange={(e) => {
                                                    const newBogo = { ...bogoValues, get: e.target.value };
                                                    setBogoValues(newBogo);
                                                    const bogoText = `BUY ${newBogo.buy} GET ${newBogo.get} FREE`;
                                                    const existingDiscount = formData.discount.replace(/BUY \d+ GET \d+ FREE\s*\|?\s*/g, '').trim();
                                                    setFormData({ ...formData, discount: existingDiscount ? `${bogoText} | ${existingDiscount}` : bogoText });
                                                }}
                                                className={styles.promoInputSmall}
                                                min="1"
                                            />
                                            <span className={styles.promoInputLabel}>FREE</span>
                                        </div>
                                    )}

                                    {selectedPromos.includes("ends_date") && (
                                        <div className={styles.promoInputRow}>
                                            <span className={styles.promoInputLabel}>ENDS</span>
                                            <input
                                                type="text"
                                                placeholder="TODAY, TOMORROW, JAN 15..."
                                                value={endsDate}
                                                onChange={(e) => {
                                                    setEndsDate(e.target.value);
                                                    const endsText = `ENDS ${e.target.value.toUpperCase()}!`;
                                                    const existingUrgency = formData.urgency.replace(/ENDS [^|]+!\s*\|?\s*/g, '').trim();
                                                    setFormData({ ...formData, urgency: existingUrgency ? `${endsText} | ${existingUrgency}` : endsText });
                                                }}
                                                className={styles.promoInput}
                                            />
                                        </div>
                                    )}

                                    {selectedPromos.includes("custom") && (
                                        <div className={styles.promoInputRow}>
                                            <input
                                                type="text"
                                                placeholder="TRIPLE DISCOUNT, FLASH SALE, etc."
                                                value={customDiscount}
                                                onChange={(e) => {
                                                    const value = e.target.value.toUpperCase();
                                                    setCustomDiscount(value);
                                                    // Update formData with custom value
                                                    const otherDiscounts = formData.discount.replace(/^[^|]*\|?\s*/, '').trim();
                                                    setFormData({ ...formData, discount: otherDiscounts ? `${value} | ${otherDiscounts}` : value });
                                                }}
                                                className={styles.promoInput}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.voiceSection}>
                                <label>Voice Style</label>
                                <div className={styles.voiceGrid}>
                                    {Object.entries(VOICE_OPTIONS).map(([key, voice]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`${styles.voiceCard} ${formData.voice === key ? styles.active : ""}`}
                                            onClick={() => setFormData({ ...formData, voice: key })}
                                        >
                                            <span className={styles.voiceEmoji}>{voice.emoji}</span>
                                            <span className={styles.voiceName}>{voice.name}</span>
                                            <span className={styles.voiceStyle}>{voice.style}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Test Mode Toggle */}
                            <div className={styles.testMode}>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={testMode}
                                        onChange={(e) => setTestMode(e.target.checked)}
                                    />
                                    <span className={styles.toggleSlider}></span>
                                    <span className={styles.toggleLabel}>Test Mode (skip video API)</span>
                                </label>
                            </div>



                            {error && <div className={styles.error}>{error}</div>}

                            {/* Button Row */}
                            <div className={styles.buttonRow}>
                                {/* Test Placement Button */}
                                <button
                                    type="button"
                                    className={styles.testBtn}
                                    onClick={handleTestPlacement}
                                    disabled={isTesting || !imageFile || !formData.category}
                                >
                                    {isTesting ? (
                                        <>
                                            <div className={styles.spinner}></div>
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            🖼️ Test Photo
                                        </>
                                    )}
                                </button>

                                {/* Generate Button */}
                                <button
                                    type="submit"
                                    className={styles.generateBtn}
                                    disabled={isGenerating || !imageFile}
                                >
                                    {isGenerating ? (
                                        <div className={styles.generating}>
                                            <div className={styles.spinner}></div>
                                            <span>{progressText || "Generating..."}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className={styles.btnIcon}>⚡</span>
                                            Generate TikTok
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Progress Bar */}
                            {isGenerating && (
                                <div className={styles.progressContainer}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <span className={styles.progressText}>{progress}%</span>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Test Placement Results - 5 Scene Previews */}
                    {testResult && (
                        <section className={styles.testResultsSection}>
                            <h3>📸 Scene Previews - Click to Zoom (9:16 Exact Frame)</h3>
                            <p className={styles.testResultsHint}>These are the EXACT images that will be sent to the video API</p>
                            <div className={styles.testResultsGrid}>
                                {testResult.results.map((result) => (
                                    <div
                                        key={result.id}
                                        className={styles.testResultCard}
                                        onClick={() => setZoomedImage(result.fullUrl)}
                                    >
                                        <img
                                            src={result.previewUrl}
                                            alt={result.name}
                                            className={styles.testResultImage}
                                        />
                                        <span className={styles.testResultLabel}>{result.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className={styles.clearTestBtn}
                                onClick={() => setTestResult(null)}
                            >
                                ✕ Clear Previews
                            </button>
                        </section>
                    )}

                    {/* Zoom Modal */}
                    {zoomedImage && (
                        <div className={styles.zoomModal} onClick={() => setZoomedImage(null)}>
                            <div className={styles.zoomContent}>
                                <img src={zoomedImage} alt="Full size preview" />
                                <button className={styles.zoomClose} onClick={() => setZoomedImage(null)}>
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Recent Generations / Generated Video */}
                    <section className={styles.recentSection}>
                        <h2>Your TikToks</h2>
                        {generatedVideo ? (
                            <div className={styles.videoResult}>
                                <video
                                    src={generatedVideo.url}
                                    controls
                                    autoPlay
                                    loop
                                    playsInline
                                    style={{
                                        width: "100%",
                                        maxWidth: "400px",
                                        borderRadius: "16px",
                                        aspectRatio: "9/16",
                                        background: "#000"
                                    }}
                                />
                                <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                                    <a
                                        href={generatedVideo.url}
                                        download={`tiktok_${generatedVideo.id}.mp4`}
                                        className={styles.primaryBtn}
                                        style={{ textDecoration: "none", padding: "12px 24px", borderRadius: "12px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", fontWeight: "bold" }}
                                    >
                                        ⬇️ Download
                                    </a>
                                    <button
                                        onClick={() => {
                                            setGeneratedVideo(null);
                                            setProgress(0);
                                            setProgressText("");
                                        }}
                                        style={{ padding: "12px 24px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", fontWeight: "bold", cursor: "pointer" }}
                                    >
                                        🔄 Generate Another
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.recentGrid}>
                                <div className={styles.recentPlaceholder}>
                                    <span>🎬</span>
                                    <p>Your TikToks will appear here</p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main >

            {/* Settings Panel - Takes Full Right Side */}
            {settingsOpen && (
                <div className="fixed inset-0 z-40 md:left-[260px] bg-[#0a0a0f]">
                    {/* Same background as studio */}
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-violet-600/15 blur-[140px] rounded-full animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/12 blur-[140px] rounded-full animate-pulse" />
                    </div>
                    {/* Panel Content */}
                    <div className="relative z-10 h-full overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Settings</h2>
                            <button
                                onClick={() => setSettingsOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Profile */}
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-zinc-400 mb-4">Profile</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subscription */}
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-zinc-400 mb-4">Subscription</h3>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
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
                        </div>

                        {/* Notifications */}
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-zinc-400 mb-4">Notifications</h3>
                            <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-sm">Video completion alerts</span>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-violet-600 transition-colors"></div>
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                </div>
                            </label>
                        </div>

                        {/* Save */}
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/25 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}
