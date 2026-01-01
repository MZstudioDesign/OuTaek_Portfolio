/**
 * ========================================
 * Build Data Script
 * ========================================
 * 
 * Notion 페이지에서 모든 데이터를 가져와 portfolio.json을 생성합니다.
 * 이미지는 다운로드하지 않고 Notion URL을 직접 사용합니다.
 * 
 * ⚠️ 주의: Notion 이미지 URL은 약 1시간 후 만료됩니다.
 *          배포 전 또는 이미지가 깨지면 다시 실행하세요.
 * 
 * 사용법:
 *   npm run build-data
 * 
 * 환경 변수:
 *   NOTION_TOKEN - Notion API 토큰 (.env 파일에 설정)
 * 
 * @module scripts/build-data
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// ===========================
// Configuration
// ===========================
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// 메인 페이지 ID (유저가 제공한 URL에서 추출)
const MAIN_PAGE_ID = '2d41f3d0ca3580a4883cdcbeceb7ad98';

// Output directory
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ===========================
// Validate Environment
// ===========================
if (!NOTION_TOKEN) {
    console.error('❌ Error: NOTION_TOKEN is not set');
    console.error('   Please create a .env file with:');
    console.error('   NOTION_TOKEN=your_notion_api_key');
    process.exit(1);
}

// Initialize Notion Client
const notion = new Client({ auth: NOTION_TOKEN });

// ===========================
// Helper Functions
// ===========================

/**
 * Get all blocks from a page or block (recursive children)
 */
async function getBlocks(blockId) {
    const blocks = [];
    let cursor = undefined;

    do {
        const response = await notion.blocks.children.list({
            block_id: blockId,
            start_cursor: cursor,
            page_size: 100,
        });
        blocks.push(...response.results);
        cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return blocks;
}

/**
 * Extract text from rich_text array
 */
function extractText(richTextArray) {
    if (!richTextArray || !Array.isArray(richTextArray)) return '';
    return richTextArray.map(t => t.plain_text).join('');
}

/**
 * Extract links from rich_text array
 */
function extractLinks(richTextArray) {
    const links = [];
    if (!richTextArray || !Array.isArray(richTextArray)) return links;
    for (const t of richTextArray) {
        if (t.href) {
            links.push(t.href);
        } else if (t.text && t.text.link && t.text.link.url) {
            links.push(t.text.link.url);
        }
    }
    return links;
}

/**
 * Extract images from blocks (returns Notion URLs directly)
 */
function extractImages(blocks) {
    const images = [];
    for (const block of blocks) {
        if (block.type === 'image') {
            const url = block.image.file?.url || block.image.external?.url;
            if (url) images.push(url);
        }
    }
    return images;
}

/**
 * Query a database and return all items
 */
async function queryDatabase(databaseId) {
    const items = [];
    let cursor = undefined;

    do {
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: cursor,
            page_size: 100,
        });
        items.push(...response.results);
        cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return items;
}

/**
 * Fetch Open Graph data (title, description, image) from a URL
 */
