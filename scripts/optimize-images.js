/**
 * ========================================
 * Image Optimizer Script
 * ========================================
 * 
 * assets/images/portfolio 폴더 내 모든 이미지를 웹 최적화
 * - PNG/JPG → WebP 변환
 * - 최대 가로 1920px 리사이즈
 * - 품질 80% 압축
 * 
 * 사용법: npm run optimize-images
 * 
 * @module scripts/optimize-images
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'portfolio');
const MAX_WIDTH = 1920;
const QUALITY = 80;

async function optimizeImages() {
    console.log('🖼️  Starting image optimization...\n');
    console.log(`📂 Directory: ${IMAGES_DIR}`);
    console.log(`📐 Max width: ${MAX_WIDTH}px`);
    console.log(`🎨 Quality: ${QUALITY}%\n`);

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('❌ Directory not found:', IMAGES_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(IMAGES_DIR);
    // Exclude GIFs from optimization
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    const skippedGifs = files.filter(f => /\.gif$/i.test(f)).length;

    console.log(`📊 Found ${imageFiles.length} images to optimize (skipped ${skippedGifs} GIFs)\n`);

    let totalOriginal = 0;
    let totalOptimized = 0;
    let processed = 0;
    let skipped = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(IMAGES_DIR, file);
        const baseName = path.parse(file).name;
        const outputPath = path.join(IMAGES_DIR, `${baseName}.webp`);

        // Skip if WebP already exists and is newer
        if (fs.existsSync(outputPath)) {
            const inputStat = fs.statSync(inputPath);
            const outputStat = fs.statSync(outputPath);
            if (outputStat.mtime > inputStat.mtime) {
                skipped++;
                continue;
            }
        }

        try {
            const inputStat = fs.statSync(inputPath);
            const originalSize = inputStat.size;
            totalOriginal += originalSize;

            // Get image metadata
            const metadata = await sharp(inputPath).metadata();

            // Resize if wider than MAX_WIDTH
            let pipeline = sharp(inputPath);
            if (metadata.width > MAX_WIDTH) {
                pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
            }

            // Convert to WebP
            await pipeline
                .webp({ quality: QUALITY })
                .toFile(outputPath);

            const outputStat = fs.statSync(outputPath);
            const optimizedSize = outputStat.size;
            totalOptimized += optimizedSize;

            const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
            const originalKB = (originalSize / 1024).toFixed(0);
            const optimizedKB = (optimizedSize / 1024).toFixed(0);

            console.log(`✅ ${file} → ${baseName}.webp (${originalKB}KB → ${optimizedKB}KB, -${reduction}%)`);

            // Delete original after successful conversion
            fs.unlinkSync(inputPath);
            processed++;

        } catch (err) {
            console.error(`❌ Failed: ${file} - ${err.message}`);
        }
    }

    const totalOriginalMB = (totalOriginal / 1024 / 1024).toFixed(2);
    const totalOptimizedMB = (totalOptimized / 1024 / 1024).toFixed(2);
    const totalReduction = totalOriginal > 0
        ? ((1 - totalOptimized / totalOriginal) * 100).toFixed(1)
        : 0;

    console.log('\n' + '═'.repeat(50));
    console.log('✨ Optimization complete!');
    console.log(`   📊 Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Before: ${totalOriginalMB} MB`);
    console.log(`   📦 After: ${totalOptimizedMB} MB`);
    console.log(`   💾 Saved: ${totalReduction}%`);
    console.log('═'.repeat(50));
}

optimizeImages().catch(err => {
    console.error('❌ Optimization failed:', err.message);
    process.exit(1);
});
