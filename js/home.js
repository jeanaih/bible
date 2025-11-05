(function () {
    let introShown = sessionStorage.getItem('introShown');

    function getGreeting(now, name) {
        const h = now.getHours();
        let greet = '';
        if (h >= 5 && h < 12) greet = 'Good morning';
        else if (h >= 12 && h < 18) greet = 'Good afternoon';
        else greet = 'Good evening';

        return name ? `${greet}, ${name}` : greet;
    }

    function getGreetingOnly(now) {
        const h = now.getHours();
        if (h >= 5 && h < 12) return 'Good morning';
        else if (h >= 12 && h < 18) return 'Good afternoon';
        else return 'Good evening';
    }

    function ymd(d) { return d.toISOString().slice(0, 10); }

    function applyTheme() {
        const h = new Date().getHours();
        const el = document.getElementById('homePage');
        el.classList.remove('theme-morning', 'theme-afternoon', 'theme-night');
        if (h >= 5 && h < 12) el.classList.add('theme-morning');
        else if (h >= 12 && h < 18) el.classList.add('theme-afternoon');
        else el.classList.add('theme-night');
    }

    function updateStreak() {
        const today = new Date();
        const todayStr = ymd(today);
        const last = localStorage.getItem('lastOpenDate');
        let streak = parseInt(localStorage.getItem('streakCount') || '0', 10) || 0;

        // Get streak history
        const streakHistory = JSON.parse(localStorage.getItem('streakHistory') || '{}');

        if (last !== todayStr) {
            const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const yestStr = ymd(yest);
            streak = (last === yestStr) ? streak + 1 : 1;
            localStorage.setItem('streakCount', String(streak));
            localStorage.setItem('lastOpenDate', todayStr);

            // Add to history
            streakHistory[todayStr] = true;
            localStorage.setItem('streakHistory', JSON.stringify(streakHistory));
        }

        const streakEl = document.getElementById('streakCount');
        if (streakEl) {
            streakEl.textContent = String(streak);

            // Update fill height based on streak (capped at 100%)
            const fillPercentage = Math.min(100, streak * 5); // Each day adds 5% fill, capping at 100%
            const fillElement = document.querySelector('.streak-fill');
            if (fillElement) {
                // Use setTimeout to ensure the element is rendered before animating
                setTimeout(() => {
                    fillElement.style.height = `${fillPercentage}%`;

                    // Adjust gradient based on streak count
                    if (streak >= 20) {
                        fillElement.style.background = 'linear-gradient(135deg, #ff6d00 0%, #ff3d00 100%)';
                    } else if (streak >= 10) {
                        fillElement.style.background = 'linear-gradient(135deg, #ff8a00 0%, #ff5722 100%)';
                    } else {
                        fillElement.style.background = 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)';
                    }
                }, 100);
            }
        }

        const homeStreakEl = document.getElementById('homeStreakCount');
        if (homeStreakEl) homeStreakEl.textContent = String(streak);
    }

    function loadProfile() {
        // Profile loading no longer needed for greeting since it's only in intro
    }

    // Streak tile click - go to profile
    const streakTile = document.getElementById('streakTile');
    if (streakTile) {
        streakTile.addEventListener('click', () => {
            localStorage.setItem('lastPage', 'profile-new.html');
            window.location.href = window.location.pathname + '?page=profile-new.html';
            window.location.reload();
        });
    }

    // Notes tile click
    const notesTile = document.getElementById('notesTile');
    if (notesTile) {
        notesTile.addEventListener('click', () => {
            localStorage.setItem('lastPage', 'notes.html');
            window.location.href = window.location.pathname + '?page=notes.html';
            window.location.reload();
        });
    }

    // Saved tile click
    const savedTile = document.getElementById('savedTile');
    if (savedTile) {
        savedTile.addEventListener('click', () => {
            localStorage.setItem('lastPage', 'saved.html');
            window.location.href = window.location.pathname + '?page=saved.html';
            window.location.reload();
        });
    }

    // Update counts
    function updateCounts() {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const saved = JSON.parse(localStorage.getItem('savedVerses') || '[]');

        const notesCountEl = document.getElementById('notesCount');
        const savedCountEl = document.getElementById('savedCount');

        if (notesCountEl) notesCountEl.textContent = notes.length;
        if (savedCountEl) savedCountEl.textContent = saved.length;
    }

    updateCounts();

    // Intro animation sequence
    function playIntroAnimation() {
        if (introShown) return;

        const overlay = document.getElementById('introOverlay');
        const text1 = document.getElementById('introText1');
        const text2 = document.getElementById('introText2');

        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const name = profile.name || 'Friend';
        const now = new Date();

        // Set text content - combined greeting with name
        text1.textContent = `${getGreetingOnly(now)}, ${name}`;
        text2.textContent = 'Blessed to have you here';

        // Animation sequence
        setTimeout(() => {
            text1.classList.add('show');
        }, 300);

        setTimeout(() => {
            text1.classList.remove('show');
            text2.classList.add('show');
        }, 2800);

        setTimeout(() => {
            text2.classList.remove('show');
            overlay.classList.add('hidden');
            sessionStorage.setItem('introShown', 'true');
        }, 5300);
    }

    applyTheme();
    loadProfile();
    updateStreak();

    // Play intro on first load
    if (!introShown) {
        playIntroAnimation();
    } else {
        document.getElementById('introOverlay').classList.add('hidden');
    }

    // Initialize daily verse notifications
    if (window.BibleNotifications) {
        window.BibleNotifications.init();
    }

    // Update greeting every hour
    const msToNextHour = (60 - new Date().getMinutes()) * 60 * 1000 - new Date().getSeconds() * 1000 - new Date().getMilliseconds();
    setTimeout(() => {
        loadProfile();
        applyTheme();
        setInterval(() => {
            loadProfile();
            applyTheme();
        }, 60 * 60 * 1000);
    }, Math.max(0, msToNextHour));
})();

// Smart multilingual Bible search
let bibleVersions = {};
let searchTimeout = null;
let searchCache = new Map(); // Cache for faster repeated searches

// Load multiple Bible versions for cross-language search
async function loadBibleVersions() {
    const versions = [
        { name: 'NIV', type: 'json' },
        { name: 'NASB', type: 'json' },
        { name: 'ESV', type: 'json' },
        { name: 'KJV', type: 'json' },
        { name: 'MBBTAG12', type: 'xml', folder: 'Tagalog' },
        { name: 'ASND', type: 'xml', folder: 'ASND' },
        { name: 'CEBUANO', type: 'xml', folder: 'CEBUANO' }
    ];
    const basePath = window.location.pathname.includes("/pages/") ? "../Bible%20Versions/" : "Bible%20Versions/";

    for (const versionInfo of versions) {
        try {
            let data;
            if (versionInfo.type === 'xml') {
                const response = await fetch(`${basePath}${versionInfo.folder}/${versionInfo.name}.xml`);
                const xmlText = await response.text();
                const xmlDoc = new DOMParser().parseFromString(xmlText, "application/xml");
                data = parseMBBTagalog(xmlDoc);
            } else {
                const fetchPath = `${basePath}${versionInfo.name}/${versionInfo.name}_bible.json`;
                const response = await fetch(fetchPath);
                data = await response.json();
            }
            bibleVersions[versionInfo.name] = data;
        } catch (err) {
            console.warn(`Failed to load ${versionInfo.name}:`, err);
        }
    }
}

// Parse Tagalog XML
function parseMBBTagalog(xmlDoc) {
    const tagalogBookNames = {
        1: "Genesis", 2: "Exodo", 3: "Levitico", 4: "Mga Bilang", 5: "Deuteronomio",
        6: "Josue", 7: "Mga Hukom", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
        11: "1 Mga Hari", 12: "2 Mga Hari", 13: "1 Cronica", 14: "2 Cronica",
        15: "Ezra", 16: "Nehemias", 17: "Ester", 18: "Job", 19: "Mga Awit",
        20: "Mga Kawikaan", 21: "Eclesiastes", 22: "Awit ni Solomon", 23: "Isaias",
        24: "Jeremias", 25: "Panaghoy", 26: "Ezekiel", 27: "Daniel", 28: "Oseas",
        29: "Joel", 30: "Amos", 31: "Obadias", 32: "Jonas", 33: "Mikas",
        34: "Nahum", 35: "Habakuk", 36: "Zefanias", 37: "Hagai", 38: "Zacarias",
        39: "Malakias", 40: "Mateo", 41: "Marcos", 42: "Lucas", 43: "Juan",
        44: "Mga Gawa", 45: "Roma", 46: "1 Corinto", 47: "2 Corinto",
        48: "Galacia", 49: "Efeso", 50: "Filipos", 51: "Colosas",
        52: "1 Tesalonica", 53: "2 Tesalonica", 54: "1 Timoteo",
        55: "2 Timoteo", 56: "Tito", 57: "Filemon", 58: "Hebreo",
        59: "Santiago", 60: "1 Pedro", 61: "2 Pedro", 62: "1 Juan",
        63: "2 Juan", 64: "3 Juan", 65: "Judas", 66: "Pahayag"
    };

    const data = {};
    const books = xmlDoc.getElementsByTagName("book");
    for (let book of books) {
        const num = parseInt(book.getAttribute("number"));
        const name = tagalogBookNames[num];
        data[name] = {};
        const chapters = book.getElementsByTagName("chapter");
        for (let chapter of chapters) {
            const chapNum = chapter.getAttribute("number");
            data[name][chapNum] = {};
            const verses = chapter.getElementsByTagName("verse");
            for (let verse of verses) {
                const vNum = verse.getAttribute("number");
                data[name][chapNum][vNum] = verse.textContent.trim();
            }
        }
    }
    return data;
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j - 1][i] + 1,
                matrix[j][i - 1] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

