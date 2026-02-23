/**
 * Scene Enhancer - Places products into lifestyle scenes
 * 
 * Uses Replicate models:
 * 1. Background removal (~$0.001)
 * 2. Inpainting to place product in scene (~$0.003)
 * 
 * Total cost: ~$0.004 per image
 */

import Replicate from "replicate";
import fs from "fs/promises";
import path from "path";

// Scene presets with prompts
export const SCENE_PRESETS = {
    kitchen: {
        name: "Kitchen",
        prompt: "Modern luxury kitchen countertop, marble surface, warm lighting, professional photography, 8k, high quality",
        emoji: "🍳"
    },
    living_room: {
        name: "Living Room",
        prompt: "Elegant modern living room, coffee table, soft natural lighting, cozy interior, professional photography, 8k",
        emoji: "🛋️"
    },
    outdoor: {
        name: "Outdoor",
        prompt: "Beautiful outdoor setting, natural sunlight, garden background, lifestyle photography, 8k, vibrant",
        emoji: "🌳"
    },
    studio: {
        name: "Studio",
        prompt: "Professional product photography studio, soft gradient background, perfect lighting, commercial quality, 8k",
        emoji: "📸"
    },
    bathroom: {
        name: "Bathroom",
        prompt: "Modern spa-like bathroom, marble countertop, elegant fixtures, soft lighting, luxury interior, 8k",
        emoji: "🛁"
    },
    office: {
        name: "Office",
        prompt: "Modern minimalist desk setup, clean workspace, natural light from window, professional setting, 8k",
        emoji: "💼"
    }
} as const;

export type SceneType = keyof typeof SCENE_PRESETS;

function getClient() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
        throw new Error("REPLICATE_API_TOKEN not set");
    }
    return new Replicate({ auth: token });
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
 * Remove background from product image
 */
export async function removeBackground(
    imagePath?: string,
    imageBase64?: string
): Promise<string> {
    const replicate = getClient();
    const imageUri = await imageToDataUri(imagePath, imageBase64);

    console.log("Removing background from product image...");

    const output = await replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003" as `${string}/${string}`,
        {
            input: {
                image: imageUri
            }
        }
    );

    if (typeof output === "string") {
        return output;
    }

    throw new Error("Failed to remove background");
}

/**
 * Place product into a scene using inpainting
 */
export async function placeInScene(
    productImageUrl: string,
    scene: SceneType
): Promise<string> {
    const replicate = getClient();
    const sceneConfig = SCENE_PRESETS[scene];

    console.log(`Placing product in ${sceneConfig.name} scene...`);

    // Use SDXL to generate scene with product 
    const output = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}`,
        {
            input: {
                image: productImageUrl,
                prompt: `Product photography, ${sceneConfig.prompt}, product in center of frame, realistic, commercial quality`,
                negative_prompt: "blurry, low quality, distorted, ugly, watermark, text, bad composition",
                num_outputs: 1,
                guidance_scale: 7.5,
                num_inference_steps: 25,
                strength: 0.6, // Keep product recognizable
            }
        }
    );

    if (Array.isArray(output) && output.length > 0) {
        return output[0] as string;
    }

    throw new Error("Failed to place product in scene");
}

/**
 * Enhance product image by placing it in a lifestyle scene
 * Returns URL of enhanced image
 */
export async function enhanceProductImage(
    options: {
        imagePath?: string;
        imageBase64?: string;
        scene?: SceneType;
        outputDir?: string;
    }
): Promise<{ enhancedImageUrl: string; enhancedImagePath?: string }> {
    const { imagePath, imageBase64, scene = "studio", outputDir } = options;

    console.log(`Enhancing product image with ${SCENE_PRESETS[scene].name} scene...`);

    // Step 1: Remove background
    const transparentImageUrl = await removeBackground(imagePath, imageBase64);
    console.log("Background removed successfully");

    // Step 2: Place in scene
    const enhancedImageUrl = await placeInScene(transparentImageUrl, scene);
    console.log("Product placed in scene successfully");

    // Step 3: Download if output directory provided
    let enhancedImagePath: string | undefined;
    if (outputDir) {
        enhancedImagePath = path.join(outputDir, "enhanced_product.jpg");
        const response = await fetch(enhancedImageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(enhancedImagePath, buffer);
        console.log(`Enhanced image saved to: ${enhancedImagePath}`);
    }

    return { enhancedImageUrl, enhancedImagePath };
}

/**
 * Check if scene enhancement is available
 */
export function isConfigured(): boolean {
    return !!process.env.REPLICATE_API_TOKEN;
}
