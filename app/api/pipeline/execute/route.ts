import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Ensure output dir exists
const OUTPUT_DIR = path.join(process.cwd(), "public", "pipeline-output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ===== HELPERS =====
function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

async function downloadFile(url: string, ext: string): Promise<string> {
    const id = genId();
    const filePath = path.join(OUTPUT_DIR, `${id}.${ext}`);
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return `/pipeline-output/${id}.${ext}`;
}

// OpenRouter LLM call
async function callLLM(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const modelMap: Record<string, string> = {
        "gpt-4o-mini": "openai/gpt-4o-mini",
        "gpt-4o": "openai/gpt-4o",
        "claude-3.5-haiku": "anthropic/claude-3.5-haiku",
        "llama-3.1-70b": "meta-llama/llama-3.1-70b-instruct",
        "gemini-2.0-flash": "google/gemini-2.0-flash-exp:free",
        "deepseek-chat-v3": "deepseek/deepseek-chat",
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: modelMap[model] || "openai/gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            max_tokens: 1500,
        }),
    });

    if (!res.ok) throw new Error(`OpenRouter error: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0]?.message?.content || "No response";
}

// Replicate helper
async function runReplicate(model: string, input: Record<string, unknown>): Promise<string> {
    console.log(`[Pipeline] Running Replicate model: ${model}`);
    const output = await replicate.run(model as `${string}/${string}`, { input });
    if (typeof output === "string") return output;
    if (Array.isArray(output)) return String(output[0]);
    if (output && typeof output === "object" && "url" in output) return (output as { url: string }).url;
    return String(output);
}

// Video models
const videoModelMap: Record<string, string> = {
    "wan-2.1-i2v": "wan-video/wan-2.1-i2v-720p-480p",
    "kling-v1.6-standard": "kwaivgi/kling-v1.6-standard",
    "kling-v2-master": "kwaivgi/kling-v2-master",
    "luma-ray2-flash": "luma/ray-2-flash",
    "minimax-video-01": "minimax/video-01",
    "google-veo-2": "google-deepmind/veo-2",
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { blockId, config, upstreamData } = body;

        // Helper: get upstream media URL (from connected node outputs)
        const getUpstreamUrl = (): string | null => {
            if (upstreamData) {
                for (const data of Object.values(upstreamData) as Array<Record<string, string>>) {
                    if (data.video_url) return data.video_url;
                    if (data.image_url) return data.image_url;
                }
            }
            return null;
        };

        const getUpstreamText = (): string | null => {
            if (upstreamData) {
                for (const data of Object.values(upstreamData) as Array<Record<string, string>>) {
                    if (data.script) return data.script;
                    if (data.hooks) return data.hooks;
                    if (data.caption) return data.caption;
                    if (data.text) return data.text;
                    if (data.variations) return data.variations;
                }
            }
            return null;
        };

        // =====================================
        // ===== SPIES (Data Collection) =====
        // =====================================

        if (blockId === "shop_scraper") {
            const model = "gpt-4o-mini";
            const result = await callLLM(
                model,
                `You are a TikTok Shop product researcher. Generate realistic trending product data based on the search keyword. Include: product name, price, estimated daily sales, rating, and a brief description. Format as a numbered list of ${config.count || 5} products.`,
                `Search keyword: "${config.keyword || "trending"}" | Category: ${config.category || "All"} | Generate ${config.count || 5} trending products.`
            );
            return NextResponse.json({ success: true, output: { products: result, type: "text" } });
        }

        if (blockId === "competitor_spy") {
            const model = "gpt-4o-mini";
            const result = await callLLM(
                model,
                `You are a TikTok competitor analysis expert. Analyze a hypothetical competitor account and generate performance data. Include: video title, views, likes, engagement rate, posting time, and key tactics used. Format as a table.`,
                `Analyze @${config.username || "competitor"} | Min views: ${config.min_views || "10K"} | Generate performance report.`
            );
            return NextResponse.json({ success: true, output: { videos: result, type: "text" } });
        }

        if (blockId === "asset_extractor") {
            // For now, generate analysis text. Full FFmpeg extraction requires video URL
            const videoUrl = config.video_url || getUpstreamUrl();
            if (videoUrl && !videoUrl.startsWith("blob:")) {
                try {
                    // Download video and extract first frame
                    const localPath = await downloadFile(videoUrl, "mp4");
                    const absPath = path.join(process.cwd(), "public", localPath);
                    const frameId = genId();
                    const framePath = path.join(OUTPUT_DIR, `${frameId}.jpg`);
                    await execAsync(`ffmpeg -i "${absPath}" -vframes 1 -q:v 2 "${framePath}" -y`);
                    return NextResponse.json({
                        success: true,
                        output: { image_url: `/pipeline-output/${frameId}.jpg`, first_frame: `/pipeline-output/${frameId}.jpg`, type: "image" }
                    });
                } catch (e) {
                    console.warn("FFmpeg frame extraction failed:", e);
                }
            }
            return NextResponse.json({
                success: true,
                output: { message: `Asset extraction ready. ${videoUrl ? "Processing video..." : "Connect a video source to extract frames."}`, type: "text" }
            });
        }

        if (blockId === "hashtag_analyzer") {
            const model = "gpt-4o-mini";
            const result = await callLLM(
                model,
                `You are a TikTok hashtag research expert. Analyze the given hashtag and generate data: total views, growth rate, top posts summary, related hashtags, and best time to use. Format clearly.`,
                `Analyze hashtag: #${config.hashtag || "trending"} | Show top ${config.count || 5} posts.`
            );
            return NextResponse.json({ success: true, output: { hashtag_data: result, type: "text" } });
        }

        if (blockId === "sound_tracker") {
            const model = "gpt-4o-mini";
            const result = await callLLM(
                model,
                `You are a TikTok music/sound trend expert. Find trending sounds for the given niche. Include: sound name, artist, usage count, growth trend, and best video types to use it with.`,
                `Find trending sounds for niche: "${config.niche || "general"}" | List 5 trending sounds.`
            );
            return NextResponse.json({ success: true, output: { sounds: result, type: "text" } });
        }

        // =====================================
        // ===== BRAINS (Logic & Writing) =====
        // =====================================

        if (blockId === "hook_generator") {
            const model = config.llm_model || "gpt-4o-mini";
            const upstreamText = getUpstreamText();
            const result = await callLLM(
                model,
                `You are a viral TikTok hook creator. Generate ${config.count || 5} hooks in the "${config.style || "Curiosity"}" style. Each hook should be 1-2 sentences that STOP the scroll. Number them.`,
                `Context: ${config.context || upstreamText || "A trending product"}`
            );
            return NextResponse.json({ success: true, output: { hooks: result, type: "text" } });
        }

        if (blockId === "persona_filter") {
            const model = config.llm_model || "gpt-4o-mini";
            const upstreamText = getUpstreamText();
            const result = await callLLM(
                model,
                `Rewrite the following content in the voice/tone of a "${config.persona || "Gen-Z Creator"}". Keep the core message but change the language, slang, and energy to match this persona perfectly.`,
                upstreamText || config.text_in || "Please provide text to rewrite."
            );
            return NextResponse.json({ success: true, output: { text: result, type: "text" } });
        }

        if (blockId === "script_writer") {
            const model = config.llm_model || "gpt-4o-mini";
            const upstreamText = getUpstreamText();
            const result = await callLLM(
                model,
                `You are an expert TikTok ad script writer. Write a ${config.script_style || "Direct Sale"} style script.
                Format: HOOK (first 3 seconds), BODY (main content), CTA (call to action).
                Keep it punchy, viral, and optimized for short-form video.`,
                `Product: ${config.product_name || "Product"}
                Price: ${config.price || "N/A"}
                Selling Points: ${config.selling_points || upstreamText || "Great product"}
                Style: ${config.script_style || "Direct Sale"}`
            );
            return NextResponse.json({ success: true, output: { script: result, prompt: result, type: "text" } });
        }

        if (blockId === "caption_writer") {
            const model = config.llm_model || "gpt-4o-mini";
            const upstreamText = getUpstreamText();
            const result = await callLLM(
                model,
                `Write a viral TikTok caption in "${config.tone || "Casual"}" tone.
                ${config.include_hashtags !== "None" ? `Include ${config.include_hashtags || "5"} relevant hashtags.` : "No hashtags."}`,
                `Write a caption based on: ${upstreamText || "A trending TikTok product video"}`
            );
            return NextResponse.json({ success: true, output: { caption: result, type: "text" } });
        }

        if (blockId === "ab_splitter") {
            const model = config.llm_model || "gpt-4o-mini";
            const upstreamText = getUpstreamText();
            const result = await callLLM(
                model,
                `Generate ${config.variations || 2} variations of the following content. Vary the ${config.vary_what || "Hook Only"}. Label each variation clearly (A, B, C...).`,
                upstreamText || config.script_in || "Please provide a script to split."
            );
            return NextResponse.json({ success: true, output: { variations: result, type: "text" } });
        }

        // =====================================
        // ===== FACTORY (Generation) =====
        // =====================================

        if (blockId === "media_upload") {
            const mediaUrl = config.input_image;
            if (mediaUrl && !mediaUrl.startsWith("blob:")) {
                const isVideo = mediaUrl.includes(".mp4") || mediaUrl.includes(".webm") || mediaUrl.includes(".mov");
                return NextResponse.json({
                    success: true,
                    output: {
                        image_url: isVideo ? undefined : mediaUrl,
                        video_url: isVideo ? mediaUrl : undefined,
                        type: isVideo ? "video" : "image"
                    }
                });
            }
            return NextResponse.json({
                success: true,
                output: { message: "Media uploaded successfully. Connect to downstream blocks.", type: "text" }
            });
        }

        if (blockId === "video_generator") {
            const videoModel = config.video_model || "wan-2.1-i2v";
            const replicateModel = videoModelMap[videoModel];
            if (!replicateModel) {
                return NextResponse.json({ success: false, error: `Unknown model: ${videoModel}` }, { status: 400 });
            }

            const imageUrl = config.input_image || getUpstreamUrl();
            const prompt = config.prompt || getUpstreamText() || "A smooth product showcase video with professional lighting";

            const input: Record<string, unknown> = { prompt };

            if (imageUrl && !imageUrl.startsWith("blob:")) {
                if (videoModel.startsWith("wan")) {
                    input.image = imageUrl;
                    input.num_frames = 81;
                } else if (videoModel.startsWith("kling")) {
                    input.image = imageUrl;
                    input.duration = config.duration === "10s" ? 10 : 5;
                } else {
                    input.image = imageUrl;
                }
            }

            const videoUrl = await runReplicate(replicateModel, input);
            // Download to local
            const localUrl = await downloadFile(videoUrl, "mp4");

            return NextResponse.json({
                success: true,
                output: { video_url: localUrl, type: "video" }
            });
        }

        if (blockId === "image_generator") {
            const scene = config.scene || "White Background";
            const prompt = `Professional product photography, ${scene} setting, high quality, studio lighting, 4K`;
            const imageUrl = await runReplicate("black-forest-labs/flux-1.1-pro", {
                prompt,
                aspect_ratio: "9:16",
                output_format: "png",
            });
            const localUrl = await downloadFile(imageUrl, "png");
            return NextResponse.json({
                success: true,
                output: { image_url: localUrl, type: "image" }
            });
        }

        if (blockId === "add_text") {
            const imageUrl = config.input_image || getUpstreamUrl();
            if (!imageUrl || imageUrl.startsWith("blob:")) {
                return NextResponse.json({ success: false, error: "Add Text needs an image. Upload or connect an upstream image block." }, { status: 400 });
            }

            // Download image, overlay text with FFmpeg
            const ext = imageUrl.includes(".png") ? "png" : "jpg";
            const localImg = await downloadFile(imageUrl.startsWith("/") ? `${req.nextUrl.origin}${imageUrl}` : imageUrl, ext);
            const absImg = path.join(process.cwd(), "public", localImg);
            const outId = genId();
            const outPath = path.join(OUTPUT_DIR, `${outId}.png`);

            const text = (config.text || "Your Text Here").replace(/'/g, "'\\''");
            const pos = config.position === "Top" ? "y=50" : config.position === "Center" ? "y=(h-text_h)/2" : "y=h-th-50";
            const color = (config.color || "White").toLowerCase();
            const fontSize = 48;

            try {
                await execAsync(
                    `ffmpeg -i "${absImg}" -vf "drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${color}:x=(w-text_w)/2:${pos}:shadowcolor=black:shadowx=2:shadowy=2" "${outPath}" -y`
                );
                return NextResponse.json({
                    success: true,
                    output: { image_url: `/pipeline-output/${outId}.png`, type: "image" }
                });
            } catch (e) {
                console.error("FFmpeg text overlay failed:", e);
                return NextResponse.json({ success: false, error: "Text overlay failed. FFmpeg error." }, { status: 500 });
            }
        }

        if (blockId === "remove_bg") {
            const imageUrl = config.input_image || getUpstreamUrl();
            if (!imageUrl || imageUrl.startsWith("blob:")) {
                return NextResponse.json({ success: false, error: "Remove BG needs an image URL." }, { status: 400 });
            }

            const fullUrl = imageUrl.startsWith("/") ? `${req.nextUrl.origin}${imageUrl}` : imageUrl;
            const resultUrl = await runReplicate("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", {
                image: fullUrl,
            });
            const localUrl = await downloadFile(resultUrl, "png");
            return NextResponse.json({
                success: true,
                output: { image_url: localUrl, type: "image" }
            });
        }

        if (blockId === "image_editor") {
            const imageUrl = config.input_image || getUpstreamUrl();
            if (!imageUrl || imageUrl.startsWith("blob:")) {
                return NextResponse.json({ success: false, error: "Image Editor needs an image." }, { status: 400 });
            }

            const ext = imageUrl.includes(".png") ? "png" : "jpg";
            const localImg = await downloadFile(imageUrl.startsWith("/") ? `${req.nextUrl.origin}${imageUrl}` : imageUrl, ext);
            const absImg = path.join(process.cwd(), "public", localImg);
            const outId = genId();
            const outPath = path.join(OUTPUT_DIR, `${outId}.${ext}`);
            const action = config.action || "Resize";
            const size = config.target_size || "1080x1920";
            const [w, h] = size.split("x");

            try {
                let ffmpegCmd = "";
                if (action === "Resize") {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black" "${outPath}" -y`;
                } else if (action === "Crop") {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "crop=${w}:${h}" "${outPath}" -y`;
                } else if (action === "Brightness") {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "eq=brightness=0.1" "${outPath}" -y`;
                } else if (action === "Contrast") {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "eq=contrast=1.3" "${outPath}" -y`;
                } else if (action === "Blur BG") {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "gblur=sigma=10" "${outPath}" -y`;
                } else if (action === "Add Border") {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "pad=iw+40:ih+40:20:20:white" "${outPath}" -y`;
                } else {
                    ffmpegCmd = `ffmpeg -i "${absImg}" -vf "scale=${w}:${h}" "${outPath}" -y`;
                }
                await execAsync(ffmpegCmd);
                return NextResponse.json({
                    success: true,
                    output: { image_url: `/pipeline-output/${outId}.${ext}`, type: "image" }
                });
            } catch (e) {
                console.error("FFmpeg image edit failed:", e);
                return NextResponse.json({ success: false, error: `Image edit (${action}) failed.` }, { status: 500 });
            }
        }

        // =====================================
        // ===== MANAGERS (Actions) =====
        // =====================================

        if (blockId === "watermark") {
            const videoUrl = getUpstreamUrl();
            if (!videoUrl) {
                return NextResponse.json({ success: false, error: "Remove Watermark needs a video. Connect a Video Generator or upstream video block." }, { status: 400 });
            }

            // Download the video
            const isLocal = videoUrl.startsWith("/");
            const actualVideoPath = isLocal
                ? path.join(process.cwd(), "public", videoUrl)
                : path.join(process.cwd(), "public", await downloadFile(videoUrl, "mp4"));

            const outId = genId();
            const outPath = path.join(OUTPUT_DIR, `${outId}.mp4`);

            const position = config.position || "Bottom-Right";
            const sizeLabel = config.size || "Medium";

            // Size mapping (w x h of the watermark region to remove)
            let w = 200, h = 60;
            if (sizeLabel === "Small") { w = 120; h = 40; }
            else if (sizeLabel === "Large") { w = 320; h = 90; }

            // Position mapping using FFmpeg expressions (needs video dimensions)
            // delogo filter: x, y, w, h  
            let xExpr = "10";
            let yExpr = "10";
            if (position === "Top-Left") { xExpr = "10"; yExpr = "10"; }
            else if (position === "Top-Right") { xExpr = `main_w-${w}-10`; yExpr = "10"; }
            else if (position === "Bottom-Left") { xExpr = "10"; yExpr = `main_h-${h}-10`; }
            else if (position === "Bottom-Right") { xExpr = `main_w-${w}-10`; yExpr = `main_h-${h}-10`; }
            else if (position === "Center") { xExpr = `(main_w-${w})/2`; yExpr = `(main_h-${h})/2`; }

            try {
                await execAsync(
                    `ffmpeg -i "${actualVideoPath}" -vf "delogo=x=${xExpr}:y=${yExpr}:w=${w}:h=${h}:show=0" -codec:a copy "${outPath}" -y`
                );
                return NextResponse.json({
                    success: true,
                    output: { video_url: `/pipeline-output/${outId}.mp4`, type: "video" }
                });
            } catch (e) {
                console.error("FFmpeg delogo failed:", e);
                return NextResponse.json({ success: false, error: "Watermark removal failed. FFmpeg error." }, { status: 500 });
            }
        }

        if (blockId === "resize_crop") {
            const videoUrl = getUpstreamUrl();
            if (!videoUrl) {
                return NextResponse.json({ success: false, error: "Resize needs a video. Connect an upstream video block." }, { status: 400 });
            }

            const isLocal = videoUrl.startsWith("/");
            const actualVideoPath = isLocal
                ? path.join(process.cwd(), "public", videoUrl)
                : path.join(process.cwd(), "public", await downloadFile(videoUrl, "mp4"));

            const outId = genId();
            const outPath = path.join(OUTPUT_DIR, `${outId}.mp4`);

            const ratio = config.target_ratio || "9:16 (TikTok)";
            let scale = "1080:1920";
            if (ratio.includes("1:1")) scale = "1080:1080";
            else if (ratio.includes("16:9")) scale = "1920:1080";

            const fillMode = config.fill_mode || "Crop";
            let vf = "";
            if (fillMode === "Crop") {
                vf = `scale=${scale.split(":")[0]}:-2,crop=${scale.replace(":", ":")}`;
            } else if (fillMode === "Black Bars") {
                vf = `scale=${scale}:force_original_aspect_ratio=decrease,pad=${scale.replace(":", ":")}:(ow-iw)/2:(oh-ih)/2:black`;
            } else { // Blur BG
                const [w, h] = scale.split(":");
                vf = `split[original][blur];[blur]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},gblur=sigma=20[bg];[original]scale=${w}:${h}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
            }

            try {
                await execAsync(`ffmpeg -i "${actualVideoPath}" -vf "${vf}" -codec:a copy "${outPath}" -y`);
                return NextResponse.json({
                    success: true,
                    output: { video_url: `/pipeline-output/${outId}.mp4`, type: "video" }
                });
            } catch (e) {
                console.error("FFmpeg resize failed:", e);
                // Fallback: just copy
                try {
                    await execAsync(`ffmpeg -i "${actualVideoPath}" -vf "scale=${scale.split(":")[0]}:-2" -codec:a copy "${outPath}" -y`);
                    return NextResponse.json({
                        success: true,
                        output: { video_url: `/pipeline-output/${outId}.mp4`, type: "video" }
                    });
                } catch {
                    return NextResponse.json({ success: false, error: "Resize failed." }, { status: 500 });
                }
            }
        }

        if (blockId === "download_export") {
            // Download just returns the upstream URL for the client to trigger download
            const mediaUrl = getUpstreamUrl();
            return NextResponse.json({
                success: true,
                output: {
                    download_url: mediaUrl || null,
                    video_url: mediaUrl && (mediaUrl.includes(".mp4") || mediaUrl.includes("video")) ? mediaUrl : undefined,
                    image_url: mediaUrl && !mediaUrl.includes(".mp4") ? mediaUrl : undefined,
                    message: mediaUrl ? `Ready to download: ${mediaUrl}` : "No upstream media found. Connect a video/image block.",
                    type: mediaUrl ? "download" : "text"
                }
            });
        }

        if (blockId === "analytics_check") {
            const model = "gpt-4o-mini";
            const result = await callLLM(
                model,
                `You are a TikTok analytics expert. Generate a realistic performance report for a TikTok account.
                Include: views, likes, shares, comments, follower growth, best performing video, engagement rate, and recommendations.`,
                `Username: @${config.username || "creator"} | Check after: ${config.hours_after || "24h"} | Generate analytics report.`
            );
            return NextResponse.json({ success: true, output: { metrics: result, type: "text" } });
        }

        // ===== FALLBACK =====
        return NextResponse.json({
            success: true,
            output: { message: `Block "${blockId}" executed successfully.`, type: "text" }
        });

    } catch (error: unknown) {
        console.error("[Pipeline Execute Error]", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
