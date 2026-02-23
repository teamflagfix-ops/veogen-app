/**
 * OpenAI DALL-E Background Generator
 * 
 * Uses DALL-E 3 to generate simple, clean backgrounds
 * Uses Replicate rembg for precise background removal (with retry)
 * Then composites product onto the generated background
 * 
 * Cost: DALL-E ~$0.04 + rembg ~$0.01 = ~$0.05 total
 */

import OpenAI from "openai";
import sharp from "sharp";
import path from "path";

// Initialize OpenAI client
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY not set");
    }
    return new OpenAI({ apiKey });
}

// Initialize Replicate for precise background removal
function getReplicateClient() {
    try {
        const Replicate = require("replicate");
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
            return null; // Return null if not configured
        }
        return new Replicate({ auth: token });
    } catch {
        return null;
    }
}

// DALL-E 3 Optimized Prompts for Product Photography Backgrounds
// CRITICAL: Surface must be STRAIGHT and HORIZONTAL - no tilted angles
// Surface takes up bottom half of frame for product placement at 40%
const CATEGORY_PROMPTS: Record<string, string> = {
    kitchen: "Photorealistic product photography: white marble countertop viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing counter directly, no tilt, no angle. Soft diffused lighting with gentle shadows. Completely empty surface, nothing on counter. Blurred kitchen background. Clean minimalist. High resolution.",

    living_room: "Photorealistic product photography: light oak wood table viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing table directly, no tilt, no angle. Warm natural light with soft shadows. Completely empty surface, nothing on table. Blurred neutral background. Clean minimalist. High resolution.",

    office: "Photorealistic product photography: dark walnut desk viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing desk directly, no tilt, no angle. Soft ambient lighting. Completely empty surface, nothing on desk. Blurred background. Clean minimalist. High resolution.",

    outdoor: "Photorealistic product photography: natural wood patio table viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing table directly, no tilt, no angle. Golden hour warm lighting. Completely empty surface. Blurred green garden background. Clean minimalist. High resolution.",

    gym: "Photorealistic product photography: flat black gym bench viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing bench directly, no tilt, no angle. Bright even lighting. Completely empty surface. Blurred gym background. Clean minimalist. High resolution.",

    garage: "Photorealistic product photography: clean metal workbench viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing workbench directly, no tilt, no angle. Bright overhead lighting. Completely empty surface. Blurred background. Clean industrial. High resolution.",

    bathroom: "Photorealistic product photography: white quartz counter viewed straight-on from front, perfectly horizontal surface taking up bottom half of frame. Camera at eye level facing counter directly, no tilt, no angle. Soft diffused lighting. Completely empty surface, no sink visible. Blurred neutral background. Clean minimalist. High resolution.",
};

export type CategoryType = keyof typeof CATEGORY_PROMPTS;

/**
 * Check if OpenAI is configured (only check OpenAI, rembg is optional)
 */
export function isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
}

/**
 * Try to remove background with rembg, with retry logic
 */
async function tryRemoveBackground(
    productImageBase64: string,
    retries: number = 2
): Promise<Buffer | null> {
    const replicate = getReplicateClient();
    if (!replicate) {
        console.log("⚠️ Replicate not configured, skipping background removal");
        return null;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔪 Removing background (attempt ${attempt}/${retries})...`);
            const imageDataUri = `data:image/png;base64,${productImageBase64}`;

            const bgRemoved = await replicate.run(
                "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
                {
                    input: {
                        image: imageDataUri
                    }
                }
            );

            const cutoutUrl = typeof bgRemoved === "string" ? bgRemoved : (bgRemoved as string[])[0];
            console.log("✅ Background removed!");

            const cutoutRes = await fetch(cutoutUrl as string);
            return Buffer.from(await cutoutRes.arrayBuffer());
        } catch (error) {
            console.error(`❌ rembg attempt ${attempt} failed:`, error);
            if (attempt < retries) {
                console.log("Waiting 3 seconds before retry...");
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    }
    return null;
}

/**
 * Generate background using stock images, remove product bg with rembg, composite
 * Uses pre-downloaded Unsplash images instead of DALL-E (saves ~$0.04 per video)
 */
export async function generateBackgroundAndComposite(
    productImageBase64: string,
    category: CategoryType,
    outputDir: string
): Promise<{ imagePath: string }> {
    const fs = await import('fs/promises');
    const imagePath = path.join(outputDir, "scene_enhanced.png");

    try {
        // Step 1: Select random stock background image (FREE!)
        console.log(`📸 Using stock ${category} background (FREE - no API call)...`);

        // Map category to folder name (fallback to kitchen if not found)
        const categoryFolder = ['kitchen', 'living_room', 'office', 'outdoor', 'gym', 'garage', 'bathroom'].includes(category)
            ? category
            : 'kitchen';

        const backgroundsDir = path.join(process.cwd(), 'public', 'backgrounds', categoryFolder);

        // List available backgrounds and pick random one
        let files: string[] = [];
        try {
            files = (await fs.readdir(backgroundsDir)).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
        } catch {
            console.log(`⚠️ No stock images found for ${category}, using kitchen fallback`);
            const fallbackDir = path.join(process.cwd(), 'public', 'backgrounds', 'kitchen');
            files = (await fs.readdir(fallbackDir)).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
        }

        if (files.length === 0) {
            throw new Error(`No background images found for category: ${category}`);
        }

        // Pick random background
        const randomBg = files[Math.floor(Math.random() * files.length)];
        const bgPath = path.join(backgroundsDir, randomBg);
        console.log(`   Selected: ${randomBg} (1 of ${files.length} available)`);

        const bgBuffer = await fs.readFile(bgPath);
        console.log(`✅ Stock background loaded: ${bgBuffer.length} bytes`);

        // Step 2: Try to remove product background (may fail, that's OK)
        const cutoutBuffer = await tryRemoveBackground(productImageBase64);

        // Step 3: Resize background to 1080x1920
        const sceneFinal = await sharp(bgBuffer)
            .resize(1080, 1920, { fit: 'cover' })
            .toBuffer();

        // Step 4: Prepare product image - BIGGER SIZE
        let productImage: Buffer;
        if (cutoutBuffer) {
            // Use the cut-out product (no background) - BIGGER for visibility
            productImage = await sharp(cutoutBuffer)
                .resize(850, 850, { fit: 'inside', withoutEnlargement: true })
                .toBuffer();
            console.log("Using background-removed product image");
        } else {
            // Use original product (with its background)
            productImage = await sharp(Buffer.from(productImageBase64, 'base64'))
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toBuffer();
            console.log("Using original product image (no bg removal)");
        }

        const productMeta = await sharp(productImage).metadata();

        // Step 5: Composite product onto scene - Position so product SITS ON the surface
        // Place product at ~55% from top so it sits lower on the counter
        const productHeight = productMeta.height || 850;
        const productTop = Math.floor(1920 * 0.55) - Math.floor(productHeight * 0.5); // Center product at 55% mark

        await sharp(sceneFinal)
            .composite([{
                input: productImage,
                left: Math.floor((1080 - (productMeta.width || 850)) / 2),
                top: productTop,
            }])
            .png()
            .toFile(imagePath);

        console.log("✅ Product composited onto DALL-E background!");
        return { imagePath };

    } catch (error) {
        console.error("❌ Background generation failed:", error);

        // Fallback: gradient background with product
        console.log("Falling back to gradient background...");
        const buffer = Buffer.from(productImageBase64, 'base64');

        // Create simple gradient background
        const gradientBg = await sharp({
            create: {
                width: 1080,
                height: 1920,
                channels: 3,
                background: { r: 245, g: 245, b: 250 }
            }
        }).png().toBuffer();

        // Resize product
        const productResized = await sharp(buffer)
            .resize(700, 700, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();

        const productMeta = await sharp(productResized).metadata();

        // Composite
        await sharp(gradientBg)
            .composite([{
                input: productResized,
                left: Math.floor((1080 - (productMeta.width || 700)) / 2),
                top: Math.floor(1920 * 0.40),
            }])
            .png()
            .toFile(imagePath);

        return { imagePath };
    }
}
