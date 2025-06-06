let fileContent = '';
let searchMatches = [];
let currentMatchIndex = 0;
let fontSize = 1;
let bookmarks = [];
let matrixMode = false;

// Elementos DOM
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchStats = document.getElementById('searchStats');
const navigation = document.getElementById('navigation');
const placeholder = document.getElementById('placeholder');
const textContent = document.getElementById('textContent');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentMatch = document.getElementById('currentMatch');
const clearBtn = document.getElementById('clearBtn');
const caseSensitive = document.getElementById('caseSensitive');
const wholeWords = document.getElementById('wholeWords');
const useRegex = document.getElementById('useRegex');
const copyBtn = document.getElementById('copyBtn');
const wordCountBtn = document.getElementById('wordCountBtn');
const fontSizeBtn = document.getElementById('fontSizeBtn');
const exportBtn = document.getElementById('exportBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const matrixBtn = document.getElementById('matrixBtn');
const bookmarksPanel = document.getElementById('bookmarksPanel');
const viewerCommand = document.getElementById('viewerCommand');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
searchInput.addEventListener('input', handleSearch);
searchBtn.addEventListener('click', handleSearch);
prevBtn.addEventListener('click', goToPreviousMatch);
nextBtn.addEventListener('click', goToNextMatch);
clearBtn.addEventListener('click', clearSearch);
caseSensitive.addEventListener('change', handleSearch);
wholeWords.addEventListener('change', handleSearch);
useRegex.addEventListener('change', handleSearch);
copyBtn.addEventListener('click', copySelectedText);
wordCountBtn.addEventListener('click', showStats);
fontSizeBtn.addEventListener('click', increaseFontSize);
exportBtn.addEventListener('click', exportSearch);
bookmarkBtn.addEventListener('click', addBookmark);
matrixBtn.addEventListener('click', toggleMatrixMode);
textContent.addEventListener('scroll', updateProgress);

searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'f':
                e.preventDefault();
                searchInput.focus();
                break;
            case 'c':
                if (window.getSelection().toString()) {
                    e.preventDefault();
                    copySelectedText();
                }
                break;
            case '+':
            case '=':
                e.preventDefault();
                increaseFontSize();
                break;
            case '-':
                e.preventDefault();
                decreaseFontSize();
                break;
        }
    }
    
    if (searchMatches.length > 0) {
        switch(e.key) {
            case 'F3':
                e.preventDefault();
                if (e.shiftKey) {
                    goToPreviousMatch();
                } else {
                    goToNextMatch();
                }
                break;
            case 'Enter':
                if (e.target === searchInput) {
                    if (e.shiftKey) {
                        goToPreviousMatch();
                    } else {
                        goToNextMatch();
                    }
                }
                break;
        }
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
        showTerminalToast('ERROR: Invalid file format. Expected .txt', 'error');
        return;
    }

    fileName.textContent = `>>> Loading: ${file.name}`;
    fileSize.textContent = `[${formatFileSize(file.size)}]`;
    if (viewerCommand) {
        viewerCommand.textContent = `cat ${file.name}`;
    }

    const reader = new FileReader();
    fileName.classList.add('loading');
    
    reader.onload = function(e) {
        fileContent = e.target.result;
        displayContent(fileContent);
        clearSearch();
        fileName.classList.remove('loading');
        fileName.textContent = `>>> File loaded: ${file.name}`;
        showTerminalToast('SUCCESS: File loaded successfully', 'success');
    };
    
    reader.onerror = function() {
        fileName.classList.remove('loading');
        fileName.textContent = '>>> ERROR: Failed to load file';
        showTerminalToast('ERROR: File read failed', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function displayContent(content) {
    placeholder.style.display = 'none';
    textContent.style.display = 'block';
    
    const contentDiv = document.createElement('div');
    contentDiv.style.fontSize = fontSize + 'rem';
    contentDiv.textContent = content;
    
    textContent.innerHTML = '';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-fill" id="progressFill"></div>';
    textContent.appendChild(progressBar);
    textContent.appendChild(contentDiv);
    
    updateProgress();
}

function copySelectedText() {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
            showTerminalToast('SUCCESS: Selected text copied to clipboard', 'success');
        }).catch(() => {
            showTerminalToast('ERROR: Failed to copy text', 'error');
        });
    } else {
        navigator.clipboard.writeText(fileContent).then(() => {
            showTerminalToast('SUCCESS: Full file content copied', 'success');
        }).catch(() => {
            showTerminalToast('ERROR: Copy operation failed', 'error');
        });
    }
}

