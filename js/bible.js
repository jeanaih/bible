let bibleData = null;
let currentBook = 'Genesis';
let currentChapter = '1';

// === ENGLISH BOOK LISTS ===
const oldTestament = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song Of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const newTestament = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// === TAGALOG BOOKS ===
const tagalogBookNames = {
  1: "Genesis", 2: "Exodo", 3: "Levitico", 4: "Mga Bilang", 5: "Deuteronomio",
  6: "Josue", 7: "Mga Hukom", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Mga Hari", 12: "2 Mga Hari", 13: "1 Cronica", 14: "2 Cronica",
  15: "Ezra", 16: "Nehemias", 17: "Ester", 18: "Job", 19: "Mga Awit",
  20: "Mga Kawikaan", 21: "Eclesiastes", 22: "Awit ni Solomon", 23: "Isaias",
  24: "Jeremias", 25: "Panaghoy", 26: "Ezekiel", 27: "Daniel", 28: "Oseas",
  29: "Joel", 30: "Amos", 31: "Obadias", 32: "Jonas", 33: "Mikas",
  34: "Nahum", 35: "Habakuk", 36: "Zefanias", 37: "Hagai", 38: "Zacarias",
  39: "Malakias",
  40: "Mateo", 41: "Marcos", 42: "Lucas", 43: "Juan",
  44: "Mga Gawa", 45: "Roma", 46: "1 Corinto", 47: "2 Corinto",
  48: "Galacia", 49: "Efeso", 50: "Filipos", 51: "Colosas",
  52: "1 Tesalonica", 53: "2 Tesalonica", 54: "1 Timoteo",
  55: "2 Timoteo", 56: "Tito", 57: "Filemon", 58: "Hebreo",
  59: "Santiago", 60: "1 Pedro", 61: "2 Pedro", 62: "1 Juan",
  63: "2 Juan", 64: "3 Juan", 65: "Judas", 66: "Pahayag"
};

// === MAIN INIT ===
document.addEventListener('DOMContentLoaded', initializeBible);

async function initializeBible() {
  const saved = JSON.parse(localStorage.getItem('bibleState'));
  if (saved) {
    currentBook = saved.book || 'Genesis';
    currentChapter = saved.chapter || '1';
    const verSel = document.getElementById('bibleVersion');
    if (verSel && saved.version) verSel.value = saved.version;
  }

  // Event Listeners
  document.getElementById('bibleVersion').addEventListener('change', onVersionSwitch);
  document.getElementById('selectBookChapter').addEventListener('click', toggleUnifiedModal);
  document.getElementById('prevChapter').addEventListener('click', () => changeChapter(-1));
  document.getElementById('nextChapter').addEventListener('click', () => changeChapter(1));
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', e => switchTestament(e.target.dataset.testament))
  );

  initializeSearch();
  await loadBible();
}

// === SMOOTH VERSION SWITCH ===
async function onVersionSwitch() {
  const contentDiv = document.getElementById('bibleContent');
  contentDiv.classList.add('fade-out');

  setTimeout(async () => {
    await loadBible();
    contentDiv.classList.remove('fade-out');
    contentDiv.classList.add('fade-in');
    setTimeout(() => contentDiv.classList.remove('fade-in'), 400);
  }, 250);
}

// === LOAD BIBLE ===
async function loadBible() {
  const version = document.getElementById('bibleVersion').value;
  const contentDiv = document.getElementById('bibleContent');
  contentDiv.innerHTML = `<div class="loading">Loading ${version}...</div>`;

  try {
    let biblePath, response;

    // ✅ Tagalog-family versions (MBBTAG12, ASND, Cebuano)
    if (['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version)) {
      if (version === 'MBBTAG12') {
        biblePath = `../Bible Versions/Tagalog/MBBTAG12.xml`;
      } else if (version === 'ASND') {
        biblePath = `../Bible Versions/ASND/ASND.xml`;
      } else if (version === 'CEBUANO') {
        biblePath = `../Bible Versions/CEBUANO/CEBUANO.xml`;
      }
      else if (version === 'KAPAMPANGAN') {
        biblePath = `../Bible Versions/KAPAMPANGAN/KAPAMPANGAN.xml`;
      }

      response = await fetch(biblePath);
      const xml = await response.text();
      const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
      bibleData = parseMBBTagalog(xmlDoc);
    } else {
      // ✅ JSON-based (English) versions
      biblePath = `../Bible Versions/${version}/${version}_bible.json`;
      response = await fetch(biblePath);
      bibleData = await response.json();
    }

    if (!bibleData) throw new Error("No Bible data loaded");

    updateTestamentTabs(version);
    setupBookList('old', version);
    syncBookLanguage(version);
    updateCurrentBookDisplay();
    await displayContent();
    saveBibleState();

  } catch (err) {
    console.error('Error loading Bible:', err);
    contentDiv.innerHTML = `
      <div class="error">
        <p>Failed to load ${version} content.</p>
        <button onclick="loadBible()">Retry</button>
      </div>`;
  }
}

// === SYNC BOOK LANGUAGE ===
function syncBookLanguage(version) {
  const isTagalogLike = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);
  const allBooks = [...oldTestament, ...newTestament];

  if (isTagalogLike) {
    const engIndex = allBooks.indexOf(currentBook) + 1;
    if (engIndex > 0 && tagalogBookNames[engIndex]) {
      currentBook = tagalogBookNames[engIndex];
    }
  } else {
    const tagIndex = Object.values(tagalogBookNames).indexOf(currentBook);
    if (tagIndex >= 0) {
      currentBook = allBooks[tagIndex] || 'Genesis';
    }
  }
}

