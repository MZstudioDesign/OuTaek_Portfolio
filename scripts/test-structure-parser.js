/**
 * Test Script for Notion Structure Parser
 * Node.js에서 파서 로직을 테스트
 * 
 * Run: node scripts/test-structure-parser.js
 */

const fs = require('fs');
const path = require('path');

// Load portfolio.json
const portfolioPath = path.join(__dirname, '..', 'data', 'portfolio.json');
const portfolioData = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));

if (!portfolioData.rootsStructure) {
    console.error('❌ rootsStructure not found in portfolio.json');
    process.exit(1);
}

console.log('📄 Raw rootsStructure (first 500 chars):');
console.log(portfolioData.rootsStructure.substring(0, 500));
console.log('\n' + '='.repeat(60) + '\n');

/**
 * Parse Notion's indented text format to JSON structure
 */
function parseNotionStructure(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid text: empty or not a string');
    }

    // The text from JSON has literal \n and \t as escaped strings
    // We need to convert them to actual newlines and tabs
    const normalizedText = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');

    const lines = normalizedText.split('\n');

    console.log(`📋 Total lines: ${lines.length}`);

    // Root node
    const root = {
        name: '나의 신념',
        type: 'center',
        children: []
    };

    // Parse state
    let currentDepth = 0;
    let stack = [{ node: root, depth: -1 }];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) continue;

        // Check for depth markers (1차 연결점, 2차 연결점, etc.)
        const depthMatch = trimmed.match(/^(\d)차\s*연결점/);
        if (depthMatch) {
            currentDepth = parseInt(depthMatch[1]);
            continue;
        }

        // Check for center marker
        if (trimmed === '중심') {
            currentDepth = 0;
            continue;
        }

        // Check for title
        const titleMatch = trimmed.match(/^제목:\s*(.+)/);
        if (titleMatch) {
            const title = titleMatch[1].trim();

            // Skip the root node title (already set)
            if (title === '나의 신념') continue;

            const newNode = {
                name: title,
                type: `depth${currentDepth}`,
                children: []
            };

            // Find parent at correct depth
            while (stack.length > 1 && stack[stack.length - 1].depth >= currentDepth) {
                stack.pop();
            }

            // Add to parent's children
            const parent = stack[stack.length - 1].node;
            parent.children.push(newNode);

            // Push to stack for potential children
            stack.push({ node: newNode, depth: currentDepth });
        }
    }

    // Clean up empty children arrays
    function cleanEmptyChildren(node) {
        if (node.children && node.children.length === 0) {
            delete node.children;
        } else if (node.children) {
            node.children.forEach(cleanEmptyChildren);
        }
        return node;
    }

    cleanEmptyChildren(root);

    return root;
}

// Run the parser
console.log('🔄 Parsing structure...\n');
const parsed = parseNotionStructure(portfolioData.rootsStructure);

console.log('✅ Parsed structure:');
console.log(`   Center: "${parsed.name}"`);
console.log(`   Children count: ${parsed.children?.length || 0}`);

if (parsed.children && parsed.children.length > 0) {
    console.log('\n📂 Top-level nodes:');
    parsed.children.forEach((child, i) => {
        const subCount = child.children?.length || 0;
        console.log(`   ${i + 1}. "${child.name}" (${subCount} children)`);
    });
}

// Check for specific items the user mentioned
console.log('\n🔍 Looking for specific items:');

function findNode(node, name) {
    if (node.name === name) return true;
    if (node.children) {
        for (const child of node.children) {
            if (findNode(child, name)) return true;
        }
    }
    return false;
}

const items = ['퓨리스텝', '철없는 자두 릴스', '디자인 스튜디오', '브랜딩 & 마케팅'];
items.forEach(item => {
    const found = findNode(parsed, item);
    console.log(`   ${found ? '✅' : '❌'} "${item}"`);
});

// Count total nodes
function countNodes(node) {
    let count = 1;
    if (node.children) {
        for (const child of node.children) {
            count += countNodes(child);
        }
    }
    return count;
}

console.log(`\n📊 Total nodes: ${countNodes(parsed)}`);

// Save parsed result for debugging
const outputPath = path.join(__dirname, '..', 'data', 'parsed-structure.json');
fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
console.log(`\n💾 Saved to: ${outputPath}`);