function showStats() {
    if (!fileContent) {
        showTerminalToast('ERROR: No file loaded. Use --load <file> first', 'error');
        return;
    }

    const words = fileContent.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = fileContent.length;
    const charactersNoSpaces = fileContent.replace(/\s/g, '').length;
    const lines = fileContent.split('\n').length;
    const paragraphs = fileContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    const wordCount = {};
    words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord.length > 2) {
            wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
    });
    
    const mostCommon = Object.entries(wordCount).sort(([,a], [,b]) => b - a)[0];

    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-number">${words.length}</div>
            <div class="stat-label">WORDS</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${characters}</div>
            <div class="stat-label">CHARS</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${charactersNoSpaces}</div>
            <div class="stat-label">NO_SPACES</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${lines}</div>
            <div class="stat-label">LINES</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${paragraphs}</div>
            <div class="stat-label">PARAGRAPHS</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${Math.round(words.length / 200)}</div>
            <div class="stat-label">READ_TIME_MIN</div>
        </div>
    `;
    
    if (mostCommon) {
        statsGrid.innerHTML += `
            <div class="stat-item" style="grid-column: 1 / -1;">
                <div class="stat-number">"${mostCommon[0]}"</div>
                <div class="stat-label">MOST_FREQUENT (${mostCommon[1]}x)</div>
            </div>
        `;
    }

    document.getElementById('statsModal').style.display = 'flex';
}

function increaseFontSize() {
    fontSize = Math.min(fontSize + 0.1, 2);
    updateFontSize();
    showTerminalToast(`FONT_SIZE: ${Math.round(fontSize * 100)}%`, 'info');
}

function decreaseFontSize() {
    fontSize = Math.max(fontSize - 0.1, 0.5);
    updateFontSize();
    showTerminalToast(`FONT_SIZE: ${Math.round(fontSize * 100)}%`, 'info');
}

function updateFontSize() {
    const contentDiv = textContent.querySelector('div:last-child');
    if (contentDiv) {
        contentDiv.style.fontSize = fontSize + 'rem';
    }
}

function exportSearch() {
    if (searchMatches.length === 0) {
        showTerminalToast('ERROR: No search results to export', 'error');
        return;
    }

    const searchTerm = searchInput.value.trim();
    let exportData = `# SEARCH RESULTS EXPORT\n`;
    exportData += `# Query: "${searchTerm}"\n`;
    exportData += `# Matches: ${searchMatches.length}\n`;
    exportData += `# Generated: ${new Date().toISOString()}\n\n`;

    searchMatches.forEach((match, index) => {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(fileContent.length, match.index + match[0].length + 50);
        const context = fileContent.substring(start, end);
        
        exportData += `## Match ${index + 1} (Line ${getLineNumber(match.index)})\n`;
        exportData += `\`\`\`\n${context.replace(/\n/g, ' ')}\n\`\`\`\n\n`;
    });

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_export_${searchTerm}_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    showTerminalToast('SUCCESS: Search results exported', 'success');
}

