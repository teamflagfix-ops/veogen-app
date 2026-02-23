/**
 * Video Composer - TikTok Style
 * 
 * 1. Uses Replicate Wan 2.2 Fast to animate the product image (CHEAPEST - ~$0.07/video)
 * 2. Burns text overlays INTO the video using FFmpeg (like TikTok ads)
 * 3. Adds audio
 */

import path from "path";
import { spawn } from "child_process";
import fs from "fs/promises";
import * as replicate from "../replicate/client";

const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

export interface ComposeOptions {
    imagePath: string;
    imageBase64?: string;
    audioPath: string;
    outputDir: string;
    filename: string;
    duration?: number;
    width?: number;
    height?: number;
    productContext?: string;
    overlays?: {
        hooks?: string[]; // Selected script angles/hooks
        discount?: string; // Legacy - kept for compatibility
        urgency?: string;  // Legacy - kept for compatibility  
        productName?: string;
        price?: string;
    };
    /** Test mode: Skip video API, use static image with overlays (free!) */
    testMode?: boolean;
}

function runFFmpeg(args: string[], cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("Running FFmpeg with args:", args.join(" "));

        const proc = spawn(ffmpegPath, args, {
            stdio: ["pipe", "pipe", "pipe"],
            cwd: cwd || process.cwd(),
        });

        let stderr = "";
        proc.stderr?.on("data", (data) => {
            stderr += data.toString();
        });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                console.error("FFmpeg stderr:", stderr);
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
            }
        });

        proc.on("error", (err) => {
            reject(err);
        });
    });
}

/**
 * Escape text for FFmpeg drawtext filter
 */
