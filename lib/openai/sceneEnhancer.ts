/**
 * OpenAI Scene Enhancer
 * 
 * Uses OpenAI's image editing to add backgrounds to product images
 * Cost: ~$0.02-0.04 per image edit
 * 
 * Takes the user's actual product image and places it in a scene
 */

import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { toFile } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Scene background prompts
export const SCENE_PROMPTS = {
    kitchen: "Place this product on a beautiful modern kitchen marble countertop with warm natural lighting, professional product photography style",
    living_room: "Place this product on an elegant wooden coffee table in a cozy modern living room with soft natural lighting from a window",
    outdoor: "Place this product on a rustic outdoor table in a beautiful garden patio setting with natural sunlight and soft bokeh background",
    studio: "Place this product in a professional photography studio with a clean gradient background and perfect soft lighting",
    bathroom: "Place this product on a white marble bathroom countertop in a luxury spa-like setting with elegant fixtures and soft lighting",
    office: "Place this product on a minimalist white desk in a modern home office with natural light from a window",
} as const;

export type SceneType = keyof typeof SCENE_PROMPTS;

/**
 * Add a background scene to the user's product image
 * Uses OpenAI's image editing capabilities
 */
export async function enhanceWithScene(
    imageBase64: string,
    productDescription: string,
    scene: SceneType,
    outputDir?: string
): Promise<{ imageUrl: string; imagePath?: string }> {
    const scenePrompt = SCENE_PROMPTS[scene];

    // Create the edit prompt
    const prompt = `${scenePrompt}. The product is: ${productDescription}. Keep the product as the main focus, clearly visible and well-lit. High-end commercial photography style.`;

    console.log(`Enhancing product image with ${scene} scene...`);
    console.log(`Prompt: ${prompt.substring(0, 80)}...`);

    try {
        // Convert image to PNG format using sharp (DALL-E 2 requires PNG)
        const originalBuffer = Buffer.from(imageBase64, 'base64');

        // Use sharp to convert to PNG, resize to 1024x1024, and ensure < 4MB
        const pngBuffer = await sharp(originalBuffer)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
            })
            .png({ quality: 90 })
            .toBuffer();

        console.log(`Converted image to PNG: ${Math.round(pngBuffer.length / 1024)}KB`);

        // Create file for OpenAI
        const imageFile = await toFile(pngBuffer, 'product.png', { type: 'image/png' });

        // Use OpenAI image edit
        const response = await openai.images.edit({
            model: "dall-e-2", // DALL-E 2 supports editing
            image: imageFile,
            prompt,
            n: 1,
            size: "1024x1024",
        });

        if (!response.data || response.data.length === 0) {
            throw new Error("No data returned from image edit");
        }

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
            throw new Error("No image URL returned from edit");
        }

        console.log("Image enhanced successfully with scene!");

        // Download and save if output directory provided
        let imagePath: string | undefined;
        if (outputDir) {
            imagePath = path.join(outputDir, "scene_enhanced.png");
            const imageResponse = await fetch(imageUrl);
            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            await fs.writeFile(imagePath, buffer);
            console.log(`Enhanced image saved to: ${imagePath}`);
        }

        return { imageUrl, imagePath };

    } catch (error) {
        // If edit fails, fall back to generation with description
        console.log("Image edit failed, falling back to scene generation:", error);
        return generateSceneImage(productDescription, scene, outputDir);
    }
}

/**
 * Fallback: Generate a scene image (when editing fails)
 */
export async function generateSceneImage(
    productDescription: string,
    scene: SceneType,
    outputDir?: string
): Promise<{ imageUrl: string; imagePath?: string }> {
    const scenePrompt = SCENE_PROMPTS[scene];

    const prompt = `Professional product photography: A ${productDescription} displayed ${scenePrompt.toLowerCase()}. The product is the clear focal point, commercial quality, 4K.`;

    console.log(`Generating ${scene} scene for: ${productDescription}`);

    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
    });

    if (!response.data || response.data.length === 0) {
        throw new Error("No data returned from DALL-E");
    }

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
        throw new Error("No image URL returned from DALL-E");
    }

    let imagePath: string | undefined;
    if (outputDir) {
        imagePath = path.join(outputDir, "scene_enhanced.png");
        const imageResponse = await fetch(imageUrl);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        await fs.writeFile(imagePath, buffer);
    }

    return { imageUrl, imagePath };
}

/**
 * Check if OpenAI is configured
 */
export function isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
}