// === PARSE XML ===
function parseMBBTagalog(xmlDoc) {
  const data = {};
  const books = xmlDoc.getElementsByTagName("book");

  for (let book of books) {
    const num = parseInt(book.getAttribute("number"));
    const name = tagalogBookNames[num] || `Aklat ${num}`;
    data[name] = {};

    const chapters = book.getElementsByTagName("chapter");
    for (let chapter of chapters) {
      const chapNum = chapter.getAttribute("number");
      data[name][chapNum] = {};
      const verses = chapter.getElementsByTagName("verse");
      for (let verse of verses) {
        const vNum = verse.getAttribute("number");
        const text = verse.textContent.trim();
        data[name][chapNum][vNum] = text;
      }
    }
  }
  return data;
}

// === BOOK LIST HANDLER ===
function setupBookList(testament, version) {
  const bookList = document.getElementById('modalList');
  bookList.innerHTML = '';

  const isTagalogLike = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);
  let books;

  if (isTagalogLike) {
    const nums = testament === 'old'
      ? Array.from({ length: 39 }, (_, i) => i + 1)
      : Array.from({ length: 27 }, (_, i) => i + 40);
    books = nums.map(num => tagalogBookNames[num]);
  } else {
    books = testament === 'old' ? oldTestament : newTestament;
  }

  books.forEach(book => {
    const el = document.createElement('div');
    el.className = 'book-item';
    el.textContent = book;
    el.addEventListener('click', () => selectBook(book));
    bookList.appendChild(el);
  });
}

// === TESTAMENT TABS ===
function updateTestamentTabs(version) {
  const tabOld = document.querySelector('[data-testament="old"]');
  const tabNew = document.querySelector('[data-testament="new"]');
  const isTagalogLike = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);

  if (isTagalogLike) {
    tabOld.textContent = 'Lumang Tipan';
    tabNew.textContent = 'Bagong Tipan';
  } else {
    tabOld.textContent = 'Old Testament';
    tabNew.textContent = 'New Testament';
  }
}

function switchTestament(testament) {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.testament === testament)
  );
  const version = document.getElementById('bibleVersion').value;
  setupBookList(testament, version);
}

// === BOOK & CHAPTER SELECTION ===
function selectBook(book) {
  currentBook = book;
  const modalTitle = document.getElementById('modalTitle');
  const testamentTabs = document.getElementById('testamentTabs');
  const modalList = document.getElementById('modalList');
  const modal = document.getElementById('unifiedModal');
  
  modalTitle.textContent = `${book}`;
  testamentTabs.style.display = 'none';
  modal.dataset.mode = 'chapter';
  
  if (!bibleData || !bibleData[book]) return;
  
  const total = Object.keys(bibleData[book]).length;
  modalList.innerHTML = '';
  
  // Create grid layout for chapters
  for (let i = 1; i <= total; i++) {
    const div = document.createElement('div');
    div.className = `chapter-item ${i === parseInt(currentChapter) ? 'active' : ''}`;
    div.textContent = i;
    div.addEventListener('click', () => {
      currentChapter = i.toString();
      modal.dataset.mode = 'book';
      toggleUnifiedModal();
      updateCurrentBookDisplay();
      displayContent();
      saveBibleState();
    });
    modalList.appendChild(div);
  }
}

// Update the updateCurrentBookDisplay function
function updateCurrentBookDisplay() {
  // Main display
  document.getElementById('selectBookChapter').innerHTML = `
    <span id="currentBook">${currentBook}</span>
    <span id="currentChapter">${currentChapter}</span>
  `;
  
  document.getElementById('bookTitle').innerHTML = `
    <span class="book-name">${currentBook}</span>
    <span class="chapter-number">${currentChapter}</span>`;

  // Update navigation buttons
  updateNavigationButtons();
}

