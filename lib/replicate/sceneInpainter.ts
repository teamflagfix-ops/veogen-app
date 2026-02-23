/**
 * Replicate Scene Inpainting
 * 
 * Uses SDXL inpainting to naturally place products in scenes
 * Much better than simple cut & paste approach
 * 
 * Cost: ~$0.03-0.05 per image
 */

import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Initialize Replicate client
function getClient() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
        throw new Error("REPLICATE_API_TOKEN not set");
    }
    return new Replicate({ auth: token });
}

// Category-based background prompts for professional product photography
const CATEGORY_PROMPTS: Record<string, string> = {
    lifestyle: "elegant minimalist living room with modern furniture, soft natural window light, neutral warm tones, cozy aesthetic",
    kitchen: "beautiful marble kitchen countertop, warm morning sunlight, modern kitchen, clean surface, professional food photography",
    tech: "sleek modern desk setup, cool blue ambient lighting, minimalist tech aesthetic, dark gradient background, premium feel",
    fashion: "soft pink and white studio backdrop, fashion editorial lighting, elegant fabric textures, boutique display",
    beauty: "luxurious marble bathroom vanity, soft glowing lights, roses and petals, spa aesthetic, premium skincare display",
    fitness: "modern gym with motivational atmosphere, dynamic natural lighting, athletic energy, clean workout space",
    health: "clean white pharmacy or wellness backdrop, soft clinical lighting, fresh and pure aesthetic, medical grade feel",
    pets: "cozy home setting with pet-friendly decor, warm natural light, playful atmosphere, cute and inviting",
    automotive: "sleek garage or showroom setting, dramatic lighting, premium car aesthetic, chrome and metal accents",
    outdoor: "beautiful garden patio, natural sunlight through trees, rustic wooden surface, fresh outdoor atmosphere",
    baby: "soft pastel nursery setting, gentle natural light, plush textures, safe and cozy baby room aesthetic",
    jewelry: "luxurious velvet display, dramatic spotlight lighting, elegant dark background, premium jewelry showcase",
};

export type CategoryType = keyof typeof CATEGORY_PROMPTS;

/**
 * Check if Replicate is configured
 */
export function isConfigured(): boolean {
    return !!process.env.REPLICATE_API_TOKEN;
}

/**
 * Generate a scene with product using Replicate's img2img
 * This creates a cohesive scene rather than cutting/pasting
 */
export async function generateProductScene(
    productImageBase64: string,
    productDescription: string,
    scene: CategoryType,
    outputDir: string
): Promise<{ imagePath: string }> {
    const client = getClient();

    const scenePrompt = CATEGORY_PROMPTS[scene] || CATEGORY_PROMPTS.lifestyle;
    const prompt = `${productDescription} ${scenePrompt}, high quality, 4k, professional product photography, award winning`;

    console.log(`Generating ${scene} scene for: ${productDescription}`);
    console.log(`Using Replicate SDXL for image generation...`);

    try {
        // Convert base64 to data URI
        const imageDataUri = `data:image/png;base64,${productImageBase64}`;

        // Use SDXL img2img for better scene generation
        const output = await client.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    image: imageDataUri,
                    prompt: prompt,
                    negative_prompt: "low quality, blurry, distorted, ugly, bad lighting, amateur",
                    prompt_strength: 0.6, // Keep some of original product
                    num_inference_steps: 30,
                    guidance_scale: 7.5,
                    width: 768,
                    height: 1344, // 9:16 aspect ratio
                }
            }
        );

        // Get the output URL
        let imageUrl: string;
        if (Array.isArray(output)) {
            imageUrl = output[0] as string;
        } else if (typeof output === "string") {
            imageUrl = output;
        } else {
            throw new Error("Unexpected output format from Replicate");
        }

        console.log("Scene generated successfully!");

        // Download and save image
        const imagePath = path.join(outputDir, "scene_enhanced.png");
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Resize to TikTok format
        await sharp(buffer)
            .resize(1080, 1920, { fit: 'cover' })
            .png()
            .toFile(imagePath);

        console.log(`Scene saved to: ${imagePath}`);
        return { imagePath };

    } catch (error) {
        console.error("Replicate scene generation failed:", error);

        // Fallback: just resize original image to 9:16
        console.log("Falling back to original image...");
        const imagePath = path.join(outputDir, "scene_enhanced.png");
        const buffer = Buffer.from(productImageBase64, 'base64');

        await sharp(buffer)
            .resize(1080, 1920, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .png()
            .toFile(imagePath);

        return { imagePath };
    }
}

