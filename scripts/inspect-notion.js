/**
 * Notion Inspection Script
 * 
 * Purpose: 
 * Connects to Notion API and fetches the ACTUAL structure of the Main Page.
 * Generates `NOTION_INSPECTION.md` listing all found:
 * - Child Databases (IDs and Titles)
 * - Code Blocks (content)
 * - Text Blocks
 * 
 * Usage:
 * node scripts/inspect-notion.js
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Configuration
// Using the same ID found in build-data.js
const MAIN_PAGE_ID = '2d41f3d0ca3580a4883cdcbeceb7ad98';
const OUTPUT_FILE = path.join(__dirname, '../NOTION_INSPECTION.md');

if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN is missing in .env file.');
    process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function getBlocks(blockId) {
    let blocks = [];
    let cursor;
    while (true) {
        const { results, next_cursor } = await notion.blocks.children.list({
            block_id: blockId,
            start_cursor: cursor,
        });
        blocks.push(...results);
        if (!next_cursor) break;
        cursor = next_cursor;
    }
    return blocks;
}

async function inspect() {
    console.log(`🔍 Inspecting Notion Page: ${MAIN_PAGE_ID}...`);

    let md = `# Notion Page Inspection Report\n\n`;
    md += `> Target Page ID: \`${MAIN_PAGE_ID}\`\n`;
    md += `> Date: ${new Date().toLocaleString()}\n\n`;

    try {
        const blocks = await getBlocks(MAIN_PAGE_ID);
        console.log(`✅ Fetched ${blocks.length} blocks.`);

        md += `## 📦 Block Summary\n\n`;
        md += `Total Blocks: **${blocks.length}**\n\n`;

        // 1. Child Databases
        const dbs = blocks.filter(b => b.type === 'child_database');
        md += `### 🗄️ Child Databases (${dbs.length})\n\n`;
        if (dbs.length > 0) {
            md += `| Title | ID | Type |\n|---|---|---|\n`;
            dbs.forEach(db => {
                md += `| **${db.child_database.title}** | \`${db.id}\` | Child DB |\n`;
            });
            console.log(`   Found ${dbs.length} databases.`);
        } else {
            md += `*No child databases found via API.* (This confirms they are separate/linked view if missing)\n`;
        }
        md += `\n---\n\n`;

        // 2. Code Blocks
        const codes = blocks.filter(b => b.type === 'code');
        md += `### 💻 Code Blocks (${codes.length})\n\n`;
        codes.forEach((code, i) => {
            const lang = code.code.language;
            const content = code.code.rich_text.map(t => t.plain_text).join('');
            md += `#### Code Block #${i + 1} (${lang})\n`;
            md += "```" + lang + "\n";
            md += content + "\n";
            md += "```\n\n";
        });
        console.log(`   Found ${codes.length} code blocks.`);

        // 3. Child Pages
        const pages = blocks.filter(b => b.type === 'child_page');
        if (pages.length > 0) {
            md += `### 📄 Child Pages (${pages.length})\n\n`;
            pages.forEach(p => {
                md += `- **${p.child_page.title}** (ID: \`${p.id}\`)\n`;
            });
        }
        md += `\n---\n\n`;

        // 4. Other Content Structure (Headers, etc.)
        md += `### 📝 Content Structure\n\n`;
        blocks.forEach(b => {
            if (['heading_1', 'heading_2', 'heading_3'].includes(b.type)) {
                const text = b[b.type].rich_text.map(t => t.plain_text).join('');
                const prefix = '#'.repeat(parseInt(b.type.split('_')[1]));
                md += `${prefix} ${text}\n\n`;
            } else if (b.type === 'paragraph') {
                const text = b.paragraph.rich_text.map(t => t.plain_text).join('');
                if (text.length > 0) md += `- (Text) "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"\n`;
            }
        });

        fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
        console.log(`\n📄 Report saved to: ${OUTPUT_FILE}`);
        console.log('Done.');

    } catch (error) {
        console.error('❌ Error inspecting Notion:', error.message);
        fs.writeFileSync(OUTPUT_FILE, `# Error Report\n\nFailed to fetch Notion data: ${error.message}`);
    }
}

inspect();