async function fetchOG(url) {
    try {
        // Simple fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const html = await res.text();

        // Helper to extract meta content
        const getMeta = (prop) => {
            const match = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`, 'i'));
            return match ? match[1] : null;
        };

        const title = getMeta('og:title') || getMeta('twitter:title') || '';
        const description = getMeta('og:description') || getMeta('twitter:description') || '';
        const image = getMeta('og:image') || getMeta('twitter:image') || '';

        return { title, description, image, url };
    } catch (e) {
        // console.warn(`   ⚠️ OG Fetch failed for ${url}: ${e.message}`);
        return null;
    }
}

/**
 * Parse a database item into a simple object
 */
async function parseDbItem(page) {
    const props = page.properties;

    // Get title (try common property names)
    let title = '';
    for (const key of ['이름', 'Name', 'Title', '제목']) {
        if (props[key]?.title) {
            title = extractText(props[key].title);
            break;
        }
    }

    // Get page content blocks
    const blocks = await getBlocks(page.id);
    const images = extractImages(blocks);

    // Extract text content (Legacy - for Search/Stem)
    const textContent = [];

    // Extract Rich Content (New - for Modal with Media)
    const richContent = [];

    for (const block of blocks) {
        // 1. Text Blocks
        if (block.type === 'paragraph') {
            const richText = block.paragraph.rich_text;
            const text = extractText(richText);
            if (text) {
                textContent.push(text);
                richContent.push({ type: 'paragraph', text });

                // Extract Inline Links -> Convert to Toasts (Bookmarks)
                const links = extractLinks(richText);
                links.forEach(linkUrl => {
                    richContent.push({ type: 'bookmark', url: linkUrl, meta: { title: linkUrl } });
                });
            }
        }
        else if (block.type.startsWith('heading_')) {
            const richText = block[block.type].rich_text;
            const text = extractText(richText);
            if (text) {
                textContent.push(text);
                richContent.push({ type: 'heading', level: block.type, text });

                // Extract Inline Links
                const links = extractLinks(richText);
                links.forEach(linkUrl => {
                    richContent.push({ type: 'bookmark', url: linkUrl, meta: { title: linkUrl } });
                });
            }
        }
        // 2. Media Blocks
        else if (block.type === 'video') {
            const url = block.video.external?.url || block.video.file?.url;
            if (url) {
                richContent.push({ type: 'video', url });
            }
        }
        else if (block.type === 'embed') {
            const url = block.embed.url;
            if (url) {
                // Treat embed as video or link depending on URL? 
                // Mostly YouTube generic embeds come here too
                richContent.push({ type: 'video', url });
            }
        }
        // 3. Bookmark Blocks (Links)
        else if (block.type === 'bookmark') {
            const url = block.bookmark.url;
            if (url) {
                // Fetch OG data
                const ogData = await fetchOG(url);
                richContent.push({
                    type: 'bookmark',
                    url,
                    meta: ogData || { title: url, description: '', image: '' }
                });
            }
        }
    }

    return {
        id: page.id,
        title,
        description: textContent[0] || '',
        content: textContent, // Keep for backward compatibility
        richContent,          // New structured content
        images,
        imageUrl: images[0] || '',
        properties: props,
    };
}

// ===========================
// Main Build Function
// ===========================
async function buildPortfolioData() {
    console.log('🚀 Starting portfolio data build...\n');
    console.log(`📍 Main Page ID: ${MAIN_PAGE_ID}\n`);

    const portfolioData = {
        branches: [],
        stem: [],
        career: [],
        roots: [],
        beliefs: [],
        rootsStructure: null, // 뿌리 페이지 구조 (코드 블록에서 가져옴)
        detailedPortfolios: {},
        _meta: {
            buildTime: new Date().toISOString(),
            expiresApprox: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // ~1 hour
        }
    };

    try {
        // Step 1: Get all blocks from the main page
        console.log('📥 Fetching main page blocks...');
        const blocks = await getBlocks(MAIN_PAGE_ID);
        console.log(`   Found ${blocks.length} blocks\n`);

        // Step 1.5: Extract code blocks (뿌리 페이지 구조 등)
        console.log('📝 Looking for code blocks...');
        for (const block of blocks) {
            if (block.type === 'code') {
                const codeContent = extractText(block.code.rich_text);
                const language = block.code.language;
                console.log(`   Found code block (${language}): ${codeContent.substring(0, 50)}...`);

                // Try to parse as JSON (뿌리 페이지 구조)
                if (language === 'json' || codeContent.trim().startsWith('{') || codeContent.trim().startsWith('[')) {
                    try {
                        portfolioData.rootsStructure = JSON.parse(codeContent);
                        console.log('   ✅ Parsed as rootsStructure');
                    } catch (e) {
                        console.log('   ⚠️ Could not parse as JSON, storing as raw text');
                        portfolioData.rootsStructure = codeContent;
                    }
                } else {
                    // Store as raw text if not JSON
                    if (!portfolioData.rootsStructure) {
                        portfolioData.rootsStructure = codeContent;
                    }
                }
            }
        }
        console.log('');

        // Step 2: Find all child databases
        const databases = [];
        for (const block of blocks) {
            if (block.type === 'child_database') {
                databases.push({
                    id: block.id,
                    title: block.child_database.title,
                });
            }
        }

        console.log(`📊 Found ${databases.length} databases:\n`);
        for (const db of databases) {
            console.log(`   - ${db.title} (${db.id})`);
        }
        console.log('');

        // Step 3: Process each database
        for (const db of databases) {
            console.log(`\n📂 Processing: ${db.title}`);

            try {
                const items = await queryDatabase(db.id);
                console.log(`   Found ${items.length} items`);

                const parsedItems = [];
                for (const item of items) {
                    const parsed = await parseDbItem(item);
                    parsedItems.push(parsed);
                    process.stdout.write('.');
                }
                console.log(' ✅');

                // Categorize by database name
                const lowerTitle = db.title.toLowerCase();

                if (lowerTitle.includes('가지') || lowerTitle.includes('branch')) {
                    portfolioData.branches = parsedItems;
                } else if (lowerTitle.includes('줄기') && lowerTitle.includes('경력')) {
                    portfolioData.career = parsedItems;
                } else if (lowerTitle.includes('줄기') || lowerTitle.includes('stem')) {
                    portfolioData.stem = parsedItems;
                } else if (lowerTitle.includes('뿌리') || lowerTitle.includes('root')) {
                    portfolioData.roots = parsedItems;
                } else if (lowerTitle.includes('신념') || lowerTitle.includes('belief')) {
                    portfolioData.beliefs = parsedItems;
                } else if (lowerTitle.includes('상세') || lowerTitle.includes('detail')) {
                    portfolioData.detailedPortfolios[db.title] = parsedItems;
                } else {
                    // Unknown category - store by original name
                    portfolioData.detailedPortfolios[db.title] = parsedItems;
                }

            } catch (err) {
                console.error(`   ⚠️ Error: ${err.message}`);
            }
        }

        // Step 4: Save to JSON
        const outputPath = path.join(DATA_DIR, 'portfolio.json');
        fs.writeFileSync(outputPath, JSON.stringify(portfolioData, null, 2));

        console.log('\n' + '═'.repeat(50));
        console.log('✨ Build complete!');
        console.log(`   📁 Output: ${outputPath}`);
        console.log(`   📊 Branches: ${portfolioData.branches.length}`);
        console.log(`   📊 Stem: ${portfolioData.stem.length}`);
        console.log(`   📊 Career: ${portfolioData.career.length}`);
        console.log(`   📊 Roots: ${portfolioData.roots.length}`);
        console.log(`   📊 Beliefs: ${portfolioData.beliefs.length}`);
        console.log(`   📊 Detailed: ${Object.keys(portfolioData.detailedPortfolios).length} categories`);
        console.log('═'.repeat(50));

    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        if (error.code === 'unauthorized') {
            console.error('   Check your NOTION_TOKEN in .env file');
        }
        process.exit(1);
    }
}

// Run
buildPortfolioData();
