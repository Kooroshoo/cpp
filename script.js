document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('main-container');
    const toId = text => text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');

    // Helper: Extracts markdown classes (e.g., {.cols-2}) and returns clean text + class array
    const extractClasses = (str) => {
        const match = str.match(/\{\s*((?:\.[a-zA-Z0-9_-]+\s*)+)\}/);
        return match 
            ? { clean: str.replace(match[0], '').trim(), classes: match[1].split('.').map(c => c.trim()).filter(Boolean), matched: match[0] } 
            : { clean: str, classes: [], matched: null };
    };

    fetch('cpp.md')
        .then(res => res.ok ? res.text() : Promise.reject("File not found"))
        .then(text => {
            // 1. Parse Frontmatter
            const match = text.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
            let mdContent = text;
            
            if (match) {
                const yaml = match[1];
                const getVal = regex => (yaml.match(regex) || [])[1]?.trim();
                
                document.getElementById('page-title').innerText = getVal(/title:\s*(.*)/) || 'Cheat Sheet';
                document.getElementById('page-intro').innerText = getVal(/intro:\s*\|\r?\n\s*(.*)/) || '';
                
                const bgStr = getVal(/background:\s*(.*)/);
                if (bgStr) {
                    // Converts 'bg-[#6d94c7]' or '#6d94c7' into a valid CSS color
                    const themeColor = bgStr.replace(/^bg-\[?|\]?$/g, '');
                    document.documentElement.style.setProperty('--theme-color', themeColor);
                }
                mdContent = text.replace(match[0], '').trim();
            }

            // 2. Parse Markdown
            mdContent = mdContent.replace(/\^([^\^]+)\^/g, '<sup>$1</sup>');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = marked.parse(mdContent);

            // 3. Build Layout
            let grid = null, cardBody = null;

            Array.from(tempDiv.children).forEach(node => {
                if (node.tagName === 'H2') {
                    const { clean, classes } = extractClasses(node.textContent);
                    const title = Object.assign(document.createElement('h2'), {
                        className: 'section-title', textContent: clean, id: toId(clean)
                    });
                    
                    grid = Object.assign(document.createElement('div'), { className: ['grid-container', ...classes].join(' ') });
                    mainContainer.append(title, grid);
                } 
                else if (node.tagName === 'H3') {
                    if (!grid) mainContainer.appendChild(grid = Object.assign(document.createElement('div'), { className: 'grid-container' }));
                    
                    const { clean, classes } = extractClasses(node.textContent);
                    const card = Object.assign(document.createElement('div'), { className: ['cheat-card', ...classes].join(' '), id: toId(clean) });
                    
                    card.appendChild(Object.assign(document.createElement('div'), { className: 'cheat-card-header', textContent: clean }));
                    card.appendChild(cardBody = Object.assign(document.createElement('div'), { className: 'cheat-card-body' }));
                    grid.appendChild(card);
                } 
                else if (cardBody) {
                    // Handle standalone class blocks attached to previous elements
                    const attrMatch = node.textContent.trim().match(/^\{\s*((?:\.[a-zA-Z0-9_-]+\s*)+)\}$/);
                    if (node.tagName === 'P' && attrMatch && cardBody.lastElementChild) {
                        cardBody.lastElementChild.classList.add(...attrMatch[1].split('.').map(c => c.trim()).filter(Boolean));
                        return;
                    }

                    // Handle inline classes
                    const { clean, classes, matched } = extractClasses(node.innerHTML);
                    if (matched) {
                        node.classList.add(...classes);
                        node.innerHTML = clean;
                        if (!node.innerHTML) return;
                    }

                    // Handle Special Blocks (Tables, Code)
                    if (node.tagName === 'TABLE') {
                        const wrap = Object.assign(document.createElement('div'), { className: 'table-wrapper' });
                        wrap.appendChild(node);
                        cardBody.appendChild(wrap);
                    } 
                    else if (node.tagName === 'PRE') {
                        const wrap = Object.assign(document.createElement('div'), { className: 'code-wrapper' });
                        const btn = Object.assign(document.createElement('button'), { className: 'copy-btn', textContent: 'Copy' });
                        
                        btn.onclick = () => navigator.clipboard.writeText(node.innerText).then(() => {
                            btn.textContent = 'Copied!'; btn.classList.add('copied');
                            setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
                        });

                        wrap.append(btn, node);
                        cardBody.appendChild(wrap);
                    } 
                    else {
                        cardBody.appendChild(node);
                    }
                }
            });

            Prism.highlightAll();

            // 4. Smooth Scrolling & Anchor Highlights
            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.onclick = (e) => {
                    e.preventDefault();
                    const target = document.getElementById(a.getAttribute('href').substring(1));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        target.classList.add('highlight-target');
                        setTimeout(() => target.classList.remove('highlight-target'), 1200);
                    }
                };
            });
        })
        .catch(console.error);
});