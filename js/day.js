document.addEventListener("DOMContentLoaded", () => {
    const dailyBtn = document.getElementById('daily-btn');
    const content = document.getElementById('content');
    const menuItems = document.querySelectorAll('.menu-item');
    const homeBtn = document.querySelector('[data-page="home.html"]');

    // === Create Floating Buttons (hidden by default) ===
    const floatingActions = document.createElement('div');
    floatingActions.className = 'floating-actions';
    floatingActions.style.display = 'none'; // hidden initially
    floatingActions.innerHTML = `
        <button class="float-btn heart" id="heartBtn"><i class="bi bi-heart"></i></button>
        <button class="float-btn save" id="saveBtn"><i class="bi bi-bookmark"></i></button>
        <button class="float-btn bible" id="readFullBtn"><i class="bi bi-book"></i></button>
    `;
    document.body.appendChild(floatingActions);

    // === Universal Page Loader ===
    async function loadPage(page, callback = null) {
        try {
            const res = await fetch(page);
            const html = await res.text();
            content.innerHTML = html;
            reinitScripts();
            if (callback) callback();
        } catch (err) {
            console.error("Page load error:", err);
            content.innerHTML = "<p style='text-align:center; color:red;'>Error loading page.</p>";
        }
    }

    function reinitScripts() {
        if (typeof initBibleFunctions === 'function') initBibleFunctions();
        if (typeof initAppFeatures === 'function') initAppFeatures();
        if (typeof initSearch === 'function') initSearch();
    }

    // === Menu Buttons ===
    menuItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');

            // Daily verse
            if (item === dailyBtn) {
                await loadDailyVerseSection();
                setActive(item);
                return;
            }

            // Hide floating buttons when not on Daily Verse
            floatingActions.style.display = 'none';

            await loadPage(page);
            setActive(item);
        });
    });

    function setActive(el) {
        menuItems.forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }

    // === Daily Verse Page Loader ===
    async function loadDailyVerseSection() {
        content.innerHTML = `
            <div class="daily-verse-container">
                <div class="verse-box">
                    <h2>Daily Verse</h2>
                    <p id="verse-text">Loading...</p>
                    <small id="verse-ref"></small>
                </div>
            </div>
        `;

        await loadDailyVerse();
        initFloatingButtons();
        floatingActions.style.display = 'flex';
    }

    // === Daily Verse Logic ===
    async function loadDailyVerse() {
        try {
            let biblePath = "Bible%20Versions/NIV/NIV_bible.json";
            if (window.location.pathname.includes("/pages/")) {
                biblePath = "../Bible%20Versions/NIV/NIV_bible.json";
            }

            const response = await fetch(biblePath);
            const bible = await response.json();

            const today = new Date();
            const seed = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

            function seededRandom(seedStr) {
                let hash = 0;
                for (let i = 0; i < seedStr.length; i++) {
                    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
                }
                return (Math.abs(hash) % 1000000) / 1000000;
            }

            const books = Object.keys(bible);
            const book = books[Math.floor(seededRandom(seed) * books.length)];
            const chapters = Object.keys(bible[book]);
            const chapter = chapters[Math.floor(seededRandom(seed + "c") * chapters.length)];
            const verses = Object.keys(bible[book][chapter]);
            const verse = verses[Math.floor(seededRandom(seed + "v") * verses.length)];

            const verseText = bible[book][chapter][verse];
            document.getElementById("verse-text").textContent = verseText;
            document.getElementById("verse-ref").textContent = `${book} ${chapter}:${verse}`;
        } catch (err) {
            document.getElementById("verse-text").textContent = "Error loading verse.";
            console.error("Error loading verse:", err);
        }
    }

    // === Floating Buttons Functionality ===
    function initFloatingButtons() {
        const heartBtn = document.getElementById('heartBtn');
        const saveBtn = document.getElementById('saveBtn');
        const readFullBtn = document.getElementById('readFullBtn');

        heartBtn.onclick = () => {
            heartBtn.classList.toggle('hearted');
            const icon = heartBtn.querySelector('i');
            icon.classList.toggle('bi-heart');
            icon.classList.toggle('bi-heart-fill');
        };

        saveBtn.onclick = () => {
            const verseText = document.getElementById('verse-text').textContent;
            const verseRef = document.getElementById('verse-ref').textContent;
            const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
            savedVerses.push({ text: verseText, reference: verseRef });
            localStorage.setItem('savedVerses', JSON.stringify(savedVerses));
            alert('Verse saved to your collection!');
        };

        readFullBtn.onclick = () => {
            const verseRef = document.getElementById('verse-ref').textContent;
            if (verseRef) {
                const [book, chapter] = verseRef.split(' ');
                window.location.href = `bible.html?book=${encodeURIComponent(book)}&chapter=${chapter}`;
            }
        };
    }

    // === Default: Always Load Home Page on Reload ===
    loadPage('home.html', () => setActive(homeBtn));
});