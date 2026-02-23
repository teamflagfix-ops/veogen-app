import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ScriptSegment {
    scene: string;
    text: string;
    duration: number;
    voiceTone: string; // excited, urgent, conversational, etc.
}

export interface GeneratedScript {
    segments: ScriptSegment[];
    fullScript: string;
    caption: string;
    hashtags: string[];
    suggestedVoice: string;
    totalDuration: number;
}

/**
 * Voice options for gpt-4o-mini-tts - 4 strategic TikTok voices
 */
export const VOICE_OPTIONS = {
    nova: { name: "Viral / Energetic", style: "Fast, TikTok native", best: "Kitchen, Gadgets, Toys" },
    shimmer: { name: "Beauty / Soft", style: "Warm, breathy", best: "Bathroom, Skincare, Decor" },
    onyx: { name: "Deep / Bold", style: "Masculine, authoritative", best: "Gym, Garage, Tech" },
    alloy: { name: "Professional", style: "Clear, gender-neutral", best: "Office, Digital Products" },
} as const;

export type VoiceOption = keyof typeof VOICE_OPTIONS;

/**
 * Product categories for scene-based prompting
 */
export const PRODUCT_CATEGORIES = {
    kitchen: "Kitchen & Home",
    tech: "Electronics & Tech",
    fashion: "Fashion & Beauty",
    fitness: "Fitness & Sports",
    lifestyle: "Lifestyle & General",
} as const;

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES;

/**
 * Generate a professional TikTok-style sales script
 * Uses Hook → Body → CTA structure with energetic delivery
 */
export async function generateSalesScript(
    productTitle: string,
    price: string,
    discount: string,
    description: string,
    urgencyText: string,
    category: ProductCategory = "lifestyle"
): Promise<GeneratedScript> {
    const prompt = `You are an expert TikTok Bottom of Funnel (BOF) creator making VIRAL sales videos.

Create a PUNCHY sales script for a 10 second video ad.
IMPORTANT: The script should be 25-35 words total (about 10 seconds at normal speaking pace).

Product: ${productTitle}
Price: ${price}
${discount ? `Deal/Discount: ${discount}` : ""}
${description ? `Description: ${description}` : ""}
${urgencyText ? `Urgency: ${urgencyText}` : "Sale ends tonight!"}

=== BOF SCRIPT FORMULA ===

1. HOOK (0-3s, 8-10 words): Start with THE BEST PART OF THE DEAL!
   - Lead with the deal/discount/free item
   - Add urgency immediately ("ends today", "today only", "last chance")
   - Examples:
     - "Claim your FREE bottle today only!"
     - "Buy one get one FREE - ends tonight!"
     - "${discount} ends TODAY - grab it NOW!"
   - Voice: EXCITED

2. BODY (3-6s, 10-12 words): Tell them HOW to buy - super simple!
   - Just tell them to click and buy
   - Mention another benefit (free shipping, limited stock)
   - Example: "Just tap the orange cart and grab this deal before it's gone!"
   - Voice: Urgent but clear

3. CTA (6-10s, 8-12 words): Final push with URGENCY
   - Last chance, don't miss out, running out
   - Example: "Only a few hours left - get yours NOW before they sell out!"
   - Voice: URGENT

=== CRITICAL RULES ===
- ALWAYS lead with the deal/discount in the hook (not the product features)
- Add urgency throughout ("ends today", "last chance", "running out")
- Keep it SIMPLE - people should understand the deal in one glance
- Sound like a real excited person, not salesy robot
- MUST be 25-35 words total

=== OUTPUT FORMAT (JSON) ===
{
  "segments": [
    {"scene": "hook", "text": "...", "duration": 3, "voiceTone": "excited"},
    {"scene": "body", "text": "...", "duration": 4, "voiceTone": "urgent"},
    {"scene": "cta", "text": "...", "duration": 3, "voiceTone": "urgent"}
  ],
  "caption": "Short viral caption with emoji about the deal...",
  "hashtags": ["#tiktokshop", "#sale", "#deal", "#musthave", "#limitedtime"],
  "suggestedVoice": "nova"
}

Choose suggestedVoice from: onyx (deep), nova (energetic), echo (smooth), alloy (neutral), shimmer (warm)
Pick nova or echo for most BOF content.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8, // Higher creativity
    });

    const content = response.choices[0].message.content;
    if (!content) {
        throw new Error("No response from script generation");
    }

    const parsed = JSON.parse(content);

    // Calculate total duration
    const totalDuration = parsed.segments.reduce(
        (sum: number, s: ScriptSegment) => sum + s.duration,
        0
    );

    return {
        segments: parsed.segments,
        fullScript: parsed.segments.map((s: ScriptSegment) => s.text).join(" "),
        caption: parsed.caption,
        hashtags: parsed.hashtags,
        suggestedVoice: parsed.suggestedVoice || "nova",
        totalDuration,
    };
}

/**
 * Generate scene prompts for AI video based on product category
 */
export function getScenePrompts(category: ProductCategory): Record<string, string> {
    const basePrompts: Record<ProductCategory, Record<string, string>> = {
        kitchen: {
            hook: "Product dramatically revealed on marble kitchen counter, warm morning light streaming in, steam rising from fresh coffee nearby",
            problem: "Cluttered kitchen scene that transitions to clean organized space with product",
            product: "Close-up hero shot on elegant countertop, slow orbit around product, professional food photography lighting",
            urgency: "Timer/clock visual, dynamic camera movement, urgency feeling",
            cta: "Product centered with beautiful bokeh background, inviting composition"
        },
        tech: {
            hook: "Futuristic reveal with RGB lighting, sleek desk setup, dynamic camera movement",
            problem: "Frustrated person with old tech, transforms to excited with new product",
            product: "Product on minimalist desk, cool ambient lighting, slow cinematic orbit",
            urgency: "Digital countdown aesthetic, fast cuts, energy building",
            cta: "Product glowing, premium tech aesthetic, clean modern environment"
        },
        fashion: {
            hook: "Glamorous unboxing moment, luxury tissue paper, elegant hands revealing product",
            problem: "Before/after styling transformation suggestion",
            product: "Lifestyle setting, boutique environment, soft romantic lighting",
            urgency: "Fast-paced fashion show energy, multiple angles",
            cta: "Product styled beautifully, aspirational lifestyle setting"
        },
        fitness: {
            hook: "Energetic gym environment, dynamic action shot, motivational atmosphere",
            problem: "Struggle moment that transforms to success with product",
            product: "Product in action, athletic setting, powerful lighting",
            urgency: "High energy movement, fast transitions, pulse-pounding feel",
            cta: "Victory pose/celebration with product, inspiring composition"
        },
        lifestyle: {
            hook: "Dramatic product reveal, soft natural lighting, cozy aesthetic",
            problem: "Relatable everyday moment, warm inviting atmosphere",
            product: "Beautiful hero shot, soft bokeh, elegant composition",
            urgency: "Dynamic energy shift, sense of excitement",
            cta: "Product centered, warm inviting aesthetic, call to action feel"
        }
    };

    return basePrompts[category];
}
