// Script to download stock background images from Unsplash
// Run with: npx ts-node scripts/downloadBackgrounds.ts

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const BACKGROUNDS_DIR = path.join(process.cwd(), 'public', 'backgrounds');

// Categories we need for product videos
// Each has 5 curated Unsplash image IDs that show EMPTY surfaces
const CATEGORIES = {
    kitchen: {
        name: 'Kitchen Counter',
        // Empty marble/white countertops - good for food, kitchen products
        images: [
            'photo-1556909114-f6e7ad7d3136', // White marble counter
            'photo-1556909172-54557c7e4fb7', // Clean kitchen counter
            'photo-1600585154340-be6161a56a0c', // Modern kitchen
            'photo-1600607687939-ce8a6c25118c', // Light kitchen
            'photo-1600573472550-8090b5e0745e', // Minimalist kitchen
        ]
    },
    living_room: {
        name: 'Living Room Table',
        // Empty coffee tables, side tables - good for home decor, gadgets
        images: [
            'photo-1555041469-a586c61ea9bc', // Living room with table
            'photo-1586023492125-27b2c045efd7', // Modern living room
            'photo-1600210492493-0946911123ea', // Clean coffee table
            'photo-1600566752355-35792bedcfea', // Minimal living room
            'photo-1600585152220-90363fe7e115', // Contemporary space
        ]
    },
    office: {
        name: 'Office Desk',
        // Empty desks - good for tech, office supplies, productivity
        images: [
            'photo-1497366216548-37526070297c', // Clean desk
            'photo-1600494603989-9650cf6ddd3d', // Modern office
            'photo-1600585153490-76fb20a32601', // Minimalist desk
            'photo-1600607687644-aac4c3eac7f4', // Wood desk
            'photo-1586281380117-5a60ae2050cc', // Home office
        ]
    },
    outdoor: {
        name: 'Outdoor/Patio Table',
        // Outdoor tables - good for outdoor gear, garden, lifestyle
        images: [
            'photo-1600585154526-990dced4db0c', // Patio table
            'photo-1600566753086-00f18fb6b3ea', // Garden setting
            'photo-1600573472591-ee6df62c8d15', // Outdoor wood table
            'photo-1600210491892-03d54c0aaf87', // Balcony
            'photo-1600566752447-f07abcfdace0', // Deck table
        ]
    },
    gym: {
        name: 'Gym/Fitness',
        // Gym benches, equipment surfaces - good for fitness, supplements
        images: [
            'photo-1534438327276-14e5300c3a48', // Gym interior
            'photo-1571902943202-507ec2618e8f', // Gym equipment
            'photo-1540497077202-7c8a3999166f', // Workout bench
            'photo-1517963879433-6ad2b056d712', // Gym floor
            'photo-1576678927484-cc907957088c', // Clean gym
        ]
    },
    garage: {
        name: 'Garage/Workbench',
        // Workbenches, tool surfaces - good for tools, auto, DIY
        images: [
            'photo-1558618666-fcd25c85cd64', // Workbench
            'photo-1530124566582-a618bc2615dc', // Garage workshop
            'photo-1504222490345-c075b6008014', // Tool bench
            'photo-1581092580497-e0d23cbdf1b9', // Clean garage
            'photo-1558618047-3c8c76ca7d13', // Workshop table
        ]
    },
    bathroom: {
        name: 'Bathroom Counter',
        // Clean bathroom counters - good for beauty, skincare, toiletries
        images: [
            'photo-1600607687939-ce8a6c25118c', // Bathroom vanity
            'photo-1600566752734-c1b7a6e9e929', // White bathroom
            'photo-1600585152915-d208bec867a1', // Modern bathroom
            'photo-1600607688969-a5bfcd646154', // Minimal vanity
            'photo-1600566753051-f0b89df2dd90', // Clean bathroom
        ]
    }
};

async function downloadImage(imageId: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const url = `https://images.unsplash.com/${imageId}?w=1080&q=80`;

        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    https.get(redirectUrl, (redirectResponse) => {
                        const file = fs.createWriteStream(outputPath);
                        redirectResponse.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            resolve();
                        });
                    }).on('error', reject);
                }
                return;
            }

            const file = fs.createWriteStream(outputPath);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('📸 Downloading stock background images from Unsplash...\n');

    // Create backgrounds directory
    if (!fs.existsSync(BACKGROUNDS_DIR)) {
        fs.mkdirSync(BACKGROUNDS_DIR, { recursive: true });
    }

    for (const [category, data] of Object.entries(CATEGORIES)) {
        const categoryDir = path.join(BACKGROUNDS_DIR, category);

        // Create category directory
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }

        console.log(`\n📁 ${data.name} (${category})`);

        for (let i = 0; i < data.images.length; i++) {
            const imageId = data.images[i];
            const outputPath = path.join(categoryDir, `bg${i + 1}.jpg`);

            try {
                console.log(`   ⬇️  Downloading bg${i + 1}.jpg...`);
                await downloadImage(imageId, outputPath);
                console.log(`   ✅ Saved: ${outputPath}`);
            } catch (error) {
                console.error(`   ❌ Failed: ${imageId}`, error);
            }
        }
    }

    console.log('\n✅ Done! All background images downloaded.');
    console.log(`📂 Images saved to: ${BACKGROUNDS_DIR}`);
}

main().catch(console.error);
