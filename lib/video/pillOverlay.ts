/**
 * Pill Overlay Generator - SEPARATE PILLS FOR EACH PROMO
 * 
 * Creates TikTok-style text banners with varied looks:
 * - Each promo item gets its OWN pill (not combined with |)
 * - Pill shapes (rounded backgrounds)
 * - Random colors
 * - Random emojis
 */

import sharp from "sharp";
import path from "path";

interface PillConfig {
    text: string;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    paddingX: number;
    paddingY: number;
    borderRadius: number;
    emoji?: string;
    style?: "pill" | "outlined";
}

/**
 * Randomized color palettes - VIBRANT variations each time!
 */
const DISCOUNT_COLORS = ["#FF0000", "#CC0000", "#E31C3D", "#DC143C", "#FF1744", "#D50000"];
const URGENCY_COLORS = ["#FF6600", "#FF8C00", "#FF4500", "#E34234", "#FF5722", "#FF6D00"];
const PRODUCT_COLORS = ["#000000", "#1a1a1a", "#6200EA", "#2979FF", "#00C853", "#FF1744"];
const PRICE_COLORS = ["#00C853", "#00E676", "#00BFA5", "#1DE9B6", "#00C853", "#64DD17"];

// Random emoji sets for each type
const DISCOUNT_EMOJIS = ["🔥", "💥", "⚡", "🎉", "💰", "🏷️"];
const URGENCY_EMOJIS = ["⏰", "⚠️", "🚨", "⏳", "🔔", "📢"];
const PRODUCT_EMOJIS = ["✨", "⭐", "💫", "🌟", "✅", "👀"];
const PRICE_EMOJIS = ["💰", "💵", "🤑", "💸", "🎁", "✔️"];

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomStyle(): "pill" | "outlined" {
    return "pill"; // Always use colorful pill style - no outlined
}

/**
 * Generate PILL style overlay (rounded background)
 */
function createPillSvg(
    text: string,
    width: number,
    height: number,
    fontSize: number,
    backgroundColor: string,
    textColor: string,
    borderRadius: number
): string {
    return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect 
                x="0" y="0" 
                width="${width}" height="${height}" 
                rx="${borderRadius}" ry="${borderRadius}" 
                fill="${backgroundColor}"
            />
            <text 
                x="${width / 2}" 
                y="${height / 2 + fontSize * 0.35}" 
                font-family="Arial, Helvetica, sans-serif" 
                font-size="${fontSize}" 
                font-weight="bold"
                fill="${textColor}" 
                text-anchor="middle"
            >${text}</text>
        </svg>
    `;
}

/**
 * Generate a text overlay PNG - PILL style
 */
export async function generatePillOverlay(
    config: PillConfig,
    outputPath: string
): Promise<void> {
    const {
        text,
        backgroundColor,
        textColor,
        fontSize,
        paddingX,
        paddingY,
        borderRadius,
        emoji = "",
    } = config;

    const displayText = emoji ? `${emoji} ${text} ${emoji}` : text;
    const textWidth = Math.ceil(displayText.length * fontSize * 0.55);
    const textHeight = fontSize;
    const width = textWidth + (paddingX * 2);
    const height = textHeight + (paddingY * 2);

    const svg = createPillSvg(displayText, width, height, fontSize, backgroundColor, textColor, borderRadius);

    await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
}

/**
 * Generate all overlay PNGs for a video
 * SPLITS discount/urgency by | to create SEPARATE pills for each promo!
 */
export async function generateOverlayImages(
    overlays: {
        discount?: string;
        urgency?: string;
        productName?: string;
        price?: string;
    },
    outputDir: string
): Promise<{
    overlayPaths: string[];
}> {
    const overlayPaths: string[] = [];
    let overlayIndex = 0;

    // Split discount by | and create separate pills
    if (overlays.discount) {
        const discountItems = overlays.discount.split('|').map(s => s.trim()).filter(s => s);
        for (const item of discountItems) {
            const discountPath = path.join(outputDir, `overlay_discount_${overlayIndex}.png`);
            await generatePillOverlay({
                text: item.toUpperCase(),
                backgroundColor: randomItem(DISCOUNT_COLORS),
                textColor: "#FFFFFF",
                fontSize: 60,
                paddingX: 45,
                paddingY: 22,
                borderRadius: 35,
                emoji: randomItem(DISCOUNT_EMOJIS),
                style: randomStyle()
            }, discountPath);
            overlayPaths.push(discountPath);
            overlayIndex++;
        }
    }

    // Split urgency by | and create separate pills
    if (overlays.urgency) {
        const urgencyItems = overlays.urgency.split('|').map(s => s.trim()).filter(s => s);
        for (const item of urgencyItems) {
            const urgencyPath = path.join(outputDir, `overlay_urgency_${overlayIndex}.png`);
            await generatePillOverlay({
                text: item.toUpperCase(),
                backgroundColor: randomItem(URGENCY_COLORS),
                textColor: "#FFFFFF",
                fontSize: 56,
                paddingX: 40,
                paddingY: 20,
                borderRadius: 32,
                emoji: randomItem(URGENCY_EMOJIS),
                style: randomStyle()
            }, urgencyPath);
            overlayPaths.push(urgencyPath);
            overlayIndex++;
        }
    }

    // Product name - single pill
    if (overlays.productName) {
        const productPath = path.join(outputDir, `overlay_product_${overlayIndex}.png`);
        await generatePillOverlay({
            text: overlays.productName.toUpperCase(),
            backgroundColor: randomItem(PRODUCT_COLORS),
            textColor: "#FFFFFF",
            fontSize: 52,
            paddingX: 38,
            paddingY: 18,
            borderRadius: 30,
            emoji: randomItem(PRODUCT_EMOJIS),
            style: randomStyle()
        }, productPath);
        overlayPaths.push(productPath);
        overlayIndex++;
    }

    // Price - single pill
    if (overlays.price) {
        const pricePath = path.join(outputDir, `overlay_price_${overlayIndex}.png`);
        await generatePillOverlay({
            text: `NOW ${overlays.price}`,
            backgroundColor: randomItem(PRICE_COLORS),
            textColor: "#FFFFFF",
            fontSize: 58,
            paddingX: 42,
            paddingY: 20,
            borderRadius: 34,
            emoji: randomItem(PRICE_EMOJIS),
            style: randomStyle()
        }, pricePath);
        overlayPaths.push(pricePath);
        overlayIndex++;
    }

    return { overlayPaths };
}