function escapeFFmpegText(text: string): string {
    return text
        .replace(/\\/g, "\\\\\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/%/g, "\\%");
}

/**
 * Build TikTok-style text overlay filter
 * Premium styling: colored pill banners, varied text colors, different positions
 */
function buildOverlayFilter(
    overlays: ComposeOptions["overlays"],
    fontPath: string,
    width: number,
    height: number
): string {
    const filters: string[] = [];
    const escapedFont = fontPath.replace(/\\/g, "/").replace(/:/g, "\\:");

    // TikTok-style positioning (centered, stacked at top)
    const centerX = Math.floor(width / 2);
    const bannerY1 = Math.floor(height * 0.06);  // First banner - 6%
    const bannerY2 = Math.floor(height * 0.13); // Second banner - 13%
    const bannerY3 = Math.floor(height * 0.20); // Third line - 20%
    const bottomY = Math.floor(height * 0.88);  // Price at bottom - 88%

    // DISCOUNT BANNER - Red pill with white bold text (like TikTok "🎁 TRIPLE DISCOUNT 🎁")
    if (overlays?.discount) {
        const discountText = escapeFFmpegText(`🎁 ${overlays.discount.toUpperCase()} 🎁`);
        // Estimate text width for centered box (approx 22px per char at size 48)
        const textWidth = Math.min(overlays.discount.length * 28 + 120, width - 60);
        const boxX = Math.floor((width - textWidth) / 2);

        // Red rounded-look box (using slightly transparent for glow effect)
        filters.push(
            `drawbox=x=${boxX}:y=${bannerY1}:w=${textWidth}:h=65:color=#E31C3D@0.95:t=fill`
        );
        // White bold text centered
        filters.push(
            `drawtext=fontfile='${escapedFont}':text='${discountText}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=${bannerY1 + 12}:shadowcolor=black@0.3:shadowx=1:shadowy=1`
        );
    }

    // URGENCY TEXT - White with black outline (like "ENDS TONIGHT ⏰")
    if (overlays?.urgency) {
        const urgencyText = escapeFFmpegText(`${overlays.urgency.toUpperCase()} ⏰`);
        filters.push(
            `drawtext=fontfile='${escapedFont}':text='${urgencyText}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=${bannerY2}:borderw=3:bordercolor=black:shadowcolor=black@0.6:shadowx=2:shadowy=2`
        );
    }

    // PRODUCT NAME - Italic-style with gradient look (like "Ninja Foodi NeverDull")
    if (overlays?.productName) {
        const productText = escapeFFmpegText(overlays.productName);
        // Slight yellow/cream color for elegance
        filters.push(
            `drawtext=fontfile='${escapedFont}':text='${productText}':fontsize=36:fontcolor=#F5F5DC:x=(w-text_w)/2:y=${bannerY3}:borderw=2:bordercolor=black@0.8:shadowcolor=black@0.5:shadowx=2:shadowy=2`
        );
    }

    // PRICE TAG - Gold on dark pill at bottom (like "$29.99")
    if (overlays?.price) {
        const priceText = escapeFFmpegText(`💰 ${overlays.price} 💰`);
        const priceWidth = Math.min(overlays.price.length * 30 + 140, width - 100);
        const priceBoxX = Math.floor((width - priceWidth) / 2);

        // Dark semi-transparent rounded-look box
        filters.push(
            `drawbox=x=${priceBoxX}:y=${bottomY - 5}:w=${priceWidth}:h=60:color=black@0.8:t=fill`
        );
        // Gold text with glow
        filters.push(
            `drawtext=fontfile='${escapedFont}':text='${priceText}':fontsize=42:fontcolor=#FFD700:x=(w-text_w)/2:y=${bottomY + 8}:borderw=2:bordercolor=#8B4513:shadowcolor=black@0.7:shadowx=2:shadowy=2`
        );
    }

    return filters.join(",");
}

/**
 * Create video from image with pill-shaped text overlays
 * Uses sharp to generate styled PNG overlays and FFmpeg to composite them
 */
async function createVideoWithOverlays(
    imagePath: string,
    audioPath: string,
    outputPath: string,
    duration: number,
    width: number,
    height: number,
    overlays?: ComposeOptions["overlays"]
): Promise<void> {
    const outputDir = path.dirname(outputPath);

    // Generate pill overlay PNGs - now returns array of paths (one per promo item)
    let overlayPaths: string[] = [];

    if (overlays && (overlays.discount || overlays.urgency || overlays.productName || overlays.price)) {
        try {
            const { generateOverlayImages } = await import('./pillOverlay');
            const result = await generateOverlayImages(overlays, outputDir);
            overlayPaths = result.overlayPaths;
            console.log("Generated pill overlay images:", overlayPaths.length);
        } catch (error) {
            console.error("Failed to generate pill overlays, using simple text:", error);
        }
    }

    // Build FFmpeg command with overlay inputs
    const inputs: string[] = ["-y", "-loop", "1", "-i", imagePath, "-i", audioPath];

    // Add all overlay image inputs
    for (const overlayPath of overlayPaths) {
        inputs.push("-i", overlayPath);
    }

    // Build complex filter graph - simple scale and center (NO zoom/motion)
    let filterComplex = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v0]`;

    // Position overlays on the video - stack them from top with spacing
    // Input indices: 0=video, 1=audio, 2+=overlay images
    let inputIdx = 2;
    let lastOutput = "v0";
    const startY = 0.06; // Start at 6% from top
    const spacing = 0.07; // 7% vertical spacing between overlays

    for (let i = 0; i < overlayPaths.length; i++) {
        const y = Math.floor(height * (startY + i * spacing));
        filterComplex += `;[${inputIdx}]scale=-1:-1[ov${inputIdx}];[${lastOutput}][ov${inputIdx}]overlay=(W-w)/2:${y}[v${inputIdx}]`;
        lastOutput = `v${inputIdx}`;
        inputIdx++;
    }

    const args = [
        ...inputs,
        "-filter_complex", filterComplex,
        "-map", `[${lastOutput}]`,
        "-map", "1:a",
        "-c:v", "libx264",
        "-t", String(duration),
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-af", `apad=whole_dur=${duration}`,
        outputPath,
    ];

    await runFFmpeg(args);
}

/**
 * Add PILL-SHAPED overlays to existing video (same as test mode!)
 * Uses sharp to generate pill PNGs, then FFmpeg filter_complex to overlay
 */
async function addOverlaysToVideo(
    inputVideo: string,
    audioPath: string,
    outputPath: string,
    duration: number,
    width: number,
    height: number,
    overlays?: ComposeOptions["overlays"]
): Promise<void> {
    const outputDir = path.dirname(outputPath);

    // Generate pill overlay PNGs - now returns array of paths (one per promo item)
    let overlayPaths: string[] = [];

    if (overlays && (overlays.discount || overlays.urgency || overlays.productName || overlays.price)) {
        try {
            const { generateOverlayImages } = await import('./pillOverlay');
            const result = await generateOverlayImages(overlays, outputDir);
            overlayPaths = result.overlayPaths;
            console.log("Generated pill overlay images for video:", overlayPaths.length);
        } catch (error) {
            console.error("Failed to generate pill overlays:", error);
        }
    }

    // Build FFmpeg command with overlay inputs
    const inputs: string[] = ["-y", "-i", inputVideo, "-i", audioPath];

    // Add all overlay image inputs
    for (const overlayPath of overlayPaths) {
        inputs.push("-i", overlayPath);
    }

    // Build complex filter graph to overlay pills on video
    let filterComplex = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v0]`;

    // Position overlays on the video - stack them from top with spacing
    // Input indices: 0=video, 1=audio, 2+=overlay images
    let inputIdx = 2;
    let lastOutput = "v0";
    const startY = 0.06; // Start at 6% from top
    const spacing = 0.07; // 7% vertical spacing between overlays

    for (let i = 0; i < overlayPaths.length; i++) {
        const y = Math.floor(height * (startY + i * spacing));
        filterComplex += `;[${inputIdx}]scale=-1:-1[ov${inputIdx}];[${lastOutput}][ov${inputIdx}]overlay=(W-w)/2:${y}[v${inputIdx}]`;
        lastOutput = `v${inputIdx}`;
        inputIdx++;
    }

    const args = [
        ...inputs,
        "-filter_complex", filterComplex,
        "-map", `[${lastOutput}]`,
        "-map", "1:a",
        "-c:v", "libx264",
        "-t", String(duration),
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-af", `apad=whole_dur=${duration}`,
        outputPath,
    ];

    console.log("Applying pill overlays to video...");
    await runFFmpeg(args);
    console.log("Pill overlays applied successfully!");
}

/**
 * Main compose function
 * Prioritizes Kling V1.6 (cheapest at ~$0.20/10sec), falls back to Replicate, then FFmpeg
 * testMode: Uses static image with overlays (FREE - no API calls)
 */
export async function composeVideo(options: ComposeOptions): Promise<string> {
    const {
        imagePath,
        imageBase64,
        audioPath,
        outputDir,
        filename,
        duration = 10,
        width = 1080,
        height = 1920,
        productContext,
        overlays,
        testMode = false,
    } = options;

    const outputPath = path.join(outputDir, `${filename}.mp4`);

    // TEST MODE: Skip video API, use static image with overlays (FREE!)
    if (testMode) {
        console.log("🧪 TEST MODE: Using static image with overlays (no API charges)");
        console.log("   - Scene enhancement will still run if selected");
        console.log("   - Audio will be generated");
        console.log("   - Text overlays will be applied");
        console.log("   - Video will be static (no motion)");

        await createVideoWithOverlays(imagePath, audioPath, outputPath, duration, width, height, overlays);
        console.log("🧪 TEST MODE video created successfully!");
        return outputPath;
    }

    // PRODUCTION MODE: Call Kling V2.5 Turbo ONCE ONLY (no retries, no fallbacks)
    const kling = await import('../kling/client');
    if (!kling.isConfigured()) {
        throw new Error("Kling API not configured. Set KLING_ACCESS_KEY_ID and KLING_ACCESS_KEY_SECRET in .env.local");
    }

    console.log("Using Kling V2.5 Turbo for video generation (ONE API CALL ONLY)...");

    // Create motion prompt - NO SPINNING/ORBITING! Use dolly, zoom, pan for subtle movement
    const prompt = productContext
        ? `Cinematic product commercial: ${productContext}. Camera slowly pushes closer to the product, gentle dolly in movement. Professional studio lighting, shallow depth of field, steady subtle motion, no spinning or orbiting.`
        : "Cinematic product commercial. Camera slowly pushes closer to the product, gentle dolly in movement. Professional studio lighting, steady subtle motion, no spinning or orbiting.";

    // Generate video with Kling V2.5 Turbo - 10 seconds (ONE CALL ONLY)
    const videoUrl = await kling.generateVideoFromImage({
        image: imageBase64 || '',
        imageType: 'base64',
        prompt,
        duration: 10, // 10 seconds
        mode: 'std', // Standard mode
        aspectRatio: '9:16', // Vertical for TikTok
        model: 'kling-v2-5-turbo', // V2.5 Turbo
    });

    // Download the generated video
    const tempVideoPath = path.join(outputDir, `${filename}_kling.mp4`);
    await kling.downloadVideo(videoUrl, tempVideoPath);

    // Add text overlays and audio
    await addOverlaysToVideo(tempVideoPath, audioPath, outputPath, duration, width, height, overlays);

    // Clean up temp file
    try {
        await fs.unlink(tempVideoPath);
    } catch {
        // Ignore cleanup errors
    }

    console.log("Video composed successfully with Kling V2.5 Turbo + text overlays");
    return outputPath;
}

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpeg(): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn(ffmpegPath, ["-version"]);
        proc.on("close", (code) => resolve(code === 0));
        proc.on("error", () => resolve(false));
    });
}
