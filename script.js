document.addEventListener('DOMContentLoaded', () => {
    fetch('cpp.md')
        .then(response => {
            if (!response.ok) throw new Error("Markdown file not found");
            return response.text();
        })
        .then(text => {
            const frontmatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---/;
            const match = text.match(frontmatterRegex);
            let markdownContent = text;
            
            if (match) {
                const yaml = match[1];
                const titleMatch = yaml.match(/title:\s*(.*)/);
                const introMatch = yaml.match(/intro:\s*\|\r?\n\s*(.*)/);
                const bgMatch = yaml.match(/background:\s*(.*)/);
                
                if(titleMatch) document.getElementById('page-title').innerText = titleMatch[1];
                if(introMatch) document.getElementById('page-intro').innerText = introMatch[1].trim();
                
                if(bgMatch) {
                    let bgColor = bgMatch[1].trim();
                    if (bgColor.startsWith('bg-[')) bgColor = bgColor.replace('bg-[', '').replace(']', '');
                    document.getElementById('site-header').style.backgroundColor = bgColor;
                }
                
                markdownContent = text.replace(frontmatterRegex, '').trim();
            }

            // Convert superscripts: ^31^ -> <sup>31</sup>
            markdownContent = markdownContent.replace(/\^([^\^]+)\^/g, '<sup>$1</sup>');

            const rawHtml = marked.parse(markdownContent);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawHtml;
            
            const mainContainer = document.getElementById('main-container');
            let currentGrid = null;
            let currentCardBody = null;

            Array.from(tempDiv.children).forEach(node => {
                // Robust regex to match single or multiple markdown classes like {.class1 .class2}
                const classRegex = /\{\s*((?:\.[a-zA-Z0-9_-]+\s*)+)\}/;

                if (node.tagName === 'H2') {
                    let headerText = node.textContent;
                    let gridClasses = ['grid-container'];

                    // Check for classes on H2 to apply to the Grid Container
                    const classMatch = headerText.match(classRegex);
                    if (classMatch) {
                        const classes = classMatch[1].split('.').map(c => c.trim()).filter(Boolean);
                        gridClasses.push(...classes);
                        headerText = headerText.replace(classMatch[0], '').trim();
                    }

                    const sectionTitle = document.createElement('h2');
                    sectionTitle.className = 'section-title';
                    sectionTitle.textContent = headerText;
                    mainContainer.appendChild(sectionTitle);
                    
                    currentGrid = document.createElement('div');
                    currentGrid.className = gridClasses.join(' ');
                    mainContainer.appendChild(currentGrid);
                } 
                else if (node.tagName === 'H3') {
                    if (!currentGrid) {
                        currentGrid = document.createElement('div');
                        currentGrid.className = 'grid-container';
                        mainContainer.appendChild(currentGrid);
                    }

                    let headerText = node.textContent;
                    const currentCard = document.createElement('div');
                    currentCard.className = 'cheat-card';

                    // Check for classes on H3 to apply to the Card
                    const classMatch = headerText.match(classRegex);
                    if (classMatch) {
                        const classes = classMatch[1].split('.').map(c => c.trim()).filter(Boolean);
                        currentCard.classList.add(...classes);
                        headerText = headerText.replace(classMatch[0], '').trim();
                    }

                    const cardHeader = document.createElement('div');
                    cardHeader.className = 'cheat-card-header';
                    cardHeader.textContent = headerText;
                    currentCard.appendChild(cardHeader);

                    currentCardBody = document.createElement('div');
                    currentCardBody.className = 'cheat-card-body';
                    currentCard.appendChild(currentCardBody);

                    currentGrid.appendChild(currentCard);
                } 
                else {
                    if (currentCardBody) {
                        // Check for classes on standard blocks (like UL/OL lists or paragraphs)
                        const textContent = node.textContent || '';
                        const classMatch = textContent.match(classRegex);
                        if (classMatch) {
                            const classes = classMatch[1].split('.').map(c => c.trim()).filter(Boolean);
                            node.classList.add(...classes);
                            
                            // Remove the class definition string from the HTML block so it doesn't render
                            node.innerHTML = node.innerHTML.replace(classMatch[0], '').trim();
                            
                            // Prevent appending an empty block if the class definition was the only thing in it
                            if (node.innerHTML === '') return; 
                        }

                        if (node.tagName === 'TABLE') {
                            const tableWrapper = document.createElement('div');
                            tableWrapper.className = 'table-wrapper';
                            tableWrapper.appendChild(node.cloneNode(true));
                            currentCardBody.appendChild(tableWrapper);
                        } 
                        else if (node.tagName === 'PRE') {
                            const preWrapper = document.createElement('div');
                            preWrapper.className = 'code-wrapper';
                            
                            const copyBtn = document.createElement('button');
                            copyBtn.className = 'copy-btn';
                            copyBtn.innerText = 'Copy';
                            
                            copyBtn.addEventListener('click', () => {
                                navigator.clipboard.writeText(node.innerText).then(() => {
                                    copyBtn.innerText = 'Copied!';
                                    copyBtn.classList.add('copied');
                                    setTimeout(() => {
                                        copyBtn.innerText = 'Copy';
                                        copyBtn.classList.remove('copied');
                                    }, 2000);
                                });
                            });

                            preWrapper.appendChild(copyBtn);
                            preWrapper.appendChild(node.cloneNode(true));
                            currentCardBody.appendChild(preWrapper);
                        } 
                        else {
                            currentCardBody.appendChild(node.cloneNode(true));
                        }
                    }
                }
            });

            Prism.highlightAll();
        })
        .catch(console.error);
});