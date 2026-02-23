/**
 * Stock Background Replacer
 * 
 * Uses pre-made stock backgrounds (FREE) instead of AI generation
 * 1. Removes background from product using sharp
 * 2. Composites product onto stock background
 * 
 * Cost: FREE!
 */

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Map of scene types to stock background files
const STOCK_BACKGROUNDS: Record<string, string> = {
    kitchen: "kitchen.png",
    living_room: "kitchen.png", // Use kitchen as fallback
    outdoor: "outdoor.png",
    studio: "studio.png",
    bathroom: "studio.png", // Use studio as fallback
    office: "studio.png",   // Use studio as fallback
};

export type SceneType = keyof typeof STOCK_BACKGROUNDS;

/**
 * Get the path to a stock background image
 */
function getBackgroundPath(scene: SceneType): string {
    const filename = STOCK_BACKGROUNDS[scene] || "studio.png";
    // Stock backgrounds are in public/backgrounds/
    return path.join(process.cwd(), "public", "backgrounds", filename);
}

/**
 * Remove background from product image using thresholding
 * Works best for products on white/light backgrounds
 */
async function removeProductBackground(
    imageBuffer: Buffer,
    outputDir: string
): Promise<string> {
    const outputPath = path.join(outputDir, "product_cutout.png");

    // Get image with alpha channel
    const image = sharp(imageBuffer).ensureAlpha();

    const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);

    // Remove near-white backgrounds (threshold approach)
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Calculate brightness
        const brightness = (r + g + b) / 3;

        // If pixel is very light (white background), make transparent
        if (brightness > 235) {
            pixels[i + 3] = 0; // Fully transparent
        } else if (brightness > 220) {
            // Soft edge for smoother transition
            pixels[i + 3] = Math.floor(255 * (235 - brightness) / 15);
        }
    }

    await sharp(Buffer.from(pixels), {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    })
        .png()
        .toFile(outputPath);

    console.log("Background removed from product");
    return outputPath;
}

/**
 * Composite product onto stock background
 */
async function compositeProduct(
    productPath: string,
    backgroundPath: string,
    outputPath: string,
    targetWidth: number = 1080,
    targetHeight: number = 1920
): Promise<void> {
    // Resize product to fit nicely (about 50% of width)
    const productSize = Math.floor(targetWidth * 0.55);

    const productBuffer = await sharp(productPath)
        .resize(productSize, productSize, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .toBuffer();

    const productMeta = await sharp(productBuffer).metadata();
    const prodWidth = productMeta.width || productSize;
    const prodHeight = productMeta.height || productSize;

    // Center product horizontally, position at 35% from top
    const left = Math.floor((targetWidth - prodWidth) / 2);
    const top = Math.floor(targetHeight * 0.35);

    // Load and resize background, then composite product
    await sharp(backgroundPath)
        .resize(targetWidth, targetHeight, { fit: 'cover' })
        .composite([{
            input: productBuffer,
            left,
            top,
        }])
        .png()
        .toFile(outputPath);

    console.log("Product composited onto stock background");
}

/**
 * Main function: Replace product background with stock scene
 * 
 * @param imageBase64 - Product image as base64
 * @param productDescription - Not used (for API compat)
 * @param scene - Scene type (kitchen, studio, outdoor, etc)
 * @param outputDir - Directory to save output
 */
export async function replaceBackground(
    imageBase64: string,
    productDescription: string,
    scene: SceneType,
    outputDir: string
): Promise<{ imagePath: string }> {
    console.log(`Using stock ${scene} background (FREE!)...`);

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const outputPath = path.join(outputDir, "scene_enhanced.png");

    // Get stock background path
    const backgroundPath = getBackgroundPath(scene);

    // Check if background exists
    try {
        await fs.access(backgroundPath);
    } catch {
        console.error(`Stock background not found: ${backgroundPath}`);
        // Just save original as PNG if no background
        await sharp(imageBuffer)
            .resize(1080, 1920, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
            .png()
            .toFile(outputPath);
        return { imagePath: outputPath };
    }

    // Step 1: Remove background from product
    let productPath: string;
    try {
        productPath = await removeProductBackground(imageBuffer, outputDir);
    } catch (error) {
        console.log("Background removal failed, using original:", error);
        productPath = path.join(outputDir, "product_original.png");
        await sharp(imageBuffer).png().toFile(productPath);
    }

    // Step 2: Composite product onto stock background
    await compositeProduct(productPath, backgroundPath, outputPath, 1080, 1920);

    console.log(`Scene replacement complete using stock background!`);
    return { imagePath: outputPath };
}

/**
 * Always configured (no API needed)
 */
export function isConfigured(): boolean {
    return true; // Stock backgrounds don't need API
}
