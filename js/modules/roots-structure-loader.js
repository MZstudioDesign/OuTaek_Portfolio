/**
 * Roots Structure Loader
 * 
 * 안전한 구조 로딩:
 * 1. portfolio.json에서 노션 구조를 먼저 시도
 * 2. 실패하면 하드코딩된 roots-structure.js로 폴백
 * 
 * @module modules/roots-structure-loader
 */

import { rootsStructure as fallbackStructure } from './roots-structure.js';

/**
 * Parse Notion's indented text format to JSON structure
 * 노션에서 들여쓰기 텍스트 형태로 저장된 구조를 JSON으로 파싱
 * 
 * Format:
 * 중심
 * 제목: 나의 신념
 * 1차 연결점
 * 제목: 디자인 스튜디오
 *     2차 연결점
 *     제목: 하위 항목
 */
function parseNotionStructure(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid text: empty or not a string');
    }

    // JSON에서 읽은 텍스트는 \n, \t가 이스케이프되어 있음
    // 실제 줄바꿈과 탭으로 변환
    const normalizedText = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');

    const lines = normalizedText.split('\n');

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

/**
 * Validate structure has required fields
 */
function validateStructure(structure) {
    if (!structure) return false;
    if (!structure.name) return false;
    // 최소 1개 이상의 children이 있어야 함
    if (!structure.children || structure.children.length === 0) return false;
    return true;
}

/**
 * Load roots structure with fallback
 * 
 * @returns {Promise<Object>} The roots structure object
 */
export async function loadRootsStructure() {
    console.log('[RootsLoader] Loading structure...');

    try {
        // 1. Try loading from portfolio.json
        const response = await fetch('data/portfolio.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const portfolioData = await response.json();

        // 2. Check if rootsStructure exists in JSON
        if (portfolioData.rootsStructure) {
            console.log('[RootsLoader] Found rootsStructure in portfolio.json');

            // 3. Parse the structure (indented text format)
            const parsed = parseNotionStructure(portfolioData.rootsStructure);

            // 4. Validate
            if (validateStructure(parsed)) {
                console.log('[RootsLoader] ✅ Successfully loaded from Notion!');
                console.log(`[RootsLoader] Center node: "${parsed.name}", Children: ${parsed.children?.length || 0}`);
                return parsed;
            } else {
                throw new Error('Structure validation failed - no children found');
            }
        } else {
            console.log('[RootsLoader] No rootsStructure in portfolio.json');
            throw new Error('rootsStructure not found');
        }

    } catch (error) {
        console.warn(`[RootsLoader] ⚠️ Failed to load from Notion: ${error.message}`);
        console.log('[RootsLoader] 📦 Using fallback (hardcoded) structure');
        return fallbackStructure;
    }
}

/**
 * Synchronous version - always returns fallback
 * Use this when async loading is not possible
 */
export function getRootsStructureSync() {
    return fallbackStructure;
}