// Add new function to update navigation buttons
function updateNavigationButtons() {
  if (!bibleData || !bibleData[currentBook]) return;
  
  const total = Object.keys(bibleData[currentBook]).length;
  const current = parseInt(currentChapter);
  
  // Previous chapter
  const prevChap = current > 1 ? current - 1 : total;
  document.getElementById('prevChapterText').textContent = ` ${prevChap}`;
  
  // Next chapter
  const nextChap = current < total ? current + 1 : 1;
  document.getElementById('nextChapterText').textContent = `${nextChap} `;

  // Enable/disable buttons based on availability
  document.getElementById('prevChapter').disabled = !bibleData[currentBook][prevChap.toString()];
  document.getElementById('nextChapter').disabled = !bibleData[currentBook][nextChap.toString()];
}

// Update the changeChapter function
function changeChapter(delta) {
  if (!bibleData || !bibleData[currentBook]) return;
  const total = Object.keys(bibleData[currentBook]).length;
  let newChap = parseInt(currentChapter) + delta;
  if (newChap < 1) newChap = total;
  if (newChap > total) newChap = 1;
  currentChapter = newChap.toString();
  updateCurrentBookDisplay();
  displayContent();
  saveBibleState();
}

// === UNIFIED MODAL ===
function toggleUnifiedModal() {
  const modal = document.getElementById('unifiedModal');
  const modalTitle = document.getElementById('modalTitle');
  const testamentTabs = document.getElementById('testamentTabs');
  
  if (modal.style.display === 'block') {
    modal.style.display = 'none';
    return;
  }

  modal.style.display = 'block';
  if (!modal.dataset.mode || modal.dataset.mode === 'book') {
    modalTitle.textContent = 'Select Book';
    testamentTabs.style.display = 'flex';
    const version = document.getElementById('bibleVersion').value;
    setupBookList('old', version);
  }
}

// === DISPLAY CONTENT ===
async function displayContent() {
  const div = document.getElementById('bibleContent');
  if (!bibleData || !bibleData[currentBook] || !bibleData[currentBook][currentChapter]) {
    div.innerHTML = '<p>No content available.</p>';
    return;
  }

  const verses = bibleData[currentBook][currentChapter];
  div.innerHTML = Object.entries(verses)
    .map(([num, text]) => `<div class="verse"><strong>${num}</strong> ${text}</div>`)
    .join('');
}

// === SAVE STATE ===
function saveBibleState() {
  const version = document.getElementById('bibleVersion').value;
  localStorage.setItem('bibleState', JSON.stringify({
    book: currentBook,
    chapter: currentChapter,
    version
  }));
}

// === MODALS ===
document.addEventListener('click', e => {
  const modal = document.getElementById('unifiedModal');
  if (e.target === modal) {
    modal.dataset.mode = 'book';
    toggleUnifiedModal();
  }
});

// === SMART SEARCH === 
function initializeSearch() {
    const searchInput = document.getElementById('bibleSearch');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Handle search from URL params if any
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
        handleSearch({ target: searchInput });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (query.length < 2) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    const results = await searchBible(query);
    displaySearchSuggestions(results, query);
}

// === IMPROVED SMART SEARCH === 
async function searchBible(query) {
    const results = [];
    
    // Enhanced pattern matching
    const patterns = [
        // Book Chapter:Verse (e.g., "John 3:16" or "Juan 3 16")
        /^((?:[123]\s)?[A-Za-z\s]+)\s*(\d+)(?:[\s:]+(\d+))?$/i,
        // Verse reference with chapter (e.g., "3:16" or "3 16")
        /^(\d+)[\s:]+(\d+)$/,
        // Single number (assumed to be chapter)
        /^(\d+)$/,
        // Text search
        /^(.+)$/
    ];

    // Try each pattern
    for (const pattern of patterns) {
        const match = query.trim().match(pattern);
        if (match) {
            if (pattern === patterns[0]) {
                // Book Chapter:Verse pattern
                const [, bookName, chapter, verse] = match;
                await findBookMatches(bookName, chapter, verse, results);
            } else if (pattern === patterns[1]) {
                // Chapter:Verse pattern (current book)
                const [, chapter, verse] = match;
                if (bibleData[currentBook]?.[chapter]?.[verse]) {
                    results.push({
                        type: 'reference',
                        book: currentBook,
                        chapter,
                        verse,
                        text: bibleData[currentBook][chapter][verse]
                    });
                }
            } else if (pattern === patterns[2]) {
                // Single number (chapter)
                const [, chapter] = match;
                if (bibleData[currentBook]?.[chapter]) {
                    results.push({
                        type: 'chapter',
                        book: currentBook,
                        chapter
                    });
                }
            } else {
                // Text search
                await performTextSearch(query.toLowerCase(), results);
            }
            break;
        }
    }

    return results.slice(0, 8); // Show more results
}