// Book match score using Levenshtein distance
function getBookMatchScore(bookName, query) {
    if (bookName === query) return 1;
    if (bookName.includes(query)) return 0.8;

    const bookWords = bookName.split(/\s+/);
    const queryWords = query.split(/\s+/);
    let maxWordScore = 0;

    for (const queryWord of queryWords) {
        for (const bookWord of bookWords) {
            const similarity = 1 - (levenshteinDistance(bookWord, queryWord) /
                Math.max(bookWord.length, queryWord.length));
            maxWordScore = Math.max(maxWordScore, similarity);
        }
    }
    return maxWordScore;
}

// Find book matches across all versions
function findBookMatches(bookQuery) {
    const matches = [];
    const searchQuery = bookQuery.toLowerCase().trim();

    for (const version in bibleVersions) {
        const bibleData = bibleVersions[version];
        for (const book in bibleData) {
            const score = getBookMatchScore(book.toLowerCase(), searchQuery);
            if (score > 0.3) {
                matches.push({ book, score, version });
            }
        }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches;
}

// English to Tagalog book name mapping
const bookNameMapping = {
    // English -> Tagalog
    'genesis': ['genesis', 'henesis'],
    'exodus': ['exodo', 'exodus'],
    'john': ['juan', 'john'],
    'matthew': ['mateo', 'matthew'],
    'mark': ['marcos', 'mark'],
    'luke': ['lucas', 'luke'],
    'acts': ['mga gawa', 'acts'],
    'romans': ['roma', 'romans'],
    'james': ['santiago', 'james'],
    'peter': ['pedro', 'peter'],
    'revelation': ['pahayag', 'revelation'],
    // Add Tagalog -> English
    'juan': ['john', 'juan'],
    'mateo': ['matthew', 'mateo'],
    'marcos': ['mark', 'marcos'],
    'lucas': ['luke', 'lucas'],
    'mga gawa': ['acts', 'mga gawa'],
    'roma': ['romans', 'roma'],
    'santiago': ['james', 'santiago'],
    'pedro': ['peter', 'pedro'],
    'pahayag': ['revelation', 'pahayag']
};

// Smart cross-version search with Bible page logic
function searchAcrossVersions(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Check cache first for instant results
    if (searchCache.has(normalizedQuery)) {
        console.log('Returning cached results for:', normalizedQuery);
        return searchCache.get(normalizedQuery);
    }

    const results = [];
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    // Reference pattern (e.g., "John 3:16" or "Juan 3:16")
    const refPattern = /^((?:[123]\s)?[A-Za-z\sñ]+)\s*(\d+)(?:[\s:]+(\d+))?$/i;
    const refMatch = normalizedQuery.match(refPattern);

    // Search across all loaded versions
    for (const version in bibleVersions) {
        const bibleData = bibleVersions[version];

        // HIGHEST PRIORITY: Exact reference match (Book Chapter:Verse)
        if (refMatch) {
            const [, bookPart, chapter, verse] = refMatch;

            // Enhanced book matching - check cross-language variants
            const bookVariants = bookNameMapping[bookPart.toLowerCase()] || [bookPart.toLowerCase()];
            const bookMatches = [];

            // Find matches for all variants
            for (const variant of bookVariants) {
                const matches = findBookMatches(variant);
                bookMatches.push(...matches);
            }

            // Remove duplicates and sort by score
            const uniqueMatches = Array.from(new Map(bookMatches.map(m => [`${m.book}-${m.version}`, m])).values());
            uniqueMatches.sort((a, b) => b.score - a.score);

            for (const match of uniqueMatches) {
                if (match.version !== version) continue;
                const book = match.book;

                if (bibleData[book]?.[chapter]) {
                    if (verse && bibleData[book][chapter][verse]) {
                        // Boost score for exact verse match
                        results.push({
                            type: 'reference',
                            book,
                            chapter,
                            verse,
                            text: bibleData[book][chapter][verse],
                            version,
                            score: 100 + match.score * 10,
                            exact: true,
                            matchType: 'exact_verse'
                        });
                    } else if (!verse) {
                        // Chapter reference
                        const firstVerse = Object.keys(bibleData[book][chapter])[0];
                        if (firstVerse) {
                            results.push({
                                type: 'chapter',
                                book,
                                chapter,
                                verse: firstVerse,
                                text: bibleData[book][chapter][firstVerse],
                                version,
                                score: 90 + match.score * 10,
                                exact: true,
                                matchType: 'chapter_ref'
                            });
                        }
                    }
                }
            }
        }

        // TEXT SEARCH: Search through all verses
        const seenVerses = new Set();
        for (const book in bibleData) {
            const bookScore = getBookMatchScore(book.toLowerCase(), normalizedQuery);

            for (const chapter in bibleData[book]) {
                for (const verse in bibleData[book][chapter]) {
                    const verseKey = `${book}:${chapter}:${verse}`;
                    if (seenVerses.has(verseKey)) continue;
                    seenVerses.add(verseKey);

                    const text = bibleData[book][chapter][verse].toLowerCase();
                    let textScore = 0;

                    // Exact phrase match (HIGH PRIORITY)
                    if (text.includes(normalizedQuery)) {
                        const occurrences = (text.split(normalizedQuery).length - 1);
                        textScore += occurrences * 8;

                        // Bonus if at beginning of text
                        if (text.indexOf(normalizedQuery) < 20) {
                            textScore += 3;
                        }
                    }

                    // Multi-word match scoring
                    if (queryWords.length > 1) {
                        let wordMatches = 0;
                        let wordPositionBonus = 0;

                        for (const word of queryWords) {
                            if (text.includes(word)) {
                                wordMatches++;
                                // Bonus for word at beginning
                                if (text.indexOf(word) < 30) {
                                    wordPositionBonus += 0.5;
                                }
                            }
                        }

                        // High bonus if all words match
                        if (wordMatches === queryWords.length) {
                            textScore += wordMatches * 5 + wordPositionBonus;
                        } else if (wordMatches > 0) {
                            textScore += wordMatches * 2 + wordPositionBonus;
                        }
                    }

                    // Book name relevance
                    if (bookScore > 0.3) {
                        textScore += bookScore * 5;
                    }

                    // Only include results with meaningful scores
                    if (textScore > 0.5 || bookScore > 0.5) {
                        results.push({
                            type: 'text',
                            book,
                            chapter,
                            verse,
                            text: bibleData[book][chapter][verse],
                            version,
                            score: textScore + (bookScore * 2),
                            exact: textScore > 8
                        });
                    }
                }
            }
        }
    }

    // Get current Bible version for smart prioritization
    const currentVersion = getCurrentBibleVersion();

    // Boost scores for current version
    results.forEach(result => {
        if (result.version === currentVersion) {
            result.score += 50; // Significant boost for current version
            result.currentVersion = true;
        }
    });

    // Sort results by relevance score (Bible page logic)
    results.sort((a, b) => {
        // Prioritize current version first
        if (a.currentVersion && !b.currentVersion) return -1;
        if (!a.currentVersion && b.currentVersion) return 1;

        // Prioritize exact verse matches
        if (a.matchType === 'exact_verse' && b.matchType !== 'exact_verse') return -1;
        if (a.matchType !== 'exact_verse' && b.matchType === 'exact_verse') return 1;

        // Then exact matches
        if (a.exact && !b.exact) return -1;
        if (!a.exact && b.exact) return 1;

        // Then by score
        return b.score - a.score;
    });

    // Group by verse reference to show all versions of same verse
    const grouped = new Map();
    for (const result of results) {
        const key = `${result.book}:${result.chapter}:${result.verse}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(result);
    }

    // Flatten while prioritizing diversity (show different verses, not just all versions of one verse)
    const finalResults = [];
    const addedKeys = new Set();

    // First pass: Add one result per unique verse
    for (const [key, versions] of grouped) {
        if (finalResults.length >= 10) break;
        finalResults.push(versions[0]);
        addedKeys.add(key);
    }

    // Second pass: Add alternative versions if space allows
    for (const [key, versions] of grouped) {
        if (finalResults.length >= 15) break;
        for (let i = 1; i < versions.length && finalResults.length < 15; i++) {
            finalResults.push(versions[i]);
        }
    }

    // Cache the results for faster repeated searches
    searchCache.set(normalizedQuery, finalResults);

    // Limit cache size to prevent memory issues
    if (searchCache.size > 100) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
    }

    return finalResults;
}

// Display search suggestions
function displaySuggestions(results, query) {
    const suggestionsDiv = document.getElementById('homeSearchResults');
    if (!suggestionsDiv) {
        console.error('homeSearchResults element not found');
        return;
    }

    const normalizedQuery = query.toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    // Show message if no results
    if (!results || results.length === 0) {
        suggestionsDiv.innerHTML = `
            <div class="search-result-item" style="text-align: center; color: #9ca3af; padding: 20px;">
                <i class="bi bi-search" style="font-size: 2rem; opacity: 0.3; margin-bottom: 8px;"></i>
                <div class="search-result-preview">No results found. Try different keywords or book names.</div>
            </div>
        `;
        suggestionsDiv.classList.add('show');
        return;
    }

    const currentVersion = getCurrentBibleVersion();
    const refPattern = /^((?:[123]\s)?[A-Za-z\sñ]+)\s*(\d+)(?:[\s:]+(\d+))?$/i;

    suggestionsDiv.innerHTML = results.map((result, index) => {
        const ref = `${result.book} ${result.chapter}:${result.verse}`;
        let displayText = result.text;

        // Highlight query terms in text
        const normalizedQuery = query.toLowerCase();
        if (normalizedQuery.length > 2 && !refPattern.test(query)) {
            // Only highlight for text searches, not for reference searches
            const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
            for (const word of words) {
                const regex = new RegExp(`(${word})`, 'gi');
                displayText = displayText.replace(regex, '<mark style="background: #fef08a; padding: 2px 0;">$1</mark>');
            }
        }

        // Truncate long text
        if (displayText.length > 120) {
            displayText = displayText.substring(0, 120) + '...';
        }

        // Version badge color
        const isCurrentVersion = result.version === currentVersion;
        const versionColor = ['MBBTAG12', 'ASND', 'CEBUANO'].includes(result.version) ? '#10b981' : '#667eea';

        return `
            <div class="search-result-item" data-book="${result.book}" data-chapter="${result.chapter}" data-verse="${result.verse}" data-version="${result.version}">
                <div class="search-result-title">
                    ${ref}
                    <span class="version-badge" style="background: ${versionColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 6px; font-weight: 600;">${result.version}</span>
                    ${isCurrentVersion ? '<span style="color: #667eea; margin-left: 4px; font-size: 0.75rem; font-weight: 600;">📖 Current</span>' : ''}
                    ${index === 0 && result.exact ? '<span style="color: #10b981; margin-left: 4px; font-size: 0.75rem;">✓ Best</span>' : ''}
                </div>
                <div class="search-result-preview">${displayText}</div>
            </div>
        `;
    }).join('');

    suggestionsDiv.classList.add('show');

    // Add click handlers
    suggestionsDiv.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const book = item.dataset.book;
            const chapter = item.dataset.chapter;
            const verse = item.dataset.verse;
            const version = item.dataset.version;

            // Store version to switch to
            localStorage.setItem('bibleState', JSON.stringify({ book, chapter, version }));
            localStorage.setItem('navigateToVerse', JSON.stringify({ book, chapter, verse }));
            localStorage.setItem('lastPage', 'bible.html');
            window.location.href = window.location.pathname + '?page=bible.html';
            window.location.reload();
        });
    });
}

// Get current Bible version from localStorage
function getCurrentBibleVersion() {
    try {
        const bibleState = JSON.parse(localStorage.getItem('bibleState'));
        return bibleState?.version || 'NIV'; // Default to NIV if not set
    } catch (e) {
        return 'NIV';
    }
}

// Home Search functionality
const homeSearchInput = document.getElementById('homeSearch');
const homeSearchResults = document.getElementById('homeSearchResults');
const clearHomeSearch = document.getElementById('clearHomeSearch');
const searchGoBtn = document.getElementById('searchGoBtn');

if (homeSearchInput) {
    // Load Bible versions on init
    loadBibleVersions().then(() => {
        console.log('Bible versions loaded:', Object.keys(bibleVersions));
    });

    // Real-time search as user types (AJAX-style instant)
    homeSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        // Show/hide clear and go buttons + adjust padding
        if (clearHomeSearch && searchGoBtn) {
            if (query.length > 0) {
                clearHomeSearch.style.display = 'flex';
                searchGoBtn.style.display = 'flex';
                homeSearchInput.style.paddingRight = '80px';
            } else {
                clearHomeSearch.style.display = 'none';
                searchGoBtn.style.display = 'none';
                homeSearchInput.style.paddingRight = '16px';
            }
        }

        if (query.length < 2) {
            homeSearchResults?.classList.remove('show');
            homeSearchResults?.classList.remove('loading');
            return;
        }

        // Instant search with minimal delay for typing
        searchTimeout = setTimeout(() => {
            // Show loading state briefly
            if (homeSearchResults) {
                homeSearchResults.innerHTML = '<div style="text-align: center; padding: 20px; color: #9ca3af;"><div class="loading-spinner"></div></div>';
                homeSearchResults.classList.add('show', 'loading');
            }

            // Execute search immediately
            setTimeout(() => {
                homeSearchResults?.classList.remove('loading');
                const results = searchAcrossVersions(query);
                console.log('Search results:', results.length);
                displaySuggestions(results, query);
            }, 50); // Minimal delay for smooth UI
        }, 100); // Reduced from 400ms to 100ms for instant feel
    });

    // Clear button functionality
    if (clearHomeSearch) {
        clearHomeSearch.addEventListener('click', () => {
            homeSearchInput.value = '';
            clearHomeSearch.style.display = 'none';
            if (searchGoBtn) searchGoBtn.style.display = 'none';
            homeSearchInput.style.paddingRight = '16px';
            homeSearchResults?.classList.remove('show');
            homeSearchInput.focus();
        });
    }

    // Search Go button functionality
    if (searchGoBtn) {
        searchGoBtn.addEventListener('click', () => {
            const query = homeSearchInput.value.trim();
            if (query) {
                executeSearch(query);
            }
        });
    }

    // Function to execute search and navigate
    function executeSearch(query) {
        const results = searchAcrossVersions(query);
        if (results.length > 0) {
            // Get the top result (already prioritized by current version)
            const first = results[0];

            // Store both the version and navigation data
            localStorage.setItem('bibleState', JSON.stringify({
                book: first.book,
                chapter: first.chapter,
                version: first.version
            }));
            localStorage.setItem('navigateToVerse', JSON.stringify({
                book: first.book,
                chapter: first.chapter,
                verse: first.verse
            }));
            localStorage.setItem('lastPage', 'bible.html');
            window.location.href = window.location.pathname + '?page=bible.html';
            window.location.reload();
        }
    }

    // Enter key to go to Bible page
    homeSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            const query = homeSearchInput.value.trim();
            if (query) {
                executeSearch(query);
            }
        }
    });

    // Handle mobile keyboard "Go" button
    homeSearchInput.addEventListener('search', (e) => {
        const query = homeSearchInput.value.trim();
        if (query) {
            executeSearch(query);
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.home-search-container')) {
            homeSearchResults?.classList.remove('show');
        }
    });
}

// Daily verse iframe animation (improved smoothness)
const iframeContainer = document.getElementById("dailyEmbed");
iframeContainer.addEventListener("click", () => {
    const rect = iframeContainer.getBoundingClientRect();

    // Create fade overlay
    const fade = document.createElement("div");
    fade.className = "fade-overlay";
    document.body.appendChild(fade);

    // Clone the iframe container
    const clone = iframeContainer.cloneNode(true);
    clone.classList.add("morph-clone");
    document.body.appendChild(clone);

    // Position clone exactly over original
    clone.style.top = rect.top + "px";
    clone.style.left = rect.left + "px";
    clone.style.width = rect.width + "px";
    clone.style.height = rect.height + "px";

    // Disable pointer events on cloned iframe
    const cloneIframe = clone.querySelector("iframe");
    if (cloneIframe) {
        cloneIframe.style.pointerEvents = "none";
    }

    // Navigate after animation completes (matching CSS animation duration)
    setTimeout(() => {
        fade.remove();
        clone.remove();

        // Find and click the daily verse menu item
        const dailyMenu = document.querySelector('[data-page="daily-verse.html"]');
        if (dailyMenu) {
            dailyMenu.click();
        }
    }, 650); // Matches blur animation duration (0.6s) + small buffer
});
