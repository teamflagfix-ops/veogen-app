import Replicate from "replicate";
import { writeFile } from "fs/promises";
import path from "path";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export interface VideoGenerationOptions {
    imageBase64: string;
    prompt?: string;
    duration?: number;
}

export async function generateVideoFromImage(
    imageBase64: string,
    outputDir: string,
    filename: string,
    productContext?: string
): Promise<string> {
    // Create a prompt for better video generation
    const prompt = productContext
        ? `Product showcase: ${productContext}. Smooth camera movement, professional lighting, clean background.`
        : "Product showcase with smooth camera movement, professional product photography style.";

    try {
        // Try Kling AI via Replicate for more realistic video
        console.log("Generating video with Kling AI...");

        const output = await replicate.run(
            "kwaivgi/kling-v1.6-pro:de354ac2e2cc0bdf82bc03005f5c1e94f5e1e139ee1d736c8ddb40c13a15d53a",
            {
                input: {
                    prompt: prompt,
                    start_image: `data:image/jpeg;base64,${imageBase64}`,
                    duration: 5,
                    aspect_ratio: "9:16",
                    negative_prompt: "blurry, low quality, distorted, ugly",
                },
            }
        );

        // Download the generated video
        const videoUrl = String(output);
        console.log("Video URL:", videoUrl);

        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.status}`);
        }

        const videoBuffer = Buffer.from(await response.arrayBuffer());
        const outputPath = path.join(outputDir, `${filename}.mp4`);
        await writeFile(outputPath, videoBuffer);

        return outputPath;
    } catch (error) {
        console.log("Kling AI failed, trying Stable Video Diffusion fallback...", error);

        // Fallback to Stable Video Diffusion
        try {
            const output = await replicate.run(
                "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
                {
                    input: {
                        input_image: `data:image/jpeg;base64,${imageBase64}`,
                        sizing_strategy: "maintain_aspect_ratio",
                        frames_per_second: 6,
                        motion_bucket_id: 127,
                    },
                }
            );

            const videoUrl = String(output);
            const response = await fetch(videoUrl);
            const videoBuffer = Buffer.from(await response.arrayBuffer());
            const outputPath = path.join(outputDir, `${filename}.mp4`);
            await writeFile(outputPath, videoBuffer);

            return outputPath;
        } catch (fallbackError) {
            console.log("SVD also failed, returning null for image-only mode");
            // Return empty string to signal we should use image-only mode
            return "";
        }
    }
}

// Simple image-based video (fallback when AI video generation fails)
export async function createImageVideo(
    imagePath: string,
    outputDir: string,
    filename: string
): Promise<string> {
    // Just return the image path - the composer will handle it
    return imagePath;
}
