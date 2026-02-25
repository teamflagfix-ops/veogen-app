"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";

// ===== MODEL PROVIDERS =====
const VIDEO_MODELS = [
    { id: "wan-2.1-i2v", name: "Wan 2.1", provider: "Replicate", cost: "~$0.05", quality: 3, speed: "Fast" },
    { id: "kling-v1.6-standard", name: "Kling V1.6", provider: "Replicate", cost: "~$0.10", quality: 4, speed: "Medium" },
    { id: "kling-v2-master", name: "Kling V2 Master", provider: "Replicate", cost: "~$0.30", quality: 5, speed: "Slow" },
    { id: "luma-ray2-flash", name: "Luma Ray2 Flash", provider: "Replicate", cost: "~$0.10", quality: 4, speed: "Fast" },
    { id: "minimax-video-01", name: "Minimax/Hailuo", provider: "Replicate", cost: "~$0.15", quality: 4, speed: "Medium" },
    { id: "google-veo-2", name: "Google Veo 2", provider: "Replicate", cost: "~$0.50", quality: 5, speed: "Slow" },
];

const LLM_MODELS = [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenRouter", cost: "$0.00015/1k", quality: 4 },
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenRouter", cost: "$0.0025/1k", quality: 5 },
    { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "OpenRouter", cost: "$0.0008/1k", quality: 4 },
    { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "OpenRouter", cost: "$0.0004/1k", quality: 3 },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "OpenRouter", cost: "$0.0001/1k", quality: 4 },
    { id: "deepseek-chat-v3", name: "DeepSeek V3", provider: "OpenRouter", cost: "$0.00014/1k", quality: 4 },
];

const SCRAPER_PROVIDERS = [
    { id: "scrape-creators", name: "Scrape Creators", cost: "100 free credits" },
    { id: "rapidapi-tiktok", name: "RapidAPI TikTok", cost: "50 req/mo free" },
    { id: "apify-tiktok", name: "Apify", cost: "Free trial" },
];

// ===== BLOCK DEFINITIONS =====
interface PortDef {
    id: string;
    label: string;
    color?: string;
}

interface BlockField {
    key: string;
    label: string;
    type: "text" | "select" | "textarea" | "image" | "model-video" | "model-llm" | "model-scraper";
    options?: string[];
}

interface BlockDef {
    id: string;
    name: string;
    category: "spy" | "brain" | "factory" | "manager";
    icon: string;
    description: string;
    cost: string;
    poweredBy: string;
    inputs: PortDef[];
    outputs: PortDef[];
    fields: BlockField[];
}

