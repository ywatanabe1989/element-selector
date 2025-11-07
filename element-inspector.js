/**
 * Element Inspector - Visual Debugging Tool
 *
 * Shows all HTML elements with colored rectangles and labels.
 * Toggle with Alt+I (I for Inspector)
 */

console.log("[DEBUG] Element Inspector loaded");

class ElementInspector {
    constructor() {
        this.isActive = false;
        this.overlayContainer = null;
        this.styleElement = null;
        this.selectionMode = false;
        this.selectionStart = null;
        this.selectionRect = null;
        this.selectionOverlay = null;

        this.init();
    }

    init() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt+I: Toggle inspector
            if (e.altKey && !e.shiftKey && !e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                this.toggle();
            }

            // Alt+C: Copy full page structure
            if (e.altKey && !e.shiftKey && !e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                this.copyPageStructure();
            }

            // Ctrl+Alt+I: Start rectangle selection mode
            if (e.ctrlKey && e.altKey && !e.shiftKey && e.key === 'i') {
                e.preventDefault();
                this.startSelectionMode();
            }

            // Escape: Cancel selection mode
            if (e.key === 'Escape' && this.selectionMode) {
                e.preventDefault();
                this.cancelSelectionMode();
            }
        });

        console.log('[ElementInspector] Initialized');
        console.log('  Alt+I: Toggle inspector overlay');
        console.log('  Alt+C: Copy full page structure');
        console.log('  Ctrl+Alt+I: Rectangle selection mode');
    }

    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    activate() {
        console.log('[ElementInspector] Activating...');
        this.isActive = true;

        // Create overlay container
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'element-inspector-overlay';

        // Calculate full document height
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );

        this.overlayContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: ${docHeight}px;
            pointer-events: none;
            z-index: 999999;
        `;

        // Add styles
        this.addStyles();

        // Scan all elements and create overlays
        this.scanElements();

        // Append to body
        document.body.appendChild(this.overlayContainer);

        console.log('[ElementInspector] Active - Press Alt+I to deactivate');
    }

    deactivate() {
        console.log('[ElementInspector] Deactivating...');
        this.isActive = false;

        // Remove overlay
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }

        // Remove styles
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }

    addStyles() {
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .element-inspector-box {
                position: absolute;
                border: 2px solid;
                box-sizing: border-box;
                pointer-events: none;
                transition: opacity 0.2s;
            }

            .element-inspector-label {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 1px 4px;
                font-size: 10px;
                font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                border-radius: 2px;
                white-space: nowrap;
                pointer-events: auto;
                cursor: pointer;
                z-index: 1000000;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
                line-height: 1.4;
                max-width: 300px;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: background 0.2s, transform 0.1s;
            }

            .element-inspector-label:hover {
                background: rgba(30, 30, 30, 0.95);
                transform: scale(1.05);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
            }

            .element-inspector-label:active {
                transform: scale(0.98);
            }

            .element-inspector-label.copied {
                background: rgba(16, 185, 129, 0.9);
                animation: copied-flash 0.5s ease;
            }

            @keyframes copied-flash {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }

            .camera-flash {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                pointer-events: none;
                z-index: 99999999;
                animation: cameraFlash 0.5s ease-out;
            }

            @keyframes cameraFlash {
                0% { opacity: 0; }
                15% { opacity: 0.9; }
                30% { opacity: 0; }
                45% { opacity: 0.6; }
                60% { opacity: 0; }
                100% { opacity: 0; }
            }

            .selection-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.4);
                z-index: 99999998;
                pointer-events: none;
            }

            .selection-rectangle {
                position: absolute;
                border: 2px solid rgba(59, 130, 246, 1);
                background: transparent;
                pointer-events: none;
                z-index: 99999999;
                box-shadow:
                    0 0 0 1px rgba(255, 255, 255, 0.5) inset,
                    0 0 0 2px rgba(0, 0, 0, 0.3) inset,
                    0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .selection-info {
                position: absolute;
                bottom: -28px;
                right: 0;
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 4px 10px;
                font-size: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border-radius: 4px;
                pointer-events: none;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                white-space: nowrap;
            }

            .selection-corners {
                position: absolute;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .selection-corner {
                position: absolute;
                width: 8px;
                height: 8px;
                background: white;
                border: 2px solid rgba(59, 130, 246, 1);
                border-radius: 1px;
            }

            .selection-corner.top-left { top: -4px; left: -4px; }
            .selection-corner.top-right { top: -4px; right: -4px; }
            .selection-corner.bottom-left { bottom: -4px; left: -4px; }
            .selection-corner.bottom-right { bottom: -4px; right: -4px; }

            .element-inspector-label-id {
                color: #4EC9B0;
                font-weight: bold;
            }

            .element-inspector-label-class {
                color: #9CDCFE;
            }

            .element-inspector-label-tag {
                color: #CE9178;
            }

            @media (max-width: 768px) {
                .element-inspector-label {
                    font-size: 8px;
                    padding: 1px 3px;
                }
            }
        `;
        document.head.appendChild(this.styleElement);
    }

    scanElements() {
        if (!this.overlayContainer) return;

        const allElements = document.querySelectorAll('*');
        let count = 0;
        const occupiedPositions = [];

        allElements.forEach((element) => {
            if (element.closest('#element-inspector-overlay')) return;

            if (element instanceof HTMLElement) {
                const computed = window.getComputedStyle(element);
                if (computed.display === 'none' || computed.visibility === 'hidden') return;
            }

            const depth = this.getDepth(element);
            const color = this.getColorForDepth(depth);

            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const box = document.createElement('div');
            box.className = 'element-inspector-box';
            box.style.cssText = `
                top: ${rect.top + window.scrollY}px;
                left: ${rect.left + window.scrollX}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border-color: ${color};
                opacity: 0.6;
            `;

            const minSize = 30;
            if (rect.width > minSize || rect.height > minSize) {
                const label = this.createLabel(element, depth);
                if (label) {
                    const labelPos = this.findLabelPosition(rect, occupiedPositions);
                    label.style.top = `${labelPos.top}px`;
                    label.style.left = `${labelPos.left}px`;

                    this.addCopyToClipboard(label, element);

                    occupiedPositions.push({
                        top: labelPos.top,
                        left: labelPos.left,
                        bottom: labelPos.top + 20,
                        right: labelPos.left + 200
                    });

                    this.overlayContainer.appendChild(label);
                }
            }

            this.overlayContainer.appendChild(box);
            count++;
        });

        console.log(`[ElementInspector] Visualized ${count} elements`);
    }

    findLabelPosition(rect, occupiedPositions) {
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        const positions = [
            { top: rect.top + scrollY - 20, left: rect.left + scrollX },
            { top: rect.top + scrollY + 2, left: rect.left + scrollX + 2 },
            { top: rect.top + scrollY - 20, left: rect.right + scrollX - 150 },
            { top: rect.bottom + scrollY + 2, left: rect.left + scrollX },
            { top: rect.top + scrollY, left: rect.left + scrollX - 160 },
            { top: rect.top + scrollY, left: rect.right + scrollX + 5 }
        ];

        for (const pos of positions) {
            if (!this.isPositionOccupied(pos, occupiedPositions)) {
                return pos;
            }
        }

        return { top: rect.top + scrollY + 2, left: rect.left + scrollX + 2 };
    }

    isPositionOccupied(pos, occupiedPositions) {
        const labelWidth = 200;
        const labelHeight = 20;

        for (const occupied of occupiedPositions) {
            if (!(pos.left + labelWidth < occupied.left ||
                  pos.left > occupied.right ||
                  pos.top + labelHeight < occupied.top ||
                  pos.top > occupied.bottom)) {
                return true;
            }
        }
        return false;
    }

    getDepth(element) {
        let depth = 0;
        let current = element;

        while (current && current !== document.body) {
            depth++;
            current = current.parentElement;
        }

        return depth;
    }

    getColorForDepth(depth) {
        const colors = [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#EC4899',
        ];

        const index = Math.min(Math.floor(depth / 3), colors.length - 1);
        return colors[index];
    }

    createLabel(element, depth) {
        const tag = element.tagName.toLowerCase();
        const id = element.id;
        const classes = element.className;

        let labelText = `<span class="element-inspector-label-tag">${tag}</span>`;

        if (id) {
            labelText += ` <span class="element-inspector-label-id">#${id}</span>`;
        }

        if (classes && typeof classes === 'string') {
            const classList = classes.split(/\s+/).filter(c => c.length > 0);
            if (classList.length > 0) {
                const classPreview = classList.slice(0, 2).join('.');
                labelText += ` <span class="element-inspector-label-class">.${classPreview}</span>`;
                if (classList.length > 2) {
                    labelText += `<span class="element-inspector-label-class">+${classList.length - 2}</span>`;
                }
            }
        }

        if (depth > 5) {
            labelText += ` <span style="color: #999; font-size: 9px;">d${depth}</span>`;
        }

        const label = document.createElement('div');
        label.className = 'element-inspector-label';
        label.innerHTML = labelText;
        label.title = 'Click to copy comprehensive debug info for AI';

        return label;
    }

    addCopyToClipboard(label, element) {
        label.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const debugInfo = this.gatherElementDebugInfo(element);

            try {
                await navigator.clipboard.writeText(debugInfo);

                label.classList.add('copied');
                const originalText = label.innerHTML;
                label.innerHTML = '✓ Copied Debug Info!';

                setTimeout(() => {
                    label.classList.remove('copied');
                    label.innerHTML = originalText;
                }, 1500);

                console.log('[ElementInspector] Copied debug info to clipboard');
                console.log(debugInfo);
            } catch (err) {
                console.error('[ElementInspector] Failed to copy:', err);

                const originalBg = label.style.background;
                label.style.background = 'rgba(239, 68, 68, 0.9)';
                label.innerHTML = '✗ Copy Failed';
                setTimeout(() => {
                    label.style.background = originalBg;
                    label.innerHTML = originalText;
                }, 1000);
            }
        });
    }

    gatherElementDebugInfo(element) {
        const info = {};

        info.url = window.location.href;
        info.timestamp = new Date().toISOString();

        info.element = {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            classes: element.className ? element.className.split(/\s+/).filter(c => c) : [],
            selector: this.buildCSSSelector(element),
            xpath: this.getXPath(element),
        };

        info.attributes = {};
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            info.attributes[attr.name] = attr.value;
        }

        if (element instanceof HTMLElement) {
            const computed = window.getComputedStyle(element);
            info.styles = {
                display: computed.display,
                position: computed.position,
                width: computed.width,
                height: computed.height,
                margin: computed.margin,
                padding: computed.padding,
                backgroundColor: computed.backgroundColor,
                color: computed.color,
                fontSize: computed.fontSize,
                fontFamily: computed.fontFamily,
                zIndex: computed.zIndex,
                opacity: computed.opacity,
                visibility: computed.visibility,
                overflow: computed.overflow,
            };

            if (element.style.cssText) {
                info.inlineStyles = element.style.cssText;
            }

            const rect = element.getBoundingClientRect();
            info.dimensions = {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
            };

            info.scroll = {
                scrollTop: element.scrollTop,
                scrollLeft: element.scrollLeft,
                scrollHeight: element.scrollHeight,
                scrollWidth: element.scrollWidth,
            };

            info.content = {
                innerHTML: element.innerHTML.substring(0, 200) + (element.innerHTML.length > 200 ? '...' : ''),
                textContent: element.textContent?.substring(0, 200) + (element.textContent && element.textContent.length > 200 ? '...' : ''),
            };
        }

        info.eventListeners = this.getEventListeners(element);
        info.parentChain = this.getParentChain(element);
        info.appliedStylesheets = this.getAppliedStylesheets(element);
        info.matchingCSSRules = this.getMatchingCSSRules(element);

        return this.formatDebugInfoForAI(info);
    }

    buildCSSSelector(element) {
        const tag = element.tagName.toLowerCase();
        const id = element.id;
        const classes = element.className;

        let selector = tag;
        if (id) {
            selector += `#${id}`;
        }
        if (classes && typeof classes === 'string') {
            const classList = classes.split(/\s+/).filter(c => c);
            if (classList.length > 0) {
                selector += `.${classList.join('.')}`;
            }
        }
        return selector;
    }

    getXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }

        const parts = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 0;
            let sibling = current.previousSibling;

            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }

            const tagName = current.nodeName.toLowerCase();
            const pathIndex = index > 0 ? `[${index + 1}]` : '';
            parts.unshift(tagName + pathIndex);

            current = current.parentElement;
        }

        return '/' + parts.join('/');
    }

    getEventListeners(element) {
        const listeners = [];
        const eventAttrs = ['onclick', 'onload', 'onchange', 'onsubmit', 'onmouseover', 'onmouseout'];

        eventAttrs.forEach(attr => {
            if (element.hasAttribute(attr)) {
                listeners.push(attr);
            }
        });

        return listeners;
    }

    getParentChain(element) {
        const chain = [];
        let current = element.parentElement;
        let depth = 0;

        while (current && depth < 5) {
            chain.push(this.buildCSSSelector(current));
            current = current.parentElement;
            depth++;
        }

        return chain;
    }

    getAppliedStylesheets(element) {
        const sheets = [];

        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const sheet = document.styleSheets[i];
                if (sheet.href) {
                    sheets.push(sheet.href);
                } else if (sheet.ownerNode) {
                    sheets.push('<inline style>');
                }
            } catch (e) {
                sheets.push('<cross-origin stylesheet>');
            }
        }

        return sheets;
    }

    getMatchingCSSRules(element) {
        const matchingRules = [];

        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const sheet = document.styleSheets[i];
                if (!sheet.cssRules) continue;

                for (let j = 0; j < sheet.cssRules.length; j++) {
                    const rule = sheet.cssRules[j];

                    if (rule instanceof CSSStyleRule) {
                        try {
                            if (element.matches(rule.selectorText)) {
                                matchingRules.push({
                                    selector: rule.selectorText,
                                    cssText: rule.cssText.substring(0, 200) + (rule.cssText.length > 200 ? '...' : ''),
                                    source: sheet.href || '<inline style>',
                                    ruleIndex: j,
                                });
                            }
                        } catch (e) {
                            // Invalid selector
                        }
                    }
                }
            } catch (e) {
                // CORS restrictions
            }
        }

        return matchingRules;
    }

    formatDebugInfoForAI(info) {
        return `# Element Debug Information

## Page Context
- URL: ${info.url}
- Timestamp: ${info.timestamp}

## Element Identification
- Tag: <${info.element.tag}>
- ID: ${info.element.id || 'none'}
- Classes: ${info.element.classes.join(', ') || 'none'}
- CSS Selector: ${info.element.selector}
- XPath: ${info.element.xpath}

## Attributes
${Object.entries(info.attributes).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Computed Styles
${Object.entries(info.styles || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

${info.inlineStyles ? `## Inline Styles\n${info.inlineStyles}\n` : ''}

## Dimensions & Position
- Width: ${info.dimensions?.width}px
- Height: ${info.dimensions?.height}px
- Top: ${info.dimensions?.top}px
- Left: ${info.dimensions?.left}px

## Scroll State
- scrollTop: ${info.scroll?.scrollTop}
- scrollLeft: ${info.scroll?.scrollLeft}

## Content (truncated)
${info.content?.textContent || 'none'}

## Event Listeners
${info.eventListeners.length > 0 ? info.eventListeners.join(', ') : 'none detected'}

## Parent Chain
${info.parentChain.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Applied Stylesheets
${info.appliedStylesheets.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Matching CSS Rules (${info.matchingCSSRules?.length || 0} rules)
${info.matchingCSSRules && info.matchingCSSRules.length > 0 ? info.matchingCSSRules.slice(0, 10).map((rule, i) => `
### ${i + 1}. ${rule.selector}
- Source: ${rule.source}
- Rule Index: ${rule.ruleIndex}
- CSS: ${rule.cssText}
`).join('\n') : 'No matching rules found (may be due to CORS restrictions)'}

---
This debug information was captured by Element Inspector and can be used for AI-assisted debugging.
Note: Exact CSS line numbers require browser DevTools API access.
`;
    }

    refresh() {
        if (this.isActive) {
            this.deactivate();
            this.activate();
        }
    }

    async copyPageStructure() {
        console.log('[ElementInspector] Generating full page structure...');

        this.showCameraFlash();

        const structure = this.generatePageStructure();

        try {
            await navigator.clipboard.writeText(structure);
            console.log('[ElementInspector] Page structure copied to clipboard!');

            setTimeout(() => {
                this.showNotification('📸 Page Structure Captured & Copied!', 'success');
            }, 300);
        } catch (err) {
            console.error('[ElementInspector] Failed to copy page structure:', err);
            this.showNotification('✗ Copy Failed', 'error');
        }
    }

    generatePageStructure() {
        const info = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
            },
            document: {
                title: document.title,
                doctype: document.doctype ? document.doctype.name : 'none',
                characterSet: document.characterSet,
                readyState: document.readyState,
            },
        };

        info.structure = this.buildElementTree(document.body, 0, 10);
        info.stylesheets = this.getAllStylesheets();
        info.scripts = this.getAllScripts();

        return this.formatPageStructureForAI(info);
    }

    buildElementTree(element, depth, maxDepth) {
        if (depth > maxDepth) {
            return { truncated: true };
        }

        const node = {
            tag: element.tagName.toLowerCase(),
            id: element.id || undefined,
            classes: element.className ? element.className.split(/\s+/).filter(c => c) : undefined,
        };

        const importantAttrs = ['href', 'src', 'type', 'name', 'value', 'data-*', 'aria-*'];
        const attrs = {};
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            if (importantAttrs.some(pattern => {
                if (pattern.endsWith('*')) {
                    return attr.name.startsWith(pattern.slice(0, -1));
                }
                return attr.name === pattern;
            })) {
                attrs[attr.name] = attr.value;
            }
        }
        if (Object.keys(attrs).length > 0) {
            node.attributes = attrs;
        }

        const children = [];
        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
                children.push(this.buildElementTree(child, depth + 1, maxDepth));
            }
        }
        if (children.length > 0) {
            node.children = children;
        }

        return node;
    }

    getAllStylesheets() {
        const sheets = [];

        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const sheet = document.styleSheets[i];
                const sheetInfo = {
                    index: i,
                    href: sheet.href || '<inline>',
                    ruleCount: sheet.cssRules?.length || 0,
                };

                if (sheet.cssRules && sheet.cssRules.length > 0) {
                    const sampleRules = [];
                    for (let j = 0; j < Math.min(5, sheet.cssRules.length); j++) {
                        sampleRules.push(sheet.cssRules[j].cssText);
                    }
                    sheetInfo.sampleRules = sampleRules;
                }

                sheets.push(sheetInfo);
            } catch (e) {
                sheets.push({
                    index: i,
                    href: '<cross-origin or restricted>',
                    error: 'Cannot access due to CORS',
                });
            }
        }

        return sheets;
    }

    getAllScripts() {
        const scripts = [];
        const scriptElements = document.querySelectorAll('script');

        scriptElements.forEach((script, index) => {
            scripts.push({
                index,
                src: script.src || '<inline>',
                type: script.type || 'text/javascript',
                async: script.async,
                defer: script.defer,
            });
        });

        return scripts;
    }

    formatPageStructureForAI(info) {
        return `# Full Page Structure

## Page Information
- URL: ${info.url}
- Title: ${info.document.title}
- Timestamp: ${info.timestamp}
- Viewport: ${info.viewport.width}x${info.viewport.height}
- Scroll Position: (${info.viewport.scrollX}, ${info.viewport.scrollY})

## Document Structure
\`\`\`json
${JSON.stringify(info.structure, null, 2)}
\`\`\`

## Stylesheets (${info.stylesheets.length} total)
${info.stylesheets.map((s, i) => `
### ${i + 1}. ${s.href}
- Rules: ${s.ruleCount}
${s.sampleRules ? `- Sample Rules:\n${s.sampleRules.map((r) => `  - ${r.substring(0, 100)}...`).join('\n')}` : ''}
${s.error ? `- Error: ${s.error}` : ''}
`).join('\n')}

## Scripts (${info.scripts.length} total)
${info.scripts.map((s, i) => `${i + 1}. ${s.src} ${s.async ? '[async]' : ''} ${s.defer ? '[defer]' : ''}`).join('\n')}

---
Generated by Element Inspector - Full page structure for AI-assisted debugging.
Press Alt+I to toggle element inspector overlay.
`;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
            color: white;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    showCameraFlash() {
        const flash = document.createElement('div');
        flash.className = 'camera-flash';
        document.body.appendChild(flash);

        setTimeout(() => {
            flash.remove();
        }, 500);
    }

    startSelectionMode() {
        console.log('[ElementInspector] Starting rectangle selection mode...');
        this.selectionMode = true;
        document.body.style.cursor = 'crosshair';

        this.selectionOverlay = document.createElement('div');
        this.selectionOverlay.className = 'selection-overlay';
        document.body.appendChild(this.selectionOverlay);

        this.showNotification('🔲 Selection Mode: Click and drag to select area (Esc to cancel)', 'success');

        document.addEventListener('mousedown', this.onSelectionMouseDown);
        document.addEventListener('mousemove', this.onSelectionMouseMove);
        document.addEventListener('mouseup', this.onSelectionMouseUp);
    }

    cancelSelectionMode() {
        console.log('[ElementInspector] Cancelling selection mode...');
        this.selectionMode = false;
        document.body.style.cursor = '';

        if (this.selectionOverlay) {
            this.selectionOverlay.remove();
            this.selectionOverlay = null;
        }

        if (this.selectionRect) {
            this.selectionRect.remove();
            this.selectionRect = null;
        }

        document.removeEventListener('mousedown', this.onSelectionMouseDown);
        document.removeEventListener('mousemove', this.onSelectionMouseMove);
        document.removeEventListener('mouseup', this.onSelectionMouseUp);

        this.selectionStart = null;
    }

    onSelectionMouseDown = (e) => {
        if (!this.selectionMode) return;

        e.preventDefault();
        this.selectionStart = {
            x: e.pageX,
            y: e.pageY
        };

        this.selectionRect = document.createElement('div');
        this.selectionRect.className = 'selection-rectangle';
        this.selectionRect.style.left = `${e.pageX}px`;
        this.selectionRect.style.top = `${e.pageY}px`;
        this.selectionRect.style.width = '0px';
        this.selectionRect.style.height = '0px';

        const corners = document.createElement('div');
        corners.className = 'selection-corners';
        corners.innerHTML = `
            <div class="selection-corner top-left"></div>
            <div class="selection-corner top-right"></div>
            <div class="selection-corner bottom-left"></div>
            <div class="selection-corner bottom-right"></div>
        `;
        this.selectionRect.appendChild(corners);

        const info = document.createElement('div');
        info.className = 'selection-info';
        info.textContent = '0×0';
        this.selectionRect.appendChild(info);

        document.body.appendChild(this.selectionRect);
    }

    onSelectionMouseMove = (e) => {
        if (!this.selectionMode || !this.selectionStart || !this.selectionRect) return;

        e.preventDefault();

        const currentX = e.pageX;
        const currentY = e.pageY;

        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);

        this.selectionRect.style.left = `${left}px`;
        this.selectionRect.style.top = `${top}px`;
        this.selectionRect.style.width = `${width}px`;
        this.selectionRect.style.height = `${height}px`;

        const info = this.selectionRect.querySelector('.selection-info');
        if (info) {
            const elementCount = this.countElementsInCurrentRect(left, top, width, height);
            info.textContent = `${Math.round(width)}×${Math.round(height)} | ${elementCount} elements`;
        }
    }

    onSelectionMouseUp = async (e) => {
        if (!this.selectionMode || !this.selectionStart || !this.selectionRect) return;

        e.preventDefault();

        const currentX = e.pageX;
        const currentY = e.pageY;

        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);

        if (width < 5 || height < 5) {
            this.cancelSelectionMode();
            this.showNotification('⚠ Selection too small', 'error');
            return;
        }

        const selectedElements = this.findElementsInRect({
            left,
            top,
            width,
            height
        });

        console.log(`[ElementInspector] Found ${selectedElements.length} elements in selection`);

        const selectionInfo = this.gatherSelectionInfo(selectedElements, {
            left,
            top,
            width,
            height
        });

        try {
            await navigator.clipboard.writeText(selectionInfo);
            this.showNotification(`✓ Copied info for ${selectedElements.length} elements!`, 'success');
            console.log('[ElementInspector] Selection info copied to clipboard');
        } catch (err) {
            console.error('[ElementInspector] Failed to copy:', err);
            this.showNotification('✗ Copy Failed', 'error');
        }

        this.cancelSelectionMode();
    }

    findElementsInRect(rect) {
        const selectedElements = [];
        const allElements = document.querySelectorAll('*');

        const selectionRect = {
            left: rect.left,
            top: rect.top,
            right: rect.left + rect.width,
            bottom: rect.top + rect.height
        };

        allElements.forEach((element) => {
            if (element.closest('#element-inspector-overlay') ||
                element.classList.contains('selection-rectangle')) {
                return;
            }

            if (element instanceof HTMLElement) {
                const computed = window.getComputedStyle(element);
                if (computed.display === 'none' || computed.visibility === 'hidden') {
                    return;
                }
            }

            const elementRect = element.getBoundingClientRect();
            const elementBounds = {
                left: elementRect.left + window.scrollX,
                top: elementRect.top + window.scrollY,
                right: elementRect.right + window.scrollX,
                bottom: elementRect.bottom + window.scrollY
            };

            const intersects = !(
                elementBounds.right < selectionRect.left ||
                elementBounds.left > selectionRect.right ||
                elementBounds.bottom < selectionRect.top ||
                elementBounds.top > selectionRect.bottom
            );

            if (intersects) {
                selectedElements.push(element);
            }
        });

        return selectedElements;
    }

    countElementsInCurrentRect(left, top, width, height) {
        const rect = { left, top, width, height };
        return this.findElementsInRect(rect).length;
    }

    gatherSelectionInfo(elements, rect) {
        let info = `# Rectangle Selection Debug Information

## Selection Area
- Position: (${Math.round(rect.left)}, ${Math.round(rect.top)})
- Size: ${Math.round(rect.width)}×${Math.round(rect.height)}px
- URL: ${window.location.href}
- Timestamp: ${new Date().toISOString()}
- Elements Found: ${elements.length}

---

`;

        const elementTypes = {};
        elements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            elementTypes[tag] = (elementTypes[tag] || 0) + 1;
        });

        info += `## Element Type Summary\n`;
        Object.entries(elementTypes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([tag, count]) => {
                info += `- ${tag}: ${count}\n`;
            });

        info += `\n---\n\n`;

        const maxDetailedElements = 20;
        const detailedCount = Math.min(elements.length, maxDetailedElements);

        info += `## Detailed Element Information (${detailedCount} of ${elements.length} elements)\n\n`;
        info += `> **Note**: Showing comprehensive debug info for the first ${detailedCount} elements.\n`;
        info += `> Each element includes: attributes, computed styles, dimensions, matching CSS rules, etc.\n\n`;
        info += `---\n\n`;

        elements.slice(0, maxDetailedElements).forEach((element, index) => {
            info += `# Element ${index + 1}/${elements.length}\n\n`;

            const elementDebugInfo = this.gatherElementDebugInfoForSelection(element, index + 1);
            info += elementDebugInfo;
            info += `\n${'='.repeat(80)}\n\n`;
        });

        if (elements.length > maxDetailedElements) {
            info += `## Remaining Elements (${elements.length - maxDetailedElements} elements - basic info)\n\n`;

            elements.slice(maxDetailedElements).forEach((element, index) => {
                const actualIndex = maxDetailedElements + index + 1;
                const selector = this.buildCSSSelector(element);
                const rect = element.getBoundingClientRect();
                const text = element.textContent?.trim().substring(0, 50);

                info += `### ${actualIndex}. ${selector}\n`;
                info += `- Position: (${Math.round(rect.left)}, ${Math.round(rect.top)}) | Size: ${Math.round(rect.width)}×${Math.round(rect.height)}px\n`;
                if (text) info += `- Text: "${text}${text.length > 50 ? '...' : ''}"\n`;
                info += `\n`;
            });
        }

        info += `\n---\nGenerated by Element Inspector - Rectangle Selection Mode (Enhanced)\n`;
        info += `Press Ctrl+Alt+I to start selection mode again.\n`;

        return info;
    }

    gatherElementDebugInfoForSelection(element, elementNumber) {
        const info = {};

        info.element = {
            number: elementNumber,
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            classes: element.className ? element.className.split(/\s+/).filter(c => c) : [],
            selector: this.buildCSSSelector(element),
            xpath: this.getXPath(element),
        };

        info.attributes = {};
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            info.attributes[attr.name] = attr.value;
        }

        if (element instanceof HTMLElement) {
            const computed = window.getComputedStyle(element);
            info.styles = {
                display: computed.display,
                position: computed.position,
                width: computed.width,
                height: computed.height,
                margin: computed.margin,
                padding: computed.padding,
                backgroundColor: computed.backgroundColor,
                color: computed.color,
                fontSize: computed.fontSize,
                fontFamily: computed.fontFamily,
                zIndex: computed.zIndex,
                opacity: computed.opacity,
                visibility: computed.visibility,
                overflow: computed.overflow,
            };

            if (element.style.cssText) {
                info.inlineStyles = element.style.cssText;
            }

            const rect = element.getBoundingClientRect();
            info.dimensions = {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
            };

            const textContent = element.textContent?.trim() || '';
            info.content = {
                textLength: textContent.length,
                textPreview: textContent.substring(0, 150) + (textContent.length > 150 ? '...' : ''),
            };
        }

        info.eventListeners = this.getEventListeners(element);

        const parentChain = [];
        let current = element.parentElement;
        let depth = 0;
        while (current && depth < 3) {
            parentChain.push(this.buildCSSSelector(current));
            current = current.parentElement;
            depth++;
        }
        info.parentChain = parentChain;

        info.matchingCSSRules = this.getMatchingCSSRules(element);

        return this.formatSelectionElementForAI(info);
    }

    formatSelectionElementForAI(info) {
        return `## Element Identification
- Tag: <${info.element.tag}>
- ID: ${info.element.id || 'none'}
- Classes: ${info.element.classes.join(', ') || 'none'}
- CSS Selector: ${info.element.selector}
- XPath: ${info.element.xpath}

## Attributes
${Object.entries(info.attributes).length > 0 ? Object.entries(info.attributes).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'No attributes'}

## Computed Styles
${Object.entries(info.styles || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

${info.inlineStyles ? `## Inline Styles\n${info.inlineStyles}\n` : ''}

## Dimensions & Position
- Width: ${info.dimensions?.width}px, Height: ${info.dimensions?.height}px
- Top: ${info.dimensions?.top}px, Left: ${info.dimensions?.left}px

## Content
- Text Length: ${info.content?.textLength || 0} characters
- Preview: ${info.content?.textPreview || 'empty'}

## Event Listeners
${info.eventListeners.length > 0 ? info.eventListeners.join(', ') : 'none detected'}

## Parent Chain (3 levels)
${info.parentChain.length > 0 ? info.parentChain.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'At document root'}

## Matching CSS Rules (${info.matchingCSSRules?.length || 0} rules)
${info.matchingCSSRules && info.matchingCSSRules.length > 0 ? info.matchingCSSRules.slice(0, 5).map((rule, i) => `
### ${i + 1}. ${rule.selector}
- Source: ${rule.source}
- Rule Index: ${rule.ruleIndex}
- CSS: ${rule.cssText}
`).join('\n') : 'No matching rules found'}
`;
    }
}

// Initialize global instance
const elementInspector = new ElementInspector();

// Export to window for manual control
window.elementInspector = elementInspector;

// Auto-refresh on window resize (with debounce)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
        if (window.elementInspector?.isActive) {
            window.elementInspector.refresh();
        }
    }, 500);
});
