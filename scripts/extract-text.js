/**
 * Extract Text Script
 * Extracts all text content from portfolio.json for review/backup
 * Output: portfolio-text.md (in project root)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(__dirname, '..', 'portfolio-text.md');

function extract() {
    console.log('📖 Reading portfolio.json...');
    const dataPath = path.join(DATA_DIR, 'portfolio.json');

    if (!fs.existsSync(dataPath)) {
        console.error('❌ portfolio.json not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let mdOutput = '# Portfolio Text Content\n\n';
    mdOutput += `Generated: ${new Date().toISOString()}\n\n`;

    // iterate all categories
    for (const [category, items] of Object.entries(data)) {
        // Skip metadata or non-array items if any
        if (category === 'rootsStructure') continue;

        mdOutput += `\n---\n\n# Category: ${category.toUpperCase()}\n\n`;

        // adaptive handler for array vs object (detailedPortfolios is object)
        if (Array.isArray(items)) {
            items.forEach(item => {
                mdOutput += formatItem(item);
            });
        } else if (typeof items === 'object' && items !== null) {
            // nested categories like detailedPortfolios
            for (const [subCat, subItems] of Object.entries(items)) {
                mdOutput += `\n## Sub-Category: ${subCat}\n\n`;
                if (Array.isArray(subItems)) {
                    subItems.forEach(item => {
                        mdOutput += formatItem(item);
                    });
                }
            }
        }
    }

    fs.writeFileSync(OUT_FILE, mdOutput);
    console.log(`✅ Text extracted to: ${OUT_FILE}`);
}

function formatItem(item) {
    let text = '';
    text += `### Title: ${item.title || 'Untitled'}\n`;

    if (item.description) {
        text += `**Description:**\n${item.description}\n\n`;
    }

    if (item.content && item.content.length > 0) {
        text += `**Content:**\n`;
        item.content.forEach(line => {
            // clean up lines if needed
            if (line.trim()) text += `- ${line}\n`;
        });
        text += '\n';
    }

    // Optional: Extract from richContent if content is empty or different
    // (Ignoring for now as requested "just title content text")

    text += '\n'; // spacing
    return text;
}

extract();
