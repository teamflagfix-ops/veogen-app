import OpenAI from "openai";
import { writeFile } from "fs/promises";
import path from "path";
import { VoiceOption, VOICE_OPTIONS } from "./scriptWriter";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Voice speed settings based on voice tone from script
 * Natural paced speeds for TikTok ads
 */
const VOICE_SPEED_MAP: Record<string, number> = {
    excited: 1.1,       // Energetic, upbeat
    urgent: 1.15,       // Fast for urgency
    conversational: 1.0, // Natural pace
    confident: 1.05,    // Steady, clear
    default: 1.05,      // Default - natural pace
};

/**
 * Generate voiceover with selected voice and dynamic speed
 * 
 * @param script - The text to speak
 * @param outputDir - Output directory for the audio file
 * @param filename - Base filename (without extension)
 * @param voice - Voice option (onyx, nova, echo, alloy, shimmer)
 * @param tone - Voice tone to determine speed (excited, urgent, conversational)
 */
export async function generateVoiceover(
    script: string,
    outputDir: string,
    filename: string,
    voice: VoiceOption = "nova", // Default to energetic voice
    tone: string = "excited"
): Promise<string> {
    // Get speed based on tone
    const speed = VOICE_SPEED_MAP[tone] || VOICE_SPEED_MAP.default;

    console.log(`Generating voiceover with voice: ${voice} (${VOICE_OPTIONS[voice].style})`);
    console.log(`Speed: ${speed}x for tone: ${tone}`);

    const response = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts", // Best quality with marin/cedar voices
        voice: voice as any,
        input: script,
        speed: speed,
        response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(outputDir, `${filename}.mp3`);

    await writeFile(outputPath, buffer);
    console.log(`Voiceover saved to: ${outputPath}`);

    return outputPath;
}

/**
 * Generate voiceover from script segments with appropriate pacing
 * This creates a more natural-sounding ad with varied energy levels
 */
export async function generateSegmentedVoiceover(
    segments: Array<{ text: string; voiceTone: string }>,
    outputDir: string,
    filename: string,
    voice: VoiceOption = "nova"
): Promise<string> {
    // Combine all text but maintain natural flow
    const fullScript = segments.map(s => s.text).join(" ");

    // Use the first segment's tone to set overall energy
    const primaryTone = segments[0]?.voiceTone || "excited";

    return generateVoiceover(fullScript, outputDir, filename, voice, primaryTone);
}

/**
 * Get recommended voice based on product category
 */
export function getRecommendedVoice(category: string): VoiceOption {
    const voiceMap: Record<string, VoiceOption> = {
        kitchen: "shimmer",   // Warm, friendly
        tech: "onyx",         // Deep, authoritative
        fashion: "nova",      // Energetic, young
        fitness: "onyx",      // Deep, bold for gym content
        lifestyle: "alloy",   // Neutral, clear
    };

    return voiceMap[category] || "nova";
}