async function findBookMatches(bookQuery, chapter, verse, results) {
    const version = document.getElementById('bibleVersion').value;
    const isTagalogVersion = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);
    
    // Get both English and Tagalog book lists
    const englishBooks = [...oldTestament, ...newTestament];
    const tagalogBooks = Object.values(tagalogBookNames);
    
    // Search in both languages
    const searchInLanguage = (books, query) => {
        return books.filter(book => {
            const similarity = stringSimilarity(book.toLowerCase(), query.toLowerCase());
            return similarity > 0.4; // Adjust threshold as needed
        });
    };

    let matchedBooks = [
        ...searchInLanguage(englishBooks, bookQuery),
        ...searchInLanguage(tagalogBooks, bookQuery)
    ];

    // Remove duplicates
    matchedBooks = [...new Set(matchedBooks)];

    for (const book of matchedBooks) {
        if (!bibleData[book]) continue;

        if (chapter) {
            if (bibleData[book][chapter]) {
                if (verse) {
                    if (bibleData[book][chapter][verse]) {
                        results.push({
                            type: 'reference',
                            book,
                            chapter,
                            verse,
                            text: bibleData[book][chapter][verse],
                            exact: true
                        });
                    }
                } else {
                    results.push({
                        type: 'chapter',
                        book,
                        chapter,
                        exact: true
                    });
                }
            }
        } else {
            results.push({
                type: 'book',
                book,
                exact: true
            });
        }
    }
}

async function performTextSearch(query, results) {
    for (const book in bibleData) {
        for (const chapter in bibleData[book]) {
            for (const verse in bibleData[book][chapter]) {
                const text = bibleData[book][chapter][verse].toLowerCase();
                if (text.includes(query)) {
                    results.push({
                        type: 'text',
                        book,
                        chapter,
                        verse,
                        text: bibleData[book][chapter][verse],
                        matchScore: text.split(query).length - 1
                    });
                }
            }
        }
    }
    
    // Sort text results by relevance
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

function stringSimilarity(s1, s2) {
    let longer = s1.length > s2.length ? s1 : s2;
    let shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

// Update displaySearchSuggestions for better presentation
function displaySearchSuggestions(results, query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (results.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item">No matches found. Try different spelling or format (e.g., "John 3:16" or "Juan 3 16")</div>';
        return;
    }
    
    const groupedResults = {
        exact: results.filter(r => r.exact),
        others: results.filter(r => !r.exact)
    };
    
    suggestionsDiv.innerHTML = [
        ...groupedResults.exact.map(formatSuggestion),
        ...groupedResults.others.map(formatSuggestion)
    ].join('');
}

function formatSuggestion(result) {
    const highlightMatch = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    };

    switch (result.type) {
        case 'reference':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}', '${result.chapter}', '${result.verse}')">
                <div class="suggestion-title">${result.book} ${result.chapter}:${result.verse}</div>
                <div class="suggestion-preview">${truncateText(result.text, 60)}</div>
            </div>`;
        case 'chapter':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}', '${result.chapter}')">
                <div class="suggestion-title">${result.book} ${result.chapter}</div>
                <div class="suggestion-preview">View entire chapter</div>
            </div>`;
        case 'book':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}')">
                <div class="suggestion-title">${result.book}</div>
                <div class="suggestion-preview">View book</div>
            </div>`;
        case 'text':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}', '${result.chapter}', '${result.verse}')">
                <div class="suggestion-title">${result.book} ${result.chapter}:${result.verse}</div>
                <div class="suggestion-preview">${truncateText(result.text, 60)}</div>
            </div>`;
    }
}

function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function navigateToVerse(book, chapter, verse) {
    currentBook = book;
    if (chapter) currentChapter = chapter;
    
    toggleUnifiedModal();
    updateCurrentBookDisplay();
    
    displayContent().then(() => {
        if (verse) {
            const verseElement = document.querySelector(`.verse:nth-child(${verse})`);
            if (verseElement) {
                verseElement.classList.add('highlighted');
                verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    verseElement.classList.remove('highlighted');
                }, 3000);
            }
        }
    });
    
    // Update URL for bookmarking
    const searchParams = new URLSearchParams();
    if (verse) {
        searchParams.set('search', `${book} ${chapter}:${verse}`);
    } else if (chapter) {
        searchParams.set('search', `${book} ${chapter}`);
    } else {
        searchParams.set('search', book);
    }
    
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}
