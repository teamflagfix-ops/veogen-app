//
// Generate Missing Scene Backgrounds
// Creates 9:16 vertical backgrounds for each scene until 5 total
//

import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { readFileSync } from "fs";

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join("=").trim();
    }
});

const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Scene prompts - solid tables, wall-to-wall, no glass, good product landing zone
const SCENE_PROMPTS: Record<string, string> = {
    living_room: "elegant modern living room, solid wooden coffee table in center, table goes wall to wall, warm natural lighting from large windows, neutral beige and cream colors, minimalist decor, empty table surface ready for product placement, professional interior photography, 4k quality, no glass table, no people, vertical composition",

    office: "professional home office, solid wood desk surface, desk extends across frame, soft natural window light, modern minimalist style, clean organized workspace, empty desk ready for product, warm neutral tones, no glass desk, no people, vertical composition, 4k quality",

    outdoor: "beautiful outdoor patio setting, solid wooden table surface, rustic farmhouse style, soft golden hour sunlight, green garden background blurred, empty table for product placement, lifestyle photography, no glass table, no people, vertical composition, 4k quality",

    gym: "clean modern home gym, solid bench or shelf surface, motivational atmosphere, natural lighting, fitness equipment blurred in background, empty surface for product, athletic aesthetic, no people, vertical composition, 4k quality",

    bathroom: "luxurious spa bathroom, solid marble countertop, countertop extends across frame, soft diffused lighting, clean white and beige tones, plants and candles decor, empty counter for product, spa aesthetic, no glass, no people, vertical composition, 4k quality",

    garage: "organized garage workshop, solid wooden workbench, workbench extends wall to wall, warm workshop lighting, tools organized in background, empty bench surface for product, DIY aesthetic, no people, vertical composition, 4k quality",
};

// How many each scene needs
const SCENES_NEEDED: Record<string, number> = {
    living_room: 3,
    office: 3,
    outdoor: 2,
    gym: 1,
    bathroom: 2,
    garage: 1,
};

async function generateBackground(scene: string, index: number): Promise<void> {
    const prompt = SCENE_PROMPTS[scene];
    if (!prompt) {
        console.log(`No prompt for scene: ${scene}`);
        return;
    }

    console.log(`\n🎨 Generating ${scene} background ${index}...`);

    try {
        const output = await client.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                    negative_prompt: "glass table, transparent surface, watermark, text, logo, people, hands, blurry, low quality, distorted, products, items on table, objects",
                    width: 768,
                    height: 1344, // 9:16 aspect ratio
                    num_inference_steps: 30,
                    guidance_scale: 7.5,
                }
            }
        );

        let imageUrl = Array.isArray(output) ? output[0] : output;
        console.log(`✅ Generated! Downloading...`);

        // Download image
        const response = await fetch(imageUrl as string);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Resize to exact 1080x1920
        const finalBuffer = await sharp(buffer)
            .resize(1080, 1920, { fit: 'cover' })
            .png()
            .toBuffer();

        // Save to backgrounds folder
        const bgFolder = path.join(process.cwd(), "public", "backgrounds", scene);
        const filename = `gen_bg${index}.png`;
        const filepath = path.join(bgFolder, filename);

        await fs.writeFile(filepath, finalBuffer);
        console.log(`💾 Saved: ${filepath}`);

    } catch (error) {
        console.error(`❌ Failed to generate ${scene} ${index}:`, error);
    }
}

async function main() {
    console.log("🚀 Starting background generation...\n");

    if (!process.env.REPLICATE_API_TOKEN) {
        console.error("❌ REPLICATE_API_TOKEN not set!");
        return;
    }

    for (const [scene, count] of Object.entries(SCENES_NEEDED)) {
        console.log(`\n📁 ${scene.toUpperCase()}: Need ${count} more backgrounds`);

        for (let i = 1; i <= count; i++) {
            await generateBackground(scene, i);
            // Small delay between requests
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log("\n✅ All backgrounds generated!");
}

main().catch(console.error);
