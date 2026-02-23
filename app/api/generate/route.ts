import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { generateSalesScript, ProductCategory, VoiceOption } from "@/lib/ai/scriptWriter";
import { generateVoiceover, getRecommendedVoice } from "@/lib/ai/voiceGenerator";
import { composeVideo, checkFFmpeg } from "@/lib/video/composer";
import { enhanceWithScene, SceneType, isConfigured as isOpenAIConfigured } from "@/lib/openai/sceneEnhancer";

export async function POST(request: NextRequest) {
    try {
        // Check FFmpeg first
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
            return NextResponse.json(
                { error: "FFmpeg is not installed. Please install FFmpeg to generate videos." },
                { status: 500 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const image = formData.get("image") as File;
        const title = formData.get("title") as string;
        const price = formData.get("price") as string || ""; // Optional
        const discount = formData.get("discount") as string || ""; // e.g., "50% OFF"
        const description = formData.get("description") as string || "";

        // Urgency text - from form or auto-generate if discount is set
        let urgencyText = formData.get("urgencyText") as string || "";
        if (!urgencyText && discount) {
            // Auto-generate urgency if discount is provided
            const urgencyOptions = [
                "ENDS TODAY!",
                "LIMITED TIME!",
                "SALE ENDS TONIGHT!",
                "DON'T MISS OUT!",
                "LAST CHANCE!",
            ];
            urgencyText = urgencyOptions[Math.floor(Math.random() * urgencyOptions.length)];
        }

        // New options for professional TikTok ads
        const category = (formData.get("category") as ProductCategory) || "lifestyle";
        const selectedVoice = formData.get("voice") as VoiceOption | null;
        const testMode = formData.get("testMode") === "true";
        const useAIScene = formData.get("useAIScene") === "true"; // NEW: toggle between approaches

        if (!image || !title) {
            return NextResponse.json(
                { error: "Missing required fields: image and title" },
                { status: 400 }
            );
        }

        // Create unique ID for this generation
        const id = uuidv4();

        // Create output directory
        const outputDir = path.join(process.cwd(), "public", "output", id);
        await mkdir(outputDir, { recursive: true });

        // Save uploaded image
        let imageBuffer = Buffer.from(await image.arrayBuffer());
        const imageExt = image.name.split(".").pop() || "jpg";
        let imagePath = path.join(outputDir, `product.${imageExt}`);
        await writeFile(imagePath, imageBuffer);

        // Debug: Log category
        console.log(`Product category: "${category}"`);
        console.log(`Scene approach: ${useAIScene ? "AI SCENE GENERATION" : "COMPOSITE"}`);

        // Choose approach based on toggle
        if (useAIScene) {
            // NEW APPROACH: AI generates scene with product placed in it
            console.log(`Step 0: AI Scene Generation with Replicate SDXL (~$0.04)...`);
            try {
                const { generateAIScene, isAISceneAvailable } = await import("@/lib/replicate/aiSceneGenerator");

                if (isAISceneAvailable()) {
                    console.log("Calling AI Scene Generator...");
                    const sceneResult = await generateAIScene(
                        imageBuffer.toString("base64"),
                        title,
                        category as any,
                        outputDir
                    );

                    if (sceneResult.imagePath) {
                        imagePath = sceneResult.imagePath;
                        imageBuffer = await import("fs/promises").then(fs => fs.readFile(imagePath));
                        console.log(`✅ AI scene generated for ${category}!`);
                    }
                } else {
                    console.log("❌ Replicate not configured - REPLICATE_API_TOKEN missing!");
                }
            } catch (error) {
                console.error("❌ AI scene generation failed:", error);
            }
        } else {
            // OLD APPROACH: Composite product onto pre-made backgrounds
            console.log(`Step 0: Composite Background with DALL-E 3 for ${category} product (~$0.04)...`);
            try {
                const { generateBackgroundAndComposite, isConfigured } = await import("@/lib/openai/backgroundGenerator");

                console.log(`OpenAI configured: ${isConfigured()}`);

                if (isConfigured()) {
                    console.log("Calling DALL-E background generator...");
                    const sceneResult = await generateBackgroundAndComposite(
                        imageBuffer.toString("base64"),
                        category as any, // Use product category for background prompt
                        outputDir
                    );

                    if (sceneResult.imagePath) {
                        imagePath = sceneResult.imagePath;
                        imageBuffer = await import("fs/promises").then(fs => fs.readFile(imagePath));
                        console.log(`✅ Product placed in DALL-E ${category} scene!`);
                    }
                } else {
                    console.log("❌ OpenAI not configured - OPENAI_API_KEY missing!");
                }
            } catch (error) {
                console.error("❌ Composite background generation failed:", error);
            }
        }

        console.log("Step 1: Generating TikTok-style sales script...");
        // Generate professional TikTok-style script with Hook → Body → CTA
        const script = await generateSalesScript(
            title,
            price,
            discount, // e.g., "50% OFF"
            description,
            urgencyText, // e.g., "ENDS TODAY!"
            category
        );

        console.log("Script generated with", script.segments.length, "segments");
        console.log("Total duration:", script.totalDuration, "seconds");

        // Determine voice - use selected, suggested, or category-based
        const voice = selectedVoice || script.suggestedVoice as VoiceOption || getRecommendedVoice(category);

        // Generate voiceover (even in test mode - only skip video API)
        console.log("Step 2: Generating voiceover with voice:", voice);
        const audioPath = await generateVoiceover(
            script.fullScript,
            outputDir,
            "voiceover",
            voice,
            script.segments[0]?.voiceTone || "excited"
        );

        console.log(testMode ? "Step 3: TEST MODE - Creating static video with overlays..." : "Step 3: Composing 10-second video with Kling V1.6 + text overlays...");
        // Compose final video (with Kling V1.6 or static in test mode)
        const videoPath = await composeVideo({
            imagePath,
            imageBase64: imageBuffer.toString("base64"),
            audioPath,
            outputDir,
            filename: "final",
            duration: 10, // 10 second video
            productContext: `${title} - ${description}. Category: ${category}`,
            overlays: {
                discount: discount || undefined,
                urgency: urgencyText || undefined,
                productName: title,
                price: price,
            },
            testMode, // Skip video API in test mode
        });

        // Store result with overlay data for CSS rendering
        const result = {
            id,
            videoUrl: `/output/${id}/final.mp4`,
            caption: script.caption,
            hashtags: script.hashtags,
            productTitle: title,
            createdAt: new Date().toISOString(),
            // Script info
            scriptDuration: script.totalDuration,
            voice: voice,
            category: category,
            // Overlay data for CSS text overlays on frontend
            overlays: {
                discount: discount || null,
                urgency: urgencyText || null,
                productName: title,
                price: price,
            },
        };

        // Save result to JSON file for persistence
        const resultPath = path.join(outputDir, "result.json");
        await writeFile(resultPath, JSON.stringify(result, null, 2));

        console.log("Video generation complete:", id);
        console.log("Voice used:", voice, "| Category:", category);

        return NextResponse.json({ id, success: true });

    } catch (error) {
        console.error("Generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate video" },
            { status: 500 }
        );
    }
}