function addBookmark() {
    if (!fileContent) {
        showTerminalToast('ERROR: No file loaded for bookmarking', 'error');
        return;
    }

    const selection = window.getSelection();
    let text = selection.toString().trim();
    let position = 0;

    if (text) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = document.createRange();
        preSelectionRange.setStart(textContent, 0);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        position = preSelectionRange.toString().length;
    } else {
        position = Math.round(textContent.scrollTop / textContent.scrollHeight * fileContent.length);
        const lineStart = fileContent.lastIndexOf('\n', position) + 1;
        const lineEnd = fileContent.indexOf('\n', position);
        text = fileContent.substring(lineStart, lineEnd === -1 ? lineStart + 50 : lineEnd).trim();
    }

    if (text.length > 60) text = text.substring(0, 60) + '...';

    const bookmark = {
        id: Date.now(),
        text: text || `POSITION_${Math.round(position / fileContent.length * 100)}%`,
        position: position
    };

    bookmarks.push(bookmark);
    updateBookmarksDisplay();
    bookmarksPanel.style.display = 'block';
    showTerminalToast('SUCCESS: Bookmark added', 'success');
}

function updateBookmarksDisplay() {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.innerHTML = bookmarks.map((bookmark, index) => `
        <div class="bookmark-item">
            <div class="bookmark-text" onclick="goToBookmark(${bookmark.position})">
                [${index + 1}] ${bookmark.text}
            </div>
            <button class="bookmark-delete" onclick="deleteBookmark(${bookmark.id})">×</button>
        </div>
    `).join('');
}

function goToBookmark(position) {
    const percentage = position / fileContent.length;
    textContent.scrollTop = textContent.scrollHeight * percentage;
    showTerminalToast('SUCCESS: Navigated to bookmark', 'success');
}

function deleteBookmark(id) {
    bookmarks = bookmarks.filter(b => b.id !== id);
    updateBookmarksDisplay();
    if (bookmarks.length === 0) {
        bookmarksPanel.style.display = 'none';
    }
    showTerminalToast('SUCCESS: Bookmark deleted', 'info');
}

function toggleMatrixMode() {
    matrixMode = !matrixMode;
    
    if (matrixMode) {
        document.body.classList.add('matrix-active');
        showTerminalToast('MATRIX_MODE: ENABLED', 'success');
        createMatrixRain();
    } else {
        document.body.classList.remove('matrix-active');
        showTerminalToast('MATRIX_MODE: DISABLED', 'info');
        document.querySelectorAll('.matrix-char').forEach(el => el.remove());
    }
}

function createMatrixRain() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const char = document.createElement('div');
            char.className = 'matrix-char';
            char.textContent = chars[Math.floor(Math.random() * chars.length)];
            char.style.cssText = `
                position: fixed;
                top: -20px;
                left: ${Math.random() * window.innerWidth}px;
                color: #00ff41;
                font-family: 'Fira Code', monospace;
                font-size: 1.2rem;
                z-index: 9999;
                pointer-events: none;
                text-shadow: 0 0 10px #00ff41;
                animation: matrix-fall 3s linear forwards;
            `;
            
            document.body.appendChild(char);
            setTimeout(() => char.remove(), 3000);
        }, i * 200);
    }
}

function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (!fileContent || !searchTerm) {
        clearSearch();
        return;
    }

    let flags = 'g';
    if (!caseSensitive.checked) flags += 'i';
    
    let pattern = searchTerm;
    
    if (!useRegex.checked) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (wholeWords.checked) {
        pattern = `\\b${pattern}\\b`;
    }
    
    try {
        const regex = new RegExp(pattern, flags);
        const matches = [...fileContent.matchAll(regex)];
        
        if (matches.length === 0) {
            searchStats.style.display = 'block';
            searchStats.textContent = `grep: No matches found for "${searchTerm}"`;
            navigation.style.display = 'none';
            displayContent(fileContent);
            showTerminalToast('SEARCH: No matches found', 'warning');
            return;
        }

        searchMatches = matches;
        currentMatchIndex = 0;

        searchStats.style.display = 'block';
        searchStats.textContent = `grep: Found ${matches.length} matches for "${searchTerm}"`;

        navigation.style.display = 'flex';
        
        highlightMatches();
        updateNavigation();
        showTerminalToast(`SEARCH: ${matches.length} matches found`, 'success');
    } catch (error) {
        showTerminalToast('ERROR: Invalid regex pattern', 'error');
        searchStats.style.display = 'block';
        searchStats.textContent = 'grep: Regex error';
    }
}

