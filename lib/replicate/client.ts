/**
 * Replicate AI Video Client
 * 
 * Uses Alibaba Wan 2.5 Fast image-to-video model via Replicate
 * Generates multiple 5-second clips and stitches them together for 15 seconds
 * 
 * COST: ~$0.05 per 5-second clip = $0.15 for 15 seconds
 * (Much cheaper than Wan 2.6 at $0.10/second = $1.50 for 15 sec)
 */

import Replicate from "replicate";
import fs from "fs/promises";
import path from "path";

// Initialize Replicate client
function getClient() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
        throw new Error(
            "REPLICATE_API_TOKEN not set. Get your token from https://replicate.com/account/api-tokens"
        );
    }
    return new Replicate({ auth: token });
}

export interface VideoGenerationOptions {
    /** Path to the input image */
    imagePath?: string;
    /** Base64 encoded image */
    imageBase64?: string;
    /** Prompt describing the desired motion/scene */
    prompt?: string;
    /** Number of 5-second clips to generate (1, 2, or 3) */
    clipCount?: 1 | 2 | 3;
}

/**
 * Convert image to data URI
 */
async function imageToDataUri(imagePath?: string, imageBase64?: string): Promise<string> {
    if (imageBase64) {
        const format = imageBase64.startsWith("/9j/") ? "jpeg" : "png";
        return `data:image/${format};base64,${imageBase64}`;
    }

    if (imagePath) {
        const buffer = await fs.readFile(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    throw new Error("Either imagePath or imageBase64 must be provided");
}

/**
 * Generate a single 5-second video clip
 */
async function generateSingleClip(
    imageUri: string,
    prompt: string,
    clipNumber: number
): Promise<string> {
    const replicate = getClient();

    // Use wan-2.5-i2v-fast
    const model = "wan-video/wan-2.5-i2v-fast";

    // Vary the prompt slightly for each clip - NO SPINNING/ORBITING
    // Use dolly, zoom, pan for subtle professional movement
    const clipPrompts = [
        `${prompt}. Camera slowly pushes closer to product, soft professional lighting, steady subtle dolly in.`,
        `${prompt}. Gentle slow zoom in on product details, cinematic lighting, slight upward tilt.`,
        `${prompt}. Camera slowly pulls back, revealing product in context, professional studio lighting.`,
    ];

    const clipPrompt = clipPrompts[clipNumber - 1] || clipPrompts[0];

    console.log(`Generating clip ${clipNumber}/3 with Wan 2.5 Fast...`);

    const output = await replicate.run(model as `${string}/${string}`, {
        input: {
            image: imageUri,
            prompt: clipPrompt,
            num_frames: 81, // ~5 seconds
            negative_prompt: "blurry, low quality, distorted, ugly, watermark, text, static",
        }
    });

    // Extract video URL from output
    if (typeof output === "string") {
        return output;
    }
    if (Array.isArray(output) && output.length > 0) {
        return output[0] as string;
    }
    if (output && typeof output === "object") {
        const obj = output as Record<string, unknown>;
        if (obj.url) return obj.url as string;
        if (obj.output) return obj.output as string;
    }

    throw new Error("Failed to get video URL from clip generation");
}

/**
 * Generate video from image using multiple 5-second clips
 * Generates 3 clips (15 seconds total) for ~$0.15
 * 
 * Returns an array of video URLs that need to be stitched together
 */
export async function generateVideoFromImage(
    options: VideoGenerationOptions
): Promise<string[]> {
    const {
        imagePath,
        imageBase64,
        prompt = "Product showcase with steady camera movement, professional lighting, premium aesthetic, no spinning",
        clipCount = 3, // 3 clips = 15 seconds
    } = options;

    // Convert to data URI
    const imageUri = await imageToDataUri(imagePath, imageBase64);

    console.log(`Generating ${clipCount} × 5-second clips (~${clipCount * 5} seconds total)...`);
    console.log(`Estimated cost: ~$${(clipCount * 0.05).toFixed(2)}`);

    // Generate clips in parallel for speed
    const clipPromises = [];
    for (let i = 1; i <= clipCount; i++) {
        clipPromises.push(generateSingleClip(imageUri, prompt, i));
    }

    const clipUrls = await Promise.all(clipPromises);

    console.log(`Generated ${clipUrls.length} clips successfully`);

    return clipUrls;
}

/**
 * Download video from URL to local file
 */
export async function downloadVideo(
    videoUrl: string,
    outputPath: string
): Promise<void> {
    console.log(`Downloading video from: ${videoUrl}`);

    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    console.log(`Video saved to: ${outputPath}`);
}

/**
 * Check if Replicate is configured
 */
export function isConfigured(): boolean {
    return !!process.env.REPLICATE_API_TOKEN;
}
