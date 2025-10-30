let bibleData = null;

async function loadBible() {
    const version = document.getElementById('version').value;
    try {
        const response = await fetch(`Bible Versions/${version}/${version}_bible.json`);
        bibleData = await response.json();
        populateBooks();
    } catch (error) {
        console.error('Error loading Bible:', error);
    }
}

function populateBooks() {
    const bookSelect = document.getElementById('book');
    bookSelect.innerHTML = '';
    Object.keys(bibleData).forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        bookSelect.appendChild(option);
    });
    populateChapters();
}

function populateChapters() {
    const book = document.getElementById('book').value;
    const chapterSelect = document.getElementById('chapter');
    chapterSelect.innerHTML = '';

    Object.keys(bibleData[book]).forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        chapterSelect.appendChild(option);
    });
    displayContent();
}

function displayContent() {
    const book = document.getElementById('book').value;
    const chapter = document.getElementById('chapter').value;
    const contentDiv = document.getElementById('content');

    const verses = bibleData[book][chapter];
    contentDiv.innerHTML = Object.entries(verses)
        .map(([verseNum, text]) => `
            <div class="verse">
                <strong>${verseNum}</strong> ${text}
            </div>
        `).join('');
}

document.getElementById('version').addEventListener('change', loadBible);
document.getElementById('book').addEventListener('change', populateChapters);
document.getElementById('chapter').addEventListener('change', displayContent);

// Initial load
loadBible();
