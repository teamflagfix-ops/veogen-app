//
// Quick Photo Placement Test API
// Generates EXACT 9:16 frames that video API will receive
// Click to zoom and verify product placement
//

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import Replicate from "replicate";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get("image") as File;
        const category = formData.get("category") as string;

        if (!imageFile) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!category) {
            return NextResponse.json({ error: "Please select a category first" }, { status: 400 });
        }

        // Create test output directory
        const testDir = path.join(process.cwd(), "public", "test-placements");
        if (!existsSync(testDir)) {
            await mkdir(testDir, { recursive: true });
        }

        // Save original image
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const testId = Date.now().toString();
        const inputPath = path.join(testDir, `${testId}_input.png`);
        await writeFile(inputPath, buffer);

        // Step 1: Remove background using Replicate rembg
        let cutoutBuffer: Buffer;

        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (replicateToken) {
            try {
                console.log("Removing background with Replicate rembg...");
                const client = new Replicate({ auth: replicateToken });
                const base64Image = buffer.toString("base64");
                const imageDataUri = `data:image/png;base64,${base64Image}`;

                const bgRemoved = await client.run(
                    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
                    {
                        input: {
                            image: imageDataUri
                        }
                    }
                );

                const cutoutUrl = typeof bgRemoved === "string" ? bgRemoved : (bgRemoved as string[])[0];
                const cutoutRes = await fetch(cutoutUrl as string);
                cutoutBuffer = Buffer.from(await cutoutRes.arrayBuffer());

                // Save cutout
                const cutoutPath = path.join(testDir, `${testId}_cutout.png`);
                await writeFile(cutoutPath, cutoutBuffer);
                console.log("Background removed successfully!");
            } catch (err) {
                console.error("Rembg failed, using original:", err);
                cutoutBuffer = buffer;
            }
        } else {
            console.log("No Replicate token, using original image");
            cutoutBuffer = buffer;
        }

        // Resize product cutout for 9:16 frame (larger - 65% of width for prominence)
        // This matches the EXACT sizing used in video generation
        const productCutout = await sharp(cutoutBuffer)
            .resize(700, 700, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();

        const productMeta = await sharp(productCutout).metadata();

        // Step 2: Get ALL background images for the selected category
        const bgFolder = path.join(process.cwd(), "public", "backgrounds", category);

        if (!existsSync(bgFolder)) {
            return NextResponse.json({
                error: `No backgrounds found for category: ${category}`
            }, { status: 404 });
        }

        // List all PNG files in the category folder
        const files = await readdir(bgFolder);
        const bgFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

        console.log(`Found ${bgFiles.length} backgrounds for ${category}`);

        // Step 3: Create EXACT 9:16 frames (1080x1920) - same as video API receives
        const results: Array<{
            id: string;
            name: string;
            previewUrl: string;
            fullUrl: string;
            success: boolean;
        }> = [];

        for (const bgFile of bgFiles) {
            try {
                const bgPath = path.join(bgFolder, bgFile);
                const bgBuffer = await readFile(bgPath);

                // Resize background to EXACT 9:16 TikTok format (1080x1920)
                const bgResized = await sharp(bgBuffer)
                    .resize(1080, 1920, { fit: 'cover' })
                    .toBuffer();

                // Composite product onto background - SAME positioning as video generation
                // Product centered horizontally, 38% from top (same as sceneInpainter.ts)
                const composite = await sharp(bgResized)
                    .composite([{
                        input: productCutout,
                        left: Math.floor((1080 - (productMeta.width || 700)) / 2),
                        top: Math.floor(1920 * 0.38),
                    }])
                    .png()
                    .toBuffer();

                // Save FULL SIZE preview (1080x1920)
                const fullName = `${testId}_${bgFile.replace(/\.[^/.]+$/, '')}_full.png`;
                const fullPath = path.join(testDir, fullName);
                await writeFile(fullPath, composite);

                // Also create a smaller thumbnail for the grid
                const thumbnail = await sharp(composite)
                    .resize(180, 320, { fit: 'cover' })
                    .toBuffer();

                const thumbName = `${testId}_${bgFile.replace(/\.[^/.]+$/, '')}_thumb.png`;
                const thumbPath = path.join(testDir, thumbName);
                await writeFile(thumbPath, thumbnail);

                // Clean up filename for display
                const displayName = bgFile
                    .replace(/\.[^/.]+$/, '')
                    .replace(/_/g, ' ')
                    .replace(/ai bg/i, 'BG ');

                results.push({
                    id: bgFile,
                    name: displayName,
                    previewUrl: `/test-placements/${thumbName}`,
                    fullUrl: `/test-placements/${fullName}`,
                    success: true,
                });
            } catch (err) {
                console.error(`Failed to create preview for ${bgFile}:`, err);
                results.push({
                    id: bgFile,
                    name: bgFile,
                    previewUrl: `/test-placements/${testId}_input.png`,
                    fullUrl: `/test-placements/${testId}_input.png`,
                    success: false,
                });
            }
        }

        return NextResponse.json({
            success: true,
            testId,
            category,
            totalBackgrounds: bgFiles.length,
            originalUrl: `/test-placements/${testId}_input.png`,
            cutoutUrl: `/test-placements/${testId}_cutout.png`,
            results,
        });
    } catch (error) {
        console.error("Test placement error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Test placement failed" },
            { status: 500 }
        );
    }
}
