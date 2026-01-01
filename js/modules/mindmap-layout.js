/**
 * Mindmap Layout Algorithm
 * Calculates positions for a radial tree structure.
 */

export function calculateMindmapLayout(rootData, options = {}) {
    const config = {
        radiusStep: 250, // Distance between levels
        startAngle: 0,
        endAngle: 360,
        ...options
    };

    const nodes = [];
    const links = [];

    // Helper to traverse and assign positions
    function traverse(node, depth, startAngle, endAngle, parent = null) {
        // Create a layout node wrapper
        const layoutNode = {
            id: node.id || node.name, // Use name as ID since structure uses names
            data: node,
            depth: depth,
            x: 0,
            y: 0,
            parent: parent
        };

        if (parent) {
            // Calculate Position
            // Center Angle
            const angleRange = endAngle - startAngle;
            const midAngle = startAngle + (angleRange / 2);
            const radius = depth * config.radiusStep;

            // Convert to Radians (subtract 90 to start from top)
            const rad = (midAngle - 90) * (Math.PI / 180);

            layoutNode.x = radius * Math.cos(rad);
            layoutNode.y = radius * Math.sin(rad);
            layoutNode.angle = midAngle;

            links.push({ source: parent, target: layoutNode });
        } else {
            // Root at center
            layoutNode.x = 0;
            layoutNode.y = 0;
        }

        nodes.push(layoutNode);

        // Process Children
        if (node.children && node.children.length > 0) {
            const count = node.children.length;
            const range = endAngle - startAngle;
            const step = range / count;

            node.children.forEach((child, i) => {
                const childStart = startAngle + (step * i);
                const childEnd = childStart + step;
                traverse(child, depth + 1, childStart, childEnd, layoutNode);
            });
        }
    }

    traverse(rootData, 0, config.startAngle, config.endAngle);

    return { nodes, links };
}
