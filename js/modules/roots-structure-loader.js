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
 * Parse PHP-like code block from Notion to JSON structure
 * Notion에서 PHP 코드 블록 형태로 저장된 구조를 파싱
 */
function parseNotionStructure(codeText) {
    if (!codeText || typeof codeText !== 'string') {
        throw new Error('Invalid codeText: empty or not a string');
    }

    // PHP 코드 블록에서 JSON 부분만 추출
    // 예: <?php $structure = {...}; ?> 또는 그냥 {...}
    let jsonStr = codeText.trim();

    // PHP 태그 제거
    jsonStr = jsonStr.replace(/<\?php[\s\S]*?\$\w+\s*=\s*/i, '');
    jsonStr = jsonStr.replace(/;\s*\?>/i, '');
    jsonStr = jsonStr.replace(/<\?php/gi, '').replace(/\?>/gi, '');

    // 변수 할당 제거 (예: $rootsStructure = )
    jsonStr = jsonStr.replace(/^\s*\$\w+\s*=\s*/i, '');

    // 끝의 세미콜론 제거
    jsonStr = jsonStr.replace(/;\s*$/i, '');

    // JSON 파싱 시도
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        // JSON5 스타일 (trailing comma, single quotes 등) 처리
        // Single quotes → double quotes
        jsonStr = jsonStr.replace(/'/g, '"');
        // Trailing commas 제거
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        // Unquoted keys 처리
        jsonStr = jsonStr.replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:');
        // 중복 따옴표 수정 (""key"" → "key")
        jsonStr = jsonStr.replace(/""+/g, '"');

        return JSON.parse(jsonStr);
    }
}

/**
 * Validate structure has required fields
 */
function validateStructure(structure) {
    if (!structure) return false;
    if (!structure.name) return false;
    if (!Array.isArray(structure.children)) return false;
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

            // 3. Parse the structure
            const parsed = parseNotionStructure(portfolioData.rootsStructure);

            // 4. Validate
            if (validateStructure(parsed)) {
                console.log('[RootsLoader] ✅ Successfully loaded from Notion!');
                console.log(`[RootsLoader] Center node: "${parsed.name}", Children: ${parsed.children?.length || 0}`);
                return parsed;
            } else {
                throw new Error('Structure validation failed');
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