/**
 * Use Replicate's rembg for background removal + AI-generated backgrounds based on PRODUCT CATEGORY
 * Generates unique backgrounds each time that match the product type!
 */
export async function removeBackgroundAndComposite(
    productImageBase64: string,
    category: CategoryType,
    outputDir: string
): Promise<{ imagePath: string }> {
    const client = getClient();

    try {
        // Step 1: Remove background using rembg
        console.log("Removing product background with Replicate rembg...");
        const imageDataUri = `data:image/png;base64,${productImageBase64}`;

        const bgRemoved = await client.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            {
                input: {
                    image: imageDataUri
                }
            }
        );

        let cutoutUrl = typeof bgRemoved === "string" ? bgRemoved : (bgRemoved as string[])[0];
        console.log("Background removed successfully!");

        // Download cutout image
        const cutoutRes = await fetch(cutoutUrl as string);
        const cutoutBuffer = Buffer.from(await cutoutRes.arrayBuffer());

        // Step 2: AI-GENERATE unique background based on PRODUCT CATEGORY!
        console.log(`AI generating unique ${category} background...`);
        const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.lifestyle;
        console.log(`Category prompt: ${categoryPrompt.substring(0, 50)}...`);

        let sceneBuffer: Buffer;
        try {
            console.log("Calling Replicate SDXL...");
            const sceneOutput = await client.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                {
                    input: {
                        prompt: `${categoryPrompt}, empty surface for product placement, no products visible, professional photography, 4k quality, cinematic lighting`,
                        negative_prompt: "product, object, item, text, watermark, blurry, low quality, distorted, people, hands",
                        width: 768,
                        height: 1344, // 9:16 aspect ratio
                        num_inference_steps: 25,
                        guidance_scale: 7.5,
                    }
                }
            );

            console.log("SDXL output received:", typeof sceneOutput);
            let sceneUrl = Array.isArray(sceneOutput) ? sceneOutput[0] : sceneOutput;
            console.log("AI background generated! URL:", sceneUrl?.toString().substring(0, 50));

            const sceneRes = await fetch(sceneUrl as string);
            sceneBuffer = Buffer.from(await sceneRes.arrayBuffer());
            console.log(`Downloaded background: ${sceneBuffer.length} bytes`);
        } catch (sdxlError) {
            console.error("❌ SDXL generation failed:", sdxlError);
            // Fallback to stock background using CATEGORY not scene
            const backgroundPath = path.join(process.cwd(), "public", "backgrounds", `${category}.png`);
            console.log(`Trying stock background: ${backgroundPath}`);
            try {
                sceneBuffer = await fs.readFile(backgroundPath);
                console.log("Using stock background instead");
            } catch {
                // Create white gradient if nothing works
                console.log("No stock background found, using white gradient");
                sceneBuffer = await sharp({
                    create: {
                        width: 1080,
                        height: 1920,
                        channels: 3,
                        background: { r: 250, g: 250, b: 250 }
                    }
                }).png().toBuffer();
            }
        }

        // Resize background to 1080x1920
        const sceneFinal = await sharp(sceneBuffer)
            .resize(1080, 1920, { fit: 'cover' })
            .toBuffer();

        // Resize product cutout (larger - 65% of width for prominence)
        const productCutout = await sharp(cutoutBuffer)
            .resize(700, 700, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();

        const productMeta = await sharp(productCutout).metadata();

        // Step 3: Composite product onto scene (centered, 38% from top)
        const imagePath = path.join(outputDir, "scene_enhanced.png");

        await sharp(sceneFinal)
            .composite([{
                input: productCutout,
                left: Math.floor((1080 - (productMeta.width || 700)) / 2),
                top: Math.floor(1920 * 0.38),
            }])
            .png()
            .toFile(imagePath);

        console.log("Product composited onto scene successfully!");
        return { imagePath };

    } catch (error) {
        console.error("Replicate rembg failed:", error);

        // Fallback: just resize original image to 9:16
        console.log("Falling back to original image with white padding...");
        const imagePath = path.join(outputDir, "scene_enhanced.png");
        const buffer = Buffer.from(productImageBase64, 'base64');

        await sharp(buffer)
            .resize(1080, 1920, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .png()
            .toFile(imagePath);

        return { imagePath };
    }
}
