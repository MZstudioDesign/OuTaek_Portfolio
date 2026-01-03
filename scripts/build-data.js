/**
 * ========================================
 * Build Data Script
 * ========================================
 * 
 * Notion 페이지에서 데이터를 수집하여 portfolio.json 생성
 * 이미지는 assets/images/portfolio/에 로컬 저장
 * 
 * @module scripts/build-data
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ===========================
// Configuration
// ===========================
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const MAIN_PAGE_ID = '2d41f3d0ca3580a4883cdcbeceb7ad98';
const CONCURRENT_DOWNLOADS = 6;

const DATA_DIR = path.join(__dirname, '..', 'data');
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'portfolio');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN not set');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

// Stats
let stats = { found: 0, downloaded: 0, skipped: 0, failed: 0 };

// ===========================
// Parallel Download Queue
// ===========================
class DownloadQueue {
    constructor(limit) {
        this.limit = limit;
        this.running = 0;
        this.queue = [];
    }
    async add(fn) {
        if (this.running >= this.limit) {
            await new Promise(r => this.queue.push(r));
        }
        this.running++;
        try { return await fn(); }
        finally {
            this.running--;
            if (this.queue.length) this.queue.shift()();
        }
    }
}
const downloadQueue = new DownloadQueue(CONCURRENT_DOWNLOADS);

// ===========================
// Block Fetching (DFS, Deduplicated)
// ===========================
async function getBlocks(blockId, visited = new Set()) {
    const blocks = [];
    let cursor;

    do {
        const res = await notion.blocks.children.list({
            block_id: blockId,
            start_cursor: cursor,
            page_size: 100,
        });

        for (const block of res.results) {
            if (visited.has(block.id)) continue;
            visited.add(block.id);
            blocks.push(block);

            // Recurse into children (column, toggle, list, etc.)
            if (block.has_children && block.type !== 'child_database') {
                blocks.push(...await getBlocks(block.id, visited));
            }
        }
        cursor = res.has_more ? res.next_cursor : null;
    } while (cursor);

    return blocks;
}

// ===========================
// Text Extraction
// ===========================
function extractText(richText) {
    if (!richText?.length) return '';
    return richText.map(t => t.plain_text).join('');
}

function extractLinks(richText) {
    if (!richText?.length) return [];
    return richText.filter(t => t.href || t.text?.link?.url)
        .map(t => t.href || t.text.link.url);
}

// ===========================
// Image Download
// ===========================
async function downloadImage(url, filename) {
    return new Promise(resolve => {
        const fullPath = path.join(IMAGES_DIR, filename);

        // ✅ WebP 버전이 이미 존재하면 다운로드 스킵
        const baseName = path.parse(filename).name;
        const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
        if (fs.existsSync(webpPath) && fs.statSync(webpPath).size > 1000) {
            console.log(`   [SKIPPED_WEBP_EXISTS] ${baseName}.webp`);
            stats.skipped++;
            resolve(`assets/images/portfolio/${baseName}.webp`);
            return;
        }

        // Skip if original already exists and valid
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 1000) {
            console.log(`   [SKIPPED_FILE_EXISTS] ${filename}`);
            stats.skipped++;
            resolve(`assets/images/portfolio/${filename}`);
            return;
        }

        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, res => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                downloadImage(res.headers.location, filename).then(resolve);
                return;
            }
            if (res.statusCode !== 200) {
                console.log(`   [FAILED] ${filename} (HTTP ${res.statusCode})`);
                stats.failed++;
                resolve(null);
                return;
            }

            const file = fs.createWriteStream(fullPath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                if (fs.statSync(fullPath).size < 100) {
                    fs.unlinkSync(fullPath);
                    stats.failed++;
                    resolve(null);
                } else {
                    console.log(`   [DOWNLOAD_SUCCESS] ${filename}`);
                    stats.downloaded++;
                    resolve(`assets/images/portfolio/${filename}`);
                }
            });
            file.on('error', () => {
                fs.unlink(fullPath, () => { });
                stats.failed++;
                resolve(null);
            });
        });
        req.on('error', () => { stats.failed++; resolve(null); });
        req.setTimeout(60000, () => { req.destroy(); stats.failed++; resolve(null); });
    });
}

// Retry wrapper
async function downloadWithRetry(url, filename, retries = 3) {
    for (let i = 0; i < retries; i++) {
        const result = await downloadImage(url, filename);
        if (result) return result;
        if (i < retries - 1) await new Promise(r => setTimeout(r, 2000));
    }
    return null;
}

// ===========================
// Extract & Download Images
// ===========================
async function extractAndDownloadImages(blocks, prefix, pageTitle) {
    const images = [];
    const tasks = [];

    for (const block of blocks) {
        if (block.type !== 'image') continue;

        const url = block.image?.file?.url || block.image?.external?.url;
        if (!url) continue;

        stats.found++;
        const blockId = block.id.replace(/-/g, ''); // Full 32-char ID for uniqueness

        // Extension from URL or default
        let ext = 'jpg';
        const urlExt = url.split('?')[0].match(/\.(\w{3,4})$/);
        if (urlExt) ext = urlExt[1].toLowerCase();

        const filename = `${prefix}_${blockId}.${ext}`;
        console.log(`   [FOUND_IMAGE_BLOCK] ${pageTitle.substring(0, 20)} → ${blockId}`);

        tasks.push(downloadQueue.add(() => downloadWithRetry(url, filename)));
    }

    const results = await Promise.all(tasks);
    results.forEach(r => { if (r) images.push(r); });

    return images;
}

// ===========================
// Database Query
// ===========================
async function queryDatabase(dbId) {
    const items = [];
    let cursor;
    do {
        const res = await notion.databases.query({
            database_id: dbId,
            start_cursor: cursor,
            page_size: 100,
        });
        items.push(...res.results);
        cursor = res.has_more ? res.next_cursor : null;
    } while (cursor);
    return items;
}

// ===========================
// Parse Database Item
// ===========================
async function parseDbItem(page) {
    const props = page.properties;

    // Title
    let title = '';
    for (const key of ['이름', 'Name', 'Title', '제목']) {
        if (props[key]?.title) {
            title = extractText(props[key].title);
            break;
        }
    }

    const blocks = await getBlocks(page.id);
    const prefix = page.id.replace(/-/g, '').substring(0, 8);
    const images = await extractAndDownloadImages(blocks, prefix, title || 'Untitled');

    const textContent = [];
    const richContent = [];

    for (const block of blocks) {
        if (block.type === 'paragraph') {
            const text = extractText(block.paragraph.rich_text);
            if (text) {
                textContent.push(text);
                richContent.push({ type: 'paragraph', text });
                extractLinks(block.paragraph.rich_text).forEach(url => {
                    richContent.push({ type: 'bookmark', url, meta: { title: url } });
                });
            }
        }
        else if (block.type.startsWith('heading_')) {
            const text = extractText(block[block.type].rich_text);
            if (text) {
                textContent.push(text);
                richContent.push({ type: 'heading', level: block.type, text });
            }
        }
        else if (block.type === 'video') {
            const url = block.video.external?.url || block.video.file?.url;
            if (url) richContent.push({ type: 'video', url });
        }
        else if (block.type === 'embed') {
            if (block.embed.url) richContent.push({ type: 'embed', url: block.embed.url });
        }
        else if (block.type === 'bookmark') {
            if (block.bookmark.url) {
                richContent.push({ type: 'bookmark', url: block.bookmark.url, meta: { title: block.bookmark.url } });
            }
        }
    }

    return {
        id: page.id,
        title,
        description: textContent[0] || '',
        content: textContent,
        richContent,
        images,
        imageUrl: images[0] || '',
        properties: props,
    };
}

// ===========================
// Main Build
// ===========================
async function build() {
    console.log('🚀 Starting build...\n');

    const portfolioData = {
        branches: [], stem: [], career: [], roots: [], beliefs: [],
        detailedPortfolios: {},
    };

    stats = { found: 0, downloaded: 0, skipped: 0, failed: 0 };

    // Get main page blocks
    console.log('📥 Fetching main page...');
    const blocks = await getBlocks(MAIN_PAGE_ID);
    console.log(`   ${blocks.length} blocks\n`);

    // Extract code blocks (php → rootsStructure)
    for (const block of blocks) {
        if (block.type === 'code' && block.code.language === 'php') {
            portfolioData.rootsStructure = extractText(block.code.rich_text);
        }
    }

    // Find databases
    const databases = blocks
        .filter(b => b.type === 'child_database')
        .map(b => ({ id: b.id, title: b.child_database.title }));

    console.log(`📊 ${databases.length} databases found\n`);

    // Process each database
    for (const db of databases) {
        console.log(`\n📂 ${db.title}`);
        try {
            const items = await queryDatabase(db.id);
            console.log(`   ${items.length} items`);

            const parsed = [];
            for (const item of items) {
                parsed.push(await parseDbItem(item));
                process.stdout.write('.');
            }
            console.log(' ✅');

            // Categorize
            const t = db.title.toLowerCase();
            if (t.includes('가지') || t.includes('branch')) portfolioData.branches = parsed;
            else if (t.includes('줄기') && t.includes('경력')) portfolioData.career = parsed;
            else if (t.includes('줄기')) portfolioData.stem = parsed;
            else if (t.includes('뿌리') || t.includes('root')) portfolioData.roots = parsed;
            else if (t.includes('신념')) portfolioData.beliefs = parsed;
            else portfolioData.detailedPortfolios[db.title] = parsed;

        } catch (e) {
            console.error(`   ⚠️ ${e.message}`);
        }
    }

    // Save
    const outPath = path.join(DATA_DIR, 'portfolio.json');
    fs.writeFileSync(outPath, JSON.stringify(portfolioData, null, 2));

    // Summary
    console.log('\n' + '═'.repeat(40));
    console.log('✨ Build complete!');
    console.log(`   📁 ${outPath}`);
    console.log(`   🔍 Found: ${stats.found}`);
    console.log(`   ✅ Downloaded: ${stats.downloaded}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   📂 Local files: ${fs.readdirSync(IMAGES_DIR).length}`);
    console.log('═'.repeat(40));
}

build().then(async () => {
    const sharp = require('sharp');
    const MAX_WIDTH = 1920;
    const QUALITY = 80;

    // ===========================
    // Phase 1: WebP Conversion
    // ===========================
    console.log('\n' + '═'.repeat(50));
    console.log('🖼️  Phase 1: WebP Conversion');
    console.log('═'.repeat(50));

    async function convertToWebp(filePath) {
        const baseName = path.parse(filePath).name;
        const outputPath = path.join(IMAGES_DIR, `${baseName}.webp`);

        // ✅ WebP가 이미 존재하면 스킵
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
            return 'skipped';
        }

        try {
            const metadata = await sharp(filePath).metadata();
            let pipeline = sharp(filePath);
            if (metadata.width > MAX_WIDTH) {
                pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
            }
            await pipeline.webp({ quality: QUALITY }).toFile(outputPath);
            return 'converted';
        } catch (err) {
            console.error(`   ❌ Convert failed: ${path.basename(filePath)} - ${err.message}`);
            return 'failed';
        }
    }

    let files = fs.readdirSync(IMAGES_DIR);
    // EXCLUDE .gif from conversion (keep animations)
    let originals = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    const gifFiles = files.filter(f => /\.gif$/i.test(f));

    console.log(`   📊 Found ${originals.length} images to convert (excluding ${gifFiles.length} GIFs)\n`);

    let converted = 0;
    let skipped = 0;
    for (const file of originals) {
        const inputPath = path.join(IMAGES_DIR, file);
        const result = await convertToWebp(inputPath);
        if (result === 'converted') {
            console.log(`   ✅ ${file} → ${path.parse(file).name}.webp`);
            converted++;
        } else if (result === 'skipped') {
            console.log(`   ⏭️  ${file} → WebP already exists, skipped`);
            skipped++;
        }
    }
    console.log(`\n   📊 Converted: ${converted}, Skipped: ${skipped}, Total: ${originals.length}\n`);

    // ===========================
    // Phase 2: Delete Originals
    // ===========================
    console.log('═'.repeat(50));
    console.log('🧹 Phase 2: Cleanup Original Files');
    console.log('═'.repeat(50));

    let deleted = 0;
    let deleteFailed = 0;

    // Re-read folder after conversion
    files = fs.readdirSync(IMAGES_DIR);
    // Only delete converted formats, NOT gifs
    originals = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

    for (const file of originals) {
        const filePath = path.join(IMAGES_DIR, file);
        const baseName = path.parse(file).name;
        const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);

        // Only delete if WebP version exists
        if (fs.existsSync(webpPath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`   🗑️ Deleted: ${file}`);
                deleted++;
            } catch (err) {
                console.warn(`   ⚠️ Delete failed: ${file} (${err.code})`);
                deleteFailed++;
            }
        }
    }
    console.log(`\n   📊 Deleted: ${deleted}, Failed: ${deleteFailed}\n`);

    // ===========================
    // Phase 3: Final Verification Loop
    // ===========================
    console.log('═'.repeat(50));
    console.log('🔍 Phase 3: Final Verification');
    console.log('═'.repeat(50));

    // Re-read folder
    files = fs.readdirSync(IMAGES_DIR);
    originals = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f)); // Strict check (no gifs)
    const gifs = files.filter(f => /\.gif$/i.test(f));
    const webpFiles = files.filter(f => /\.webp$/i.test(f));

    console.log(`   📁 Total files: ${files.length}`);
    console.log(`   🖼️ WebP files: ${webpFiles.length}`);
    console.log(`   👾 Animated GIFs: ${gifs.length} (preserved)`);
    console.log(`   ⚠️ Remaining raster originals: ${originals.length}\n`);

    // Retry conversion for any remaining originals
    if (originals.length > 0) {
        console.log('   🔄 Retrying conversion for remaining files...\n');

        for (const file of originals) {
            const inputPath = path.join(IMAGES_DIR, file);
            const baseName = path.parse(file).name;
            const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);

            // Skip if WebP already exists (just couldn't delete)
            if (fs.existsSync(webpPath)) {
                console.log(`   ⏭️ ${file}: WebP exists, skipping conversion`);
                continue;
            }

            // Retry conversion
            const success = await convertToWebp(inputPath);
            if (success) {
                console.log(`   ✅ Retry success: ${file}`);
                // Try to delete original
                try {
                    fs.unlinkSync(inputPath);
                } catch (e) {
                    console.warn(`   ⚠️ Could not delete: ${file}`);
                }
            } else {
                console.error(`   ❌ Retry failed: ${file}`);
            }
        }
    }

    // ===========================
    // Final Check with Retry Loop
    // ===========================
    console.log('\n' + '═'.repeat(50));
    console.log('📋 Final Validation (with retry loop)');
    console.log('═'.repeat(50));

    let retryCount = 0;
    const MAX_RETRIES = 10;

    while (retryCount < MAX_RETRIES) {
        files = fs.readdirSync(IMAGES_DIR);
        // Exclude GIFs from retry loop
        originals = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

        if (originals.length === 0) {
            console.log(`   ✅ All target files converted to WebP!`);
            break;
        }

        console.log(`\n   🔄 Retry ${retryCount + 1}: Found ${originals.length} remaining originals...`);

        for (const file of originals) {
            const inputPath = path.join(IMAGES_DIR, file);
            const baseName = path.parse(file).name;
            const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);

            // Convert if WebP doesn't exist
            if (!fs.existsSync(webpPath)) {
                try {
                    const metadata = await sharp(inputPath).metadata();
                    let pipeline = sharp(inputPath);
                    if (metadata.width > MAX_WIDTH) {
                        pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
                    }
                    await pipeline.webp({ quality: QUALITY }).toFile(webpPath);
                    console.log(`   ✅ Converted: ${file}`);
                } catch (err) {
                    console.error(`   ❌ Convert failed: ${file} - ${err.message}`);
                    continue;
                }
            }

            // Delete original if WebP exists
            if (fs.existsSync(webpPath)) {
                try {
                    fs.unlinkSync(inputPath);
                    console.log(`   🗑️ Deleted: ${file}`);
                } catch (err) {
                    console.warn(`   ⚠️ Delete failed: ${file} (${err.code})`);
                }
            }
        }

        retryCount++;
    }

    // Final verification
    files = fs.readdirSync(IMAGES_DIR);
    originals = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f)); // No GIFs in failure check
    const finalWebpFiles = files.filter(f => /\.webp$/i.test(f));
    const finalGifs = files.filter(f => /\.gif$/i.test(f));

    // Check portfolio.json exists
    const portfolioJsonPath = path.join(DATA_DIR, 'portfolio.json');
    const portfolioExists = fs.existsSync(portfolioJsonPath);

    console.log(`\n   ✅ portfolio.json: ${portfolioExists ? 'EXISTS' : 'MISSING'}`);
    console.log(`   ✅ WebP images: ${finalWebpFiles.length}`);
    console.log(`   ✅ Preserved GIFs: ${finalGifs.length}`);
    console.log(`   ${originals.length === 0 ? '✅' : '❌'} Remaining originals: ${originals.length}`);

    if (originals.length > 0) {
        console.log('\n❌ BUILD FAILED: Unconverted files remain after max retries:');
        originals.forEach(f => console.log(`   - ${f}`));
        console.log('\n═'.repeat(50));
        process.exit(1);
    }

    if (!portfolioExists) {
        console.log('\n❌ BUILD FAILED: portfolio.json not created');
        console.log('═'.repeat(50));
        process.exit(1);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 BUILD SUCCESS');
    console.log('═'.repeat(50));
    console.log(`   📁 portfolio.json: Ready`);
    console.log(`   🖼️ Images: ${finalWebpFiles.length} WebP files`);
    console.log(`   👾 GIFs: ${finalGifs.length} preserved`);
    console.log(`   🧹 Cleanup: Complete (0 raster originals)`);
    console.log('═'.repeat(50) + '\n');

}).catch(e => {
    console.error('❌ Build failed:', e.message);
    process.exit(1);
});