const BLOCK_DEFS: BlockDef[] = [
    // ===== SPIES =====
    {
        id: "shop_scraper", name: "Shop Scraper", category: "spy", icon: "🔍",
        description: "Find trending TikTok Shop products", cost: "~$0.01", poweredBy: "TikTok Shop API",
        inputs: [],
        outputs: [
            { id: "products", label: "Products", color: "#60a5fa" },
            { id: "top_product", label: "Top Product", color: "#60a5fa" },
        ],
        fields: [
            { key: "scraper_provider", label: "Scraper Provider", type: "model-scraper" },
            { key: "keyword", label: "Search Keyword", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["All", "Beauty", "Fashion", "Home", "Electronics", "Food", "Fitness"] },
            { key: "count", label: "Results", type: "select", options: ["3", "5", "10", "20"] },
        ],
    },
    {
        id: "competitor_spy", name: "Competitor Spy", category: "spy", icon: "🕵️",
        description: "Track competitor videos & performance", cost: "~$0.01", poweredBy: "TikTok Scraper API",
        inputs: [],
        outputs: [
            { id: "videos", label: "Videos", color: "#60a5fa" },
            { id: "top_video", label: "Top Video", color: "#60a5fa" },
        ],
        fields: [
            { key: "scraper_provider", label: "Scraper Provider", type: "model-scraper" },
            { key: "username", label: "TikTok Username", type: "text" },
            { key: "min_views", label: "Min Views", type: "select", options: ["10K", "50K", "100K", "500K", "1M"] },
        ],
    },
    {
        id: "asset_extractor", name: "Asset Extractor", category: "spy", icon: "📦",
        description: "Extract frames & transcript from video", cost: "~$0.01", poweredBy: "FFmpeg + Whisper",
        inputs: [{ id: "video_url", label: "Video URL", color: "#60a5fa" }],
        outputs: [
            { id: "first_frame", label: "First Frame", color: "#4ade80" },
            { id: "transcript", label: "Transcript", color: "#facc15" },
            { id: "all_frames", label: "All Frames", color: "#4ade80" },
        ],
        fields: [
            { key: "video_url", label: "Video URL", type: "text" },
            { key: "extract", label: "Extract", type: "select", options: ["Best Frame + Transcript", "All Frames", "Audio Only", "Everything"] },
        ],
    },
    {
        id: "hashtag_analyzer", name: "Hashtag Analyzer", category: "spy", icon: "#️⃣",
        description: "Find top posts for hashtags", cost: "~$0.01", poweredBy: "TikTok Scraper API",
        inputs: [],
        outputs: [{ id: "hashtag_data", label: "Hashtag Data", color: "#60a5fa" }],
        fields: [
            { key: "scraper_provider", label: "Scraper Provider", type: "model-scraper" },
            { key: "hashtag", label: "Hashtag", type: "text" },
            { key: "count", label: "Top Posts", type: "select", options: ["5", "10", "20"] },
        ],
    },
    {
        id: "sound_tracker", name: "Sound Tracker", category: "spy", icon: "🎵",
        description: "Find trending sounds", cost: "~$0.01", poweredBy: "TikTok Scraper API",
        inputs: [],
        outputs: [{ id: "sounds", label: "Sounds", color: "#60a5fa" }],
        fields: [
            { key: "scraper_provider", label: "Scraper Provider", type: "model-scraper" },
            { key: "niche", label: "Niche", type: "text" },
        ],
    },
    // ===== BRAINS =====
    {
        id: "hook_generator", name: "Hook Generator", category: "brain", icon: "🎣",
        description: "Reverse-engineer viral hooks", cost: "~$0.005", poweredBy: "OpenRouter LLM",
        inputs: [{ id: "context", label: "Product Info", color: "#facc15" }],
        outputs: [{ id: "hooks", label: "Hooks", color: "#facc15" }],
        fields: [
            { key: "llm_model", label: "AI Model", type: "model-llm" },
            { key: "style", label: "Hook Style", type: "select", options: ["Aggressive", "Curiosity", "Shock", "FOMO", "Question", "Story"] },
            { key: "count", label: "# of Hooks", type: "select", options: ["3", "5", "10"] },
            { key: "context", label: "Product / Context", type: "textarea" },
        ],
    },
    {
        id: "persona_filter", name: "Persona Filter", category: "brain", icon: "🎭",
        description: "Rewrite in specific creator tone", cost: "~$0.005", poweredBy: "OpenRouter LLM",
        inputs: [{ id: "text_in", label: "Text Input", color: "#facc15" }],
        outputs: [{ id: "text_out", label: "Rewritten", color: "#facc15" }],
        fields: [
            { key: "llm_model", label: "AI Model", type: "model-llm" },
            { key: "persona", label: "Persona", type: "select", options: ["Aggressive Gym Bro", "Calm Yoga Mom", "Tech Nerd", "Beauty Guru", "Finance Bro", "Gen-Z Creator"] },
        ],
    },
    {
        id: "script_writer", name: "Script Writer", category: "brain", icon: "✍️",
        description: "Full ad script from product info", cost: "~$0.005", poweredBy: "OpenRouter LLM",
        inputs: [{ id: "product_data", label: "Product Data", color: "#facc15" }],
        outputs: [
            { id: "script", label: "Script", color: "#facc15" },
            { id: "prompt", label: "Video Prompt", color: "#c084fc" },
        ],
        fields: [
            { key: "llm_model", label: "AI Model", type: "model-llm" },
            { key: "product_name", label: "Product Name", type: "text" },
            { key: "price", label: "Price", type: "text" },
            { key: "selling_points", label: "Key Selling Points", type: "textarea" },
            { key: "script_style", label: "Style", type: "select", options: ["Direct Sale", "Storytelling", "Problem-Solution", "Before/After"] },
        ],
    },
    {
        id: "caption_writer", name: "Caption Writer", category: "brain", icon: "💬",
        description: "Generate captions + hashtags", cost: "~$0.003", poweredBy: "OpenRouter LLM",
        inputs: [{ id: "script_in", label: "Script", color: "#facc15" }],
        outputs: [{ id: "caption", label: "Caption", color: "#facc15" }],
        fields: [
            { key: "llm_model", label: "AI Model", type: "model-llm" },
            { key: "tone", label: "Tone", type: "select", options: ["Casual", "Urgent", "Funny", "Professional", "Clickbait"] },
            { key: "include_hashtags", label: "Hashtags", type: "select", options: ["5", "10", "15", "None"] },
        ],
    },
    {
        id: "ab_splitter", name: "A/B Splitter", category: "brain", icon: "🔀",
        description: "Generate script variations", cost: "~$0.01", poweredBy: "OpenRouter LLM",
        inputs: [{ id: "script_in", label: "Script", color: "#facc15" }],
        outputs: [
            { id: "variation_a", label: "Variation A", color: "#facc15" },
            { id: "variation_b", label: "Variation B", color: "#facc15" },
        ],
        fields: [
            { key: "llm_model", label: "AI Model", type: "model-llm" },
            { key: "variations", label: "# Variations", type: "select", options: ["2", "3", "5"] },
            { key: "vary_what", label: "Vary", type: "select", options: ["Hook Only", "Full Script", "Tone/Style", "CTA"] },
        ],
    },
    // ===== FACTORY =====
    {
        id: "media_upload", name: "Media Upload", category: "factory", icon: "📤",
        description: "Upload your own images or videos", cost: "Free", poweredBy: "Local",
        inputs: [],
        outputs: [{ id: "media", label: "Media File", color: "#4ade80" }],
        fields: [
            { key: "input_image", label: "Upload File", type: "image" },
        ],
    },
    {
        id: "video_generator", name: "Video Generator", category: "factory", icon: "🎬",
        description: "Generate full video with AI", cost: "~$0.05-0.50", poweredBy: "Replicate",
        inputs: [
            { id: "first_frame", label: "First Frame", color: "#4ade80" },
            { id: "ref_image", label: "Reference Image", color: "#4ade80" },
            { id: "prompt", label: "Prompt / Script", color: "#facc15" },
        ],
        outputs: [
            { id: "video", label: "Generated Video", color: "#4ade80" },
            { id: "thumbnail", label: "Thumbnail", color: "#4ade80" },
        ],
        fields: [
            { key: "input_image", label: "Input Image", type: "image" },
            { key: "video_model", label: "Video Model", type: "model-video" },
            { key: "duration", label: "Duration", type: "select", options: ["5s", "10s", "15s", "30s"] },
            { key: "aspect_ratio", label: "Aspect Ratio", type: "select", options: ["9:16 (TikTok)", "1:1 (Instagram)", "16:9 (YouTube)"] },
            { key: "style", label: "Style", type: "select", options: ["Product Showcase", "UGC Style", "Cinematic", "Fast-Paced", "Lifestyle"] },
            { key: "camera_motion", label: "Camera", type: "select", options: ["Auto", "Slow Zoom", "Pan L→R", "Orbit", "Static", "Handheld"] },
        ],
    },
    {
        id: "image_generator", name: "Image Generator", category: "factory", icon: "🖼️",
        description: "Generate product photos", cost: "~$0.02", poweredBy: "Replicate (Flux)",
        inputs: [{ id: "product_image", label: "Product Image", color: "#4ade80" }],
        outputs: [{ id: "image", label: "Generated Image", color: "#4ade80" }],
        fields: [
            { key: "input_image", label: "Product Image", type: "image" },
            { key: "scene", label: "Scene", type: "select", options: ["White Background", "Kitchen", "Gym", "Living Room", "Outdoor", "Studio"] },
            { key: "count", label: "# Images", type: "select", options: ["1", "2", "4"] },
        ],
    },
    {
        id: "add_text", name: "Add Text to Image", category: "factory", icon: "✏️",
        description: "AI text overlay on images", cost: "~$0.01", poweredBy: "OpenAI / FFmpeg",
        inputs: [{ id: "image_in", label: "Image", color: "#4ade80" }],
        outputs: [{ id: "image_out", label: "Image + Text", color: "#4ade80" }],
        fields: [
            { key: "input_image", label: "Image", type: "image" },
            { key: "text", label: "Text", type: "textarea" },
            { key: "position", label: "Position", type: "select", options: ["Top", "Center", "Bottom"] },
            { key: "font_style", label: "Font", type: "select", options: ["Bold Modern", "Handwritten", "Neon Glow", "TikTok Style", "Meme"] },
            { key: "color", label: "Color", type: "select", options: ["White", "Black", "Yellow", "Red"] },
        ],
    },
    {
        id: "remove_bg", name: "Remove Background", category: "factory", icon: "🪄",
        description: "Remove image background", cost: "~$0.01", poweredBy: "Replicate (RMBG)",
        inputs: [{ id: "image_in", label: "Image", color: "#4ade80" }],
        outputs: [{ id: "image_out", label: "No-BG Image", color: "#4ade80" }],
        fields: [
            { key: "input_image", label: "Image", type: "image" },
        ],
    },
    {
        id: "image_editor", name: "Image Editor", category: "factory", icon: "🎨",
        description: "Crop, resize, adjust images", cost: "Free", poweredBy: "FFmpeg",
        inputs: [{ id: "image_in", label: "Image", color: "#4ade80" }],
        outputs: [{ id: "image_out", label: "Edited Image", color: "#4ade80" }],
        fields: [
            { key: "input_image", label: "Image", type: "image" },
            { key: "action", label: "Action", type: "select", options: ["Crop", "Resize", "Brightness", "Contrast", "Blur BG", "Add Border"] },
            { key: "target_size", label: "Size", type: "select", options: ["1080x1920", "1080x1080", "1920x1080"] },
        ],
    },
    // ===== MANAGERS =====
    {
        id: "download_export", name: "Download / Export", category: "manager", icon: "💾",
        description: "Save final output", cost: "Free", poweredBy: "Local",
        inputs: [
            { id: "video_in", label: "Video", color: "#4ade80" },
            { id: "image_in", label: "Image", color: "#4ade80" },
        ],
        outputs: [],
        fields: [
            { key: "format", label: "Format", type: "select", options: ["MP4 (H.264)", "MOV", "WebM"] },
            { key: "quality", label: "Quality", type: "select", options: ["High (1080p)", "Medium (720p)"] },
        ],
    },
    {
        id: "watermark", name: "Remove Watermark", category: "manager", icon: "🧹",
        description: "Remove watermark from video", cost: "Free", poweredBy: "FFmpeg (delogo)",
        inputs: [{ id: "video_in", label: "Video", color: "#4ade80" }],
        outputs: [{ id: "video_out", label: "Clean Video", color: "#4ade80" }],
        fields: [
            { key: "position", label: "Watermark Location", type: "select", options: ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right", "Center"] },
            { key: "size", label: "Watermark Size", type: "select", options: ["Small", "Medium", "Large"] },
        ],
    },
    {
        id: "resize_crop", name: "Resize / Crop", category: "manager", icon: "✂️",
        description: "Convert aspect ratios", cost: "Free", poweredBy: "FFmpeg",
        inputs: [{ id: "video_in", label: "Video", color: "#4ade80" }],
        outputs: [{ id: "video_out", label: "Resized", color: "#4ade80" }],
        fields: [
            { key: "target_ratio", label: "Ratio", type: "select", options: ["9:16 (TikTok)", "1:1 (IG)", "16:9 (YT)"] },
            { key: "fill_mode", label: "Fill", type: "select", options: ["Crop", "Black Bars", "Blur BG"] },
        ],
    },
    {
        id: "analytics_check", name: "Analytics Check", category: "manager", icon: "📈",
        description: "Check post performance", cost: "~$0.01", poweredBy: "TikTok Scraper",
        inputs: [],
        outputs: [{ id: "metrics", label: "Metrics", color: "#c084fc" }],
        fields: [
            { key: "scraper_provider", label: "Provider", type: "model-scraper" },
            { key: "username", label: "Username", type: "text" },
            { key: "hours_after", label: "Check After", type: "select", options: ["6h", "12h", "24h", "48h", "7d"] },
        ],
    },
];

const CATEGORIES = [
    { key: "spy", label: "Spies", icon: "🕵️", description: "Data Collection" },
    { key: "brain", label: "Brains", icon: "🧠", description: "Logic & Writing" },
    { key: "factory", label: "Factory", icon: "🏭", description: "Generation" },
    { key: "manager", label: "Managers", icon: "📋", description: "Actions" },
];

// ===== NODE & CONNECTION TYPES =====
interface PipelineNode {
    id: string;
    blockId: string;
    x: number;
    y: number;
    config: Record<string, string>;
    status?: "idle" | "running" | "done" | "error";
    previewUrl?: string;
    previewType?: "image" | "video";
    outputUrl?: string;
    outputType?: "image" | "video";
}

interface Connection {
    id: string;
    fromNode: string;
    fromPort: string;
    toNode: string;
    toPort: string;
}

interface SavedPipeline {
    name: string;
    nodes: PipelineNode[];
    connections: Connection[];
    createdAt: string;
    updatedAt: string;
}

// ===== MAIN COMPONENT =====
export default function PipelinePage() {
    const [nodes, setNodes] = useState<PipelineNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [pipelineName, setPipelineName] = useState("My Pipeline");
    const [isRunning, setIsRunning] = useState(false);
    const [dragLine, setDragLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const [savedPipelines, setSavedPipelines] = useState<SavedPipeline[]>([]);
    const [showPipelineList, setShowPipelineList] = useState(false);
    const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; portId: string } | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const getBlockDef = (blockId: string) => BLOCK_DEFS.find((b) => b.id === blockId)!;

    const totalCost = nodes.reduce((sum, node) => {
        const def = getBlockDef(node.blockId);
        const costStr = def.cost.replace("~$", "").replace("Free", "0");
        const costParts = costStr.split("-");
        return sum + (parseFloat(costParts[0]) || 0);
    }, 0);

    // ===== DRAG FROM SIDEBAR =====
    const handleSidebarDragStart = (e: React.DragEvent, blockId: string) => {
        e.dataTransfer.setData("blockId", blockId);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const blockId = e.dataTransfer.getData("blockId");
        if (!blockId) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const newNode: PipelineNode = {
            id: `node_${Date.now()}`,
            blockId,
            x: e.clientX - rect.left + canvas.scrollLeft - 130,
            y: e.clientY - rect.top + canvas.scrollTop - 30,
            config: {},
            status: "idle",
        };
        setNodes((prev) => [...prev, newNode]);
    };

    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    // ===== MOVE NODES =====
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        const target = e.target as HTMLElement;
        if (target.closest(`.${styles.nodeDelete}`) || target.closest(`.${styles.portDot}`) ||
            target.closest("input") || target.closest("select") || target.closest("textarea") ||
            target.closest("label")) return;

        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        const startX = e.clientX;
        const startY = e.clientY;
        const startNodeX = node.x;
        const startNodeY = node.y;

        const onMove = (ev: MouseEvent) => {
            setNodes((prev) =>
                prev.map((n) =>
                    n.id === nodeId
                        ? { ...n, x: startNodeX + (ev.clientX - startX), y: startNodeY + (ev.clientY - startY) }
                        : n
                )
            );
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    // ===== PORT POSITIONS =====
    const getPortPos = useCallback((nodeId: string, portId: string, isOutput: boolean) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        const def = getBlockDef(node.blockId);
        const ports = isOutput ? def.outputs : def.inputs;
        const portIndex = ports.findIndex((p) => p.id === portId);
        const nodeWidth = 280;
        // Ports are positioned along the header area, spaced out
        const headerHeight = 40;
        const portSpacing = 22;
        const startY = headerHeight + 8 + portIndex * portSpacing;
        return {
            x: isOutput ? node.x + nodeWidth : node.x,
            y: node.y + startY,
        };
    }, [nodes]);

    // ===== CONNECTIONS =====
    const handleOutputPortMouseDown = (e: React.MouseEvent, nodeId: string, portId: string) => {
        e.stopPropagation();
        e.preventDefault();
        setConnectingFrom({ nodeId, portId });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const startPos = getPortPos(nodeId, portId, true);

        const onMove = (ev: MouseEvent) => {
            setDragLine({
                x1: startPos.x,
                y1: startPos.y,
                x2: ev.clientX - rect.left + canvas.scrollLeft,
                y2: ev.clientY - rect.top + canvas.scrollTop,
            });
        };

        const onUp = () => {
            setConnectingFrom(null);
            setDragLine(null);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const handleInputPortMouseUp = (nodeId: string, portId: string) => {
        if (!connectingFrom || connectingFrom.nodeId === nodeId) return;
        const exists = connections.some(
            (c) => c.fromNode === connectingFrom.nodeId && c.fromPort === connectingFrom.portId &&
                c.toNode === nodeId && c.toPort === portId
        );
        if (exists) return;
        setConnections((prev) => [
            ...prev,
            {
                id: `conn_${Date.now()}`,
                fromNode: connectingFrom.nodeId,
                fromPort: connectingFrom.portId,
                toNode: nodeId,
                toPort: portId,
            },
        ]);
        setConnectingFrom(null);
        setDragLine(null);
    };

    // ===== DELETE =====
    const deleteNode = (nodeId: string) => {
        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
        setConnections((prev) => prev.filter((c) => c.fromNode !== nodeId && c.toNode !== nodeId));
    };

    const updateNodeConfig = (nodeId: string, key: string, value: string) => {
        setNodes((prev) =>
            prev.map((n) => (n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n))
        );
    };

    // ===== MEDIA UPLOAD (images + videos) =====
    const handleMediaUpload = async (nodeId: string, fieldKey: string, file: File) => {
        const objectUrl = URL.createObjectURL(file);
        const isVideo = file.type.startsWith("video/");
        const mediaType = isVideo ? "video" : "image";

        // Show immediate local preview
        updateNodeConfig(nodeId, fieldKey, objectUrl);
        updateNodeConfig(nodeId, fieldKey + "_type", mediaType);
        updateNodeConfig(nodeId, fieldKey + "_name", file.name);

        setNodes((prev) =>
            prev.map((n) => (n.id === nodeId ? { ...n, previewUrl: objectUrl, previewType: mediaType } : n))
        );

        // Create thumbnail only for images
        if (!isVideo) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxSize = 200;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const thumbnail = canvas.toDataURL("image/jpeg", 0.6);
                    updateNodeConfig(nodeId, fieldKey + "_thumb", thumbnail);
                }
            };
            img.src = objectUrl;
        }

        // Upload to server for real pipeline flow
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                // Update with real server URL
                updateNodeConfig(nodeId, fieldKey, data.url);
                setNodes((prev) =>
                    prev.map((n) => (n.id === nodeId ? { ...n, previewUrl: data.url, previewType: mediaType } : n))
                );
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    // ===== RUN PIPELINE =====
    const [nodeResults, setNodeResults] = useState<Record<string, { type: string; data: Record<string, string> }>>({});

    const runPipeline = async () => {
        if (nodes.length === 0) return;
        setIsRunning(true);
        setNodes((prev) => prev.map((n) => ({ ...n, status: "idle" as const, outputUrl: undefined })));
        setNodeResults({});

        const executed = new Set<string>();
        const resultsMap: Record<string, Record<string, string>> = {};

        // Find root nodes (no incoming connections)
        const queue = nodes.filter((n) => !connections.some((c) => c.toNode === n.id));

        const executeNode = async (node: PipelineNode) => {
            if (executed.has(node.id)) return;

            // Wait for all upstream nodes first
            const upstreamConns = connections.filter((c) => c.toNode === node.id);
            for (const conn of upstreamConns) {
                const upNode = nodes.find((n) => n.id === conn.fromNode);
                if (upNode && !executed.has(upNode.id)) {
                    await executeNode(upNode);
                }
            }

            setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, status: "running" as const } : n)));

            try {
                // Gather upstream data from all connected inputs
                const upstreamData: Record<string, Record<string, string>> = {};
                for (const conn of upstreamConns) {
                    if (resultsMap[conn.fromNode]) {
                        upstreamData[conn.fromPort] = resultsMap[conn.fromNode];
                    }
                }

                // Handle download block on client side
                if (node.blockId === "download_export") {
                    let downloadUrl: string | null = null;
                    // Find the upstream media URL
                    for (const data of Object.values(upstreamData)) {
                        if (data.video_url) { downloadUrl = data.video_url; break; }
                        if (data.image_url) { downloadUrl = data.image_url; break; }
                    }

                    if (downloadUrl) {
                        // Show the output in node
                        const isVideo = downloadUrl.includes(".mp4") || downloadUrl.includes("video");
                        setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, outputUrl: downloadUrl!, outputType: (isVideo ? "video" : "image") as "video" | "image", status: "done" as const } : n)));

                        // Trigger real browser download
                        try {
                            const response = await fetch(downloadUrl);
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = blobUrl;
                            const ext = isVideo ? "mp4" : "png";
                            a.download = `pipeline_output_${Date.now()}.${ext}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                        } catch (e) {
                            // Fallback: open in new tab
                            window.open(downloadUrl, "_blank");
                        }

                        resultsMap[node.id] = { download_url: downloadUrl, type: "download" };
                        setNodeResults((prev) => ({ ...prev, [node.id]: { type: "download", data: { message: `Downloaded: ${downloadUrl}`, download_url: downloadUrl! } } }));
                    } else {
                        setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, status: "error" as const } : n)));
                        setNodeResults((prev) => ({ ...prev, [node.id]: { type: "error", data: { error: "No upstream video/image to download. Connect a generator block." } } }));
                    }
                    executed.add(node.id);
                    return;
                }

                // API call for all other blocks
                const res = await fetch("/api/pipeline/execute", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        blockId: node.blockId,
                        config: node.config,
                        upstreamData,
                    }),
                });

                const result = await res.json();

                if (result.success) {
                    const output = result.output;
                    resultsMap[node.id] = output;
                    setNodeResults((prev) => ({ ...prev, [node.id]: { type: output.type, data: output } }));

                    // Update node with visual preview
                    if (output.type === "video" && output.video_url) {
                        setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, outputUrl: output.video_url, outputType: "video" as const, status: "done" as const } : n)));
                    } else if (output.type === "image" && output.image_url) {
                        setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, outputUrl: output.image_url, outputType: "image" as const, status: "done" as const } : n)));
                    } else {
                        setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, status: "done" as const } : n)));
                    }
                } else {
                    console.error(`Block ${node.blockId} failed:`, result.error);
                    setNodeResults((prev) => ({ ...prev, [node.id]: { type: "error", data: { error: result.error } } }));
                    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, status: "error" as const } : n)));
                }
            } catch (err) {
                console.error(`Block ${node.blockId} error:`, err);
                setNodeResults((prev) => ({ ...prev, [node.id]: { type: "error", data: { error: String(err) } } }));
                setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, status: "error" as const } : n)));
            }

            executed.add(node.id);

            // Execute downstream nodes
            const downstream = connections
                .filter((c) => c.fromNode === node.id)
                .map((c) => nodes.find((n) => n.id === c.toNode)!)
                .filter(Boolean);
            for (const dn of downstream) {
                await executeNode(dn);
            }
        };

        for (const node of queue) {
            await executeNode(node);
        }
        setIsRunning(false);
    };

    // ===== STRIP IMAGE DATA FOR STORAGE =====
    const stripImageData = (nodeList: PipelineNode[]): PipelineNode[] => {
        return nodeList.map((n) => {
            const cleanConfig: Record<string, string> = {};
            for (const [key, val] of Object.entries(n.config)) {
                // Keep thumbnails (small), skip blob URLs and huge data URLs
                if (val && (val.startsWith("blob:") || (val.startsWith("data:") && val.length > 5000 && !key.endsWith("_thumb")))) {
                    continue;
                }
                cleanConfig[key] = val;
            }
            return { ...n, config: cleanConfig, previewUrl: undefined, outputUrl: undefined };
        });
    };

    // ===== PIPELINE SAVE/LOAD =====
    const savePipeline = () => {
        const allPipelines = JSON.parse(localStorage.getItem("pipelines_list") || "[]") as SavedPipeline[];
        const existing = allPipelines.findIndex((p) => p.name === pipelineName);
        const safeNodes = stripImageData(nodes);
        const pipeline: SavedPipeline = {
            name: pipelineName, nodes: safeNodes, connections,
            createdAt: existing >= 0 ? allPipelines[existing].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (existing >= 0) allPipelines[existing] = pipeline;
        else allPipelines.push(pipeline);
        try {
            localStorage.setItem("pipelines_list", JSON.stringify(allPipelines));
        } catch (e) {
            console.warn("Pipeline too large for localStorage, saving without images");
        }
        setSavedPipelines(allPipelines);
    };

    const loadPipeline = (pipeline: SavedPipeline) => {
        setNodes(pipeline.nodes); setConnections(pipeline.connections);
        setPipelineName(pipeline.name); setShowPipelineList(false);
    };

    const deletePipeline = (name: string) => {
        const all = (JSON.parse(localStorage.getItem("pipelines_list") || "[]") as SavedPipeline[]).filter((p) => p.name !== name);
        localStorage.setItem("pipelines_list", JSON.stringify(all));
        setSavedPipelines(all);
    };

    const newPipeline = () => {
        setNodes([]); setConnections([]);
        setPipelineName(`Pipeline ${savedPipelines.length + 1}`); setShowPipelineList(false);
    };

    useEffect(() => {
        const saved = localStorage.getItem("pipelines_list");
        if (saved) { try { setSavedPipelines(JSON.parse(saved)); } catch { } }
        const lastActive = localStorage.getItem("pipeline_active");
        if (lastActive) {
            try {
                const { nodes: sn, connections: sc, name } = JSON.parse(lastActive);
                if (sn) setNodes(sn); if (sc) setConnections(sc); if (name) setPipelineName(name);
            } catch { }
        }
    }, []);

    useEffect(() => {
        try {
            const safeNodes = stripImageData(nodes);
            localStorage.setItem("pipeline_active", JSON.stringify({ nodes: safeNodes, connections, name: pipelineName }));
        } catch (e) {
            console.warn("Auto-save skipped: data too large");
        }
    }, [nodes, connections, pipelineName]);

    const clearAll = () => { setNodes([]); setConnections([]); };

    // ===== RENDER FIELD =====
    const renderField = (field: BlockField, node: PipelineNode) => {
        if (field.type === "image") {
            const fileUrl = node.config[field.key];
            const fileType = node.config[field.key + "_type"] || "image";
            const fileName = node.config[field.key + "_name"] || "";
            return (
                <div className={styles.nodeField} key={field.key}>
                    <div className={styles.nodeFieldLabel}>{field.label}</div>
                    <label className={styles.imageUploadArea}>
                        {fileUrl && fileType === "video" ? (
                            <video src={fileUrl} className={styles.imageUploadPreview} controls muted playsInline />
                        ) : fileUrl ? (
                            <img src={fileUrl} alt="Uploaded" className={styles.imageUploadPreview} />
                        ) : (
                            <div className={styles.imageUploadPlaceholder}>
                                <span>📷</span><span>Click to upload image or video</span>
                            </div>
                        )}
                        <input type="file" accept="image/*,video/*" style={{ display: "none" }}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaUpload(node.id, field.key, f); }} />
                    </label>
                    {fileName && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', paddingTop: 3 }}>📎 {fileName}</div>}
                </div>
            );
        }
        if (field.type === "model-video") {
            return (
                <div className={styles.nodeField} key={field.key}>
                    <div className={styles.nodeFieldLabel}>{field.label}</div>
                    <select className={styles.nodeFieldSelect} value={node.config[field.key] || ""}
                        onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)}>
                        <option value="">Select Model...</option>
                        {VIDEO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.cost} {"⭐".repeat(m.quality)}</option>)}
                    </select>
                    {node.config[field.key] && <div className={styles.modelBadge}>via {VIDEO_MODELS.find((m) => m.id === node.config[field.key])?.provider}</div>}
                </div>
            );
        }
        if (field.type === "model-llm") {
            return (
                <div className={styles.nodeField} key={field.key}>
                    <div className={styles.nodeFieldLabel}>{field.label}</div>
                    <select className={styles.nodeFieldSelect} value={node.config[field.key] || ""}
                        onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)}>
                        <option value="">Select Model...</option>
                        {LLM_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.cost}</option>)}
                    </select>
                    {node.config[field.key] && <div className={styles.modelBadge}>via {LLM_MODELS.find((m) => m.id === node.config[field.key])?.provider}</div>}
                </div>
            );
        }
        if (field.type === "model-scraper") {
            return (
                <div className={styles.nodeField} key={field.key}>
                    <div className={styles.nodeFieldLabel}>{field.label}</div>
                    <select className={styles.nodeFieldSelect} value={node.config[field.key] || ""}
                        onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)}>
                        <option value="">Select Provider...</option>
                        {SCRAPER_PROVIDERS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.cost}</option>)}
                    </select>
                </div>
            );
        }
        if (field.type === "select") {
            return (
                <div className={styles.nodeField} key={field.key}>
                    <div className={styles.nodeFieldLabel}>{field.label}</div>
                    <select className={styles.nodeFieldSelect} value={node.config[field.key] || ""}
                        onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)}>
                        <option value="">Select...</option>
                        {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            );
        }
        if (field.type === "textarea") {
            return (
                <div className={styles.nodeField} key={field.key}>
                    <div className={styles.nodeFieldLabel}>{field.label}</div>
                    <textarea className={styles.nodeFieldInput} value={node.config[field.key] || ""}
                        onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)} rows={2}
                        placeholder={`Enter ${field.label.toLowerCase()}...`} />
                </div>
            );
        }
        return (
            <div className={styles.nodeField} key={field.key}>
                <div className={styles.nodeFieldLabel}>{field.label}</div>
                <input className={styles.nodeFieldInput} value={node.config[field.key] || ""}
                    onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`} />
            </div>
        );
    };

    return (
        <div className={styles.pipelinePage}>
            {/* PIPELINE LIST MODAL */}
            {showPipelineList && (
                <div className={styles.modal} onClick={() => setShowPipelineList(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>📁 Saved Pipelines</h2>
                            <button className={styles.nodeDelete} onClick={() => setShowPipelineList(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <button className={styles.btnRun} onClick={newPipeline} style={{ width: "100%", marginBottom: 16, justifyContent: "center" }}>
                                ➕ New Pipeline
                            </button>
                            {savedPipelines.length === 0 ? (
                                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: 24 }}>No saved pipelines yet.</div>
                            ) : savedPipelines.map((p) => (
                                <div key={p.name} className={styles.pipelineListItem}>
                                    <div className={styles.pipelineListInfo}>
                                        <div className={styles.pipelineListName}>{p.name}</div>
                                        <div className={styles.pipelineListMeta}>{p.nodes.length} blocks • {new Date(p.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button className={styles.btnSecondary} onClick={() => loadPipeline(p)}>Open</button>
                                        <button className={styles.nodeDelete} onClick={() => deletePipeline(p.name)} style={{ width: 28, height: 28 }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.logo}>VeoGen</Link>
                    <div className={styles.pipelineName}>
                        <input value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} placeholder="Pipeline Name" />
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnSecondary} onClick={() => setShowPipelineList(true)}>📁 Pipelines</button>
                    <button className={styles.btnSecondary} onClick={savePipeline}>💾 Save</button>
                    <button className={styles.btnSecondary} onClick={clearAll}>🗑️ Clear</button>
                    <button className={styles.btnSecondary} onClick={() => window.location.href = "/create"}>← Simple Mode</button>
                    <button className={styles.btnRun} onClick={runPipeline} disabled={isRunning || nodes.length === 0}>
                        {isRunning ? <>⏳ Running...</> : <>▶ Run Pipeline</>}
                    </button>
                </div>
            </div>

            {/* WORKSPACE */}
            <div className={styles.workspace}>
                {/* SIDEBAR */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>Pipeline Blocks</div>
                    {CATEGORIES.map((cat) => (
                        <div key={cat.key} className={styles.category}>
                            <div className={styles.categoryHeader}>
                                <span className={styles.categoryIcon}>{cat.icon}</span>
                                {cat.label}
                                <span style={{ opacity: 0.4, fontWeight: 400, textTransform: "none" }}>— {cat.description}</span>
                            </div>
                            {BLOCK_DEFS.filter((b) => b.category === cat.key).map((block) => (
                                <div key={block.id} className={styles.blockItem} draggable
                                    onDragStart={(e) => handleSidebarDragStart(e, block.id)}>
                                    <div className={`${styles.blockIcon} ${styles[`blockIcon${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}` as keyof typeof styles]}`}>
                                        {block.icon}
                                    </div>
                                    <div className={styles.blockInfo}>
                                        <div className={styles.blockName}>{block.name}</div>
                                        <div className={styles.blockDesc}>{block.description}</div>
                                    </div>
                                    <div className={styles.blockCost}>{block.cost}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* CANVAS */}
                <div className={styles.canvas} ref={canvasRef} onDrop={handleCanvasDrop} onDragOver={handleCanvasDragOver}>
                    <div className={styles.canvasInner}>
                        {nodes.length === 0 && (
                            <div className={styles.canvasEmpty}>
                                <div className={styles.canvasEmptyIcon}>🔗</div>
                                <div className={styles.canvasEmptyText}>Drag blocks here to build your pipeline</div>
                                <div className={styles.canvasEmptySub}>Connect output ports → input ports to wire blocks together</div>
                            </div>
                        )}

                        {/* SVG Connections */}
                        <svg className={styles.connectionsSvg}>
                            {connections.map((conn) => {
                                const from = getPortPos(conn.fromNode, conn.fromPort, true);
                                const to = getPortPos(conn.toNode, conn.toPort, false);
                                const dx = Math.abs(to.x - from.x) * 0.4;
                                return (
                                    <path key={conn.id}
                                        className={`${styles.connectionLine} ${isRunning ? styles.connectionLineActive : ""}`}
                                        d={`M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`}
                                    />
                                );
                            })}
                            {dragLine && (
                                <path className={styles.connectionLine}
                                    d={`M ${dragLine.x1} ${dragLine.y1} C ${dragLine.x1 + 60} ${dragLine.y1}, ${dragLine.x2 - 60} ${dragLine.y2}, ${dragLine.x2} ${dragLine.y2}`}
                                    strokeDasharray="6 4" opacity={0.6} />
                            )}
                        </svg>

                        {/* NODES */}
                        {nodes.map((node) => {
                            const def = getBlockDef(node.blockId);
                            const cat = CATEGORIES.find((c) => c.key === def.category)!;
                            return (
                                <div key={node.id}
                                    ref={(el) => { nodeRefs.current[node.id] = el; }}
                                    className={`${styles.node} ${node.status === "running" ? styles.nodeRunning : ""} ${node.status === "done" ? styles.nodeDone : ""} ${node.status === "error" ? styles.nodeError : ""}`}
                                    style={{ left: node.x, top: node.y }}
                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}>

                                    {/* INPUT PORTS (left side) */}
                                    {def.inputs.length > 0 && (
                                        <div className={styles.portsLeft}>
                                            {def.inputs.map((port, i) => (
                                                <div key={port.id} className={styles.portRow}
                                                    style={{ top: 40 + 8 + i * 22 }}
                                                    onMouseUp={() => handleInputPortMouseUp(node.id, port.id)}>
                                                    <span className={styles.portLabel} style={{ color: port.color || "#7c3aed" }}>{port.label}</span>
                                                    <div className={styles.portDot}
                                                        style={{ borderColor: port.color || "#7c3aed", background: connectingFrom ? (port.color || "#7c3aed") + "40" : "transparent" }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* OUTPUT PORTS (right side) */}
                                    {def.outputs.length > 0 && (
                                        <div className={styles.portsRight}>
                                            {def.outputs.map((port, i) => (
                                                <div key={port.id} className={styles.portRow}
                                                    style={{ top: 40 + 8 + i * 22 }}
                                                    onMouseDown={(e) => handleOutputPortMouseDown(e, node.id, port.id)}>
                                                    <div className={styles.portDot}
                                                        style={{ borderColor: port.color || "#7c3aed" }} />
                                                    <span className={styles.portLabel} style={{ color: port.color || "#7c3aed" }}>{port.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* HEADER */}
                                    <div className={styles.nodeHeader}>
                                        <div className={`${styles.blockIcon} ${styles[`blockIcon${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}` as keyof typeof styles]}`}>
                                            {def.icon}
                                        </div>
                                        <div className={styles.nodeTitle}>{def.name}</div>
                                        {node.status === "running" && <span>⏳</span>}
                                        {node.status === "done" && <span>✅</span>}
                                        <button className={styles.nodeDelete} onClick={() => deleteNode(node.id)}>✕</button>
                                    </div>

                                    {/* Description + Powered By */}
                                    <div className={styles.nodeDescription}>
                                        <div className={styles.nodeDescText}>{def.description}</div>
                                        <div className={styles.poweredBy}>⚡ {def.poweredBy} · {def.cost}</div>
                                    </div>

                                    {/* OUTPUT PREVIEW AREA — only show for blocks WITHOUT an upload field (to avoid duplicate) */}
                                    {!def.fields.some(f => f.type === "image") && (node.previewUrl || node.outputUrl) && (
                                        <div className={styles.nodePreview}>
                                            {(node.outputType === "video" || node.previewType === "video" || (node.outputUrl || node.previewUrl || "").includes(".mp4")) ? (
                                                <video
                                                    src={node.outputUrl || node.previewUrl}
                                                    className={styles.nodePreviewImg}
                                                    controls
                                                    muted
                                                    autoPlay
                                                    loop
                                                    playsInline
                                                />
                                            ) : (
                                                <img src={node.outputUrl || node.previewUrl} alt="Preview" className={styles.nodePreviewImg} />
                                            )}
                                        </div>
                                    )}

                                    {/* Output placeholder — only for blocks WITHOUT upload fields */}
                                    {!def.fields.some(f => f.type === "image") && !node.previewUrl && !node.outputUrl && (def.outputs.some(o => o.label.includes("Video") || o.label.includes("Image") || o.label.includes("Media"))) && (
                                        <div className={styles.outputPlaceholder}>
                                            <span className={styles.outputPlaceholderIcon}>
                                                {def.outputs.some(o => o.label.includes("Video")) ? "🎬" : def.outputs.some(o => o.label.includes("Media")) ? "📁" : "🖼️"}
                                            </span>
                                            <span className={styles.outputPlaceholderText}>
                                                {def.outputs.some(o => o.label.includes("Video")) ? "Video will appear here" : def.outputs.some(o => o.label.includes("Media")) ? "Upload media to preview" : "Image will appear here"}
                                            </span>
                                        </div>
                                    )}

                                    {/* TEXT RESULT DISPLAY */}
                                    {nodeResults[node.id] && (nodeResults[node.id].type === "text" || nodeResults[node.id].type === "download") && (
                                        <div className={styles.nodeResultText}>
                                            <div className={styles.nodeResultLabel}>{nodeResults[node.id].type === "download" ? "💾 Downloaded:" : "✅ Output:"}</div>
                                            <div className={styles.nodeResultContent}>
                                                {(() => {
                                                    const d = nodeResults[node.id].data;
                                                    return d.script || d.hooks || d.caption || d.text || d.variations || d.schedule || d.products || d.videos || d.hashtag_data || d.sounds || d.metrics || d.message || JSON.stringify(d);
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* ERROR DISPLAY */}
                                    {nodeResults[node.id] && nodeResults[node.id].type === "error" && (
                                        <div className={styles.nodeResultError}>
                                            ❌ {nodeResults[node.id].data?.error || "Unknown error"}
                                        </div>
                                    )}

                                    {/* FIELDS */}
                                    <div className={styles.nodeBody}>
                                        {def.fields.map((field) => renderField(field, node))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* STATUS BAR */}
            <div className={styles.statusBar}>
                <div className={styles.statusLeft}>
                    <span>
                        <span className={`${styles.statusDot} ${isRunning ? styles.statusDotRunning : ""}`} />
                        {isRunning ? "Pipeline Running..." : "Ready"}
                    </span>
                    <span>{nodes.length} blocks</span>
                    <span>{connections.length} connections</span>
                    <span>{savedPipelines.length} saved</span>
                </div>
                <div className={styles.costEstimate}>Est. cost: ${totalCost.toFixed(3)}</div>
            </div>
        </div>
    );
}