function highlightMatches() {
    if (searchMatches.length === 0) return;

    const searchTerm = searchInput.value.trim();
    let flags = 'g';
    if (!caseSensitive.checked) flags += 'i';
    
    let pattern = searchTerm;
    
    if (!useRegex.checked) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (wholeWords.checked) {
        pattern = `\\b${pattern}\\b`;
    }
    
    const regex = new RegExp(pattern, flags);
    
    let highlightedContent = fileContent.replace(regex, (match, offset) => {
        const isCurrentMatch = searchMatches[currentMatchIndex] && searchMatches[currentMatchIndex].index === offset;
        const className = isCurrentMatch ? 'highlight current-highlight' : 'highlight';
        return `<span class="${className}" data-match-index="${searchMatches.findIndex(m => m.index === offset)}">${match}</span>`;
    });

    const contentDiv = document.createElement('div');
    contentDiv.style.fontSize = fontSize + 'rem';
    contentDiv.innerHTML = highlightedContent;
    
    textContent.innerHTML = '';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-fill" id="progressFill"></div>';
    textContent.appendChild(progressBar);
    textContent.appendChild(contentDiv);

    scrollToCurrentMatch();
}

function scrollToCurrentMatch() {
    const currentHighlight = textContent.querySelector('.current-highlight');
    if (currentHighlight) {
        currentHighlight.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

function goToPreviousMatch() {
    if (searchMatches.length === 0) return;
    
    currentMatchIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : searchMatches.length - 1;
    highlightMatches();
    updateNavigation();
}

function goToNextMatch() {
    if (searchMatches.length === 0) return;
    
    currentMatchIndex = currentMatchIndex < searchMatches.length - 1 ? currentMatchIndex + 1 : 0;
    highlightMatches();
    updateNavigation();
}

function updateNavigation() {
    if (searchMatches.length === 0) return;
    
    currentMatch.textContent = `${currentMatchIndex + 1}/${searchMatches.length}`;
    
    prevBtn.disabled = false;
    nextBtn.disabled = false;
}

function clearSearch() {
    searchInput.value = '';
    searchMatches = [];
    currentMatchIndex = 0;
    searchStats.style.display = 'none';
    navigation.style.display = 'none';
    
    if (fileContent) {
        displayContent(fileContent);
    }
    
    showTerminalToast('SEARCH: Cleared', 'info');
}

function updateProgress() {
    const progressBar = document.getElementById('progressFill');
    if (!progressBar) return;
    
    if (textContent.scrollHeight <= textContent.clientHeight) {
        progressBar.style.width = '100%';
        return;
    }
    
    const scrollPercent = (textContent.scrollTop / (textContent.scrollHeight - textContent.clientHeight)) * 100;
    progressBar.style.width = scrollPercent + '%';
}

function getLineNumber(position) {
    return fileContent.substring(0, position).split('\n').length;
}

function showTerminalToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    
    let prefix = '';
    switch(type) {
        case 'success': prefix = '[OK] '; break;
        case 'error': prefix = '[ERROR] '; break;
        case 'warning': prefix = '[WARN] '; break;
        default: prefix = '[INFO] '; break;
    }
    
    toast.textContent = prefix + message;
    toast.style.borderColor = type === 'error' ? 'var(--terminal-error)' : 
                              type === 'warning' ? 'var(--terminal-warning)' : 
                              'var(--terminal-success)';
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none';
}

window.goToBookmark = goToBookmark;
window.deleteBookmark = deleteBookmark;
window.closeStatsModal = closeStatsModal;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        showTerminalToast('SYSTEM: TXT Reader Terminal initialized', 'success');
    }, 500);
    
    let konamiCode = [];
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    
    document.addEventListener('keydown', function(e) {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > konami.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konami.join(',')) {
            toggleMatrixMode();
            showTerminalToast('EASTER_EGG: Konami code activated!', 'success');
            konamiCode = [];
        }
    });
});

const matrixCSS = `
@keyframes matrix-fall {
    to {
        transform: translateY(${window.innerHeight + 50}px);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = matrixCSS;
document.head.appendChild(style);