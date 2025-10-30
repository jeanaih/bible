let currentBook = '';
let currentChapter = '';
let currentVerse = '';
let bibleData = null;

// Cache promise so multiple calls don’t refetch
let biblePromise = null;

// AJAX-style async loader
async function loadBible() {
    if (bibleData) return bibleData; // already loaded
    if (biblePromise) return biblePromise; // currently loading

    let biblePath = "Bible%20Versions/NIV/NIV_bible.json";
    const path = window.location.pathname;
    if (path.includes("/pages/") || path.includes("\\pages\\")) {
        biblePath = "../Bible%20Versions/NIV/NIV_bible.json";
    }

    console.log("📖 Loading Bible data via AJAX...");

    biblePromise = fetch(biblePath)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load JSON (" + res.status + ")");
            return res.json();
        })
        .then(json => {
            bibleData = json;
            console.log("✅ Bible data loaded successfully.");
            return bibleData;
        })
        .catch(err => {
            console.error("❌ Failed to load Bible:", err);
            document.getElementById("verse-text").textContent = "Failed to load verses.";
        });

    return biblePromise;
}

// Get random verse
function getRandomVerse() {
    const books = Object.keys(bibleData);
    const book = books[Math.floor(Math.random() * books.length)];
    const chapters = Object.keys(bibleData[book]);
    const chapter = chapters[Math.floor(Math.random() * chapters.length)];
    const verses = Object.keys(bibleData[book][chapter]);
    const verse = verses[Math.floor(Math.random() * verses.length)];
    const verseText = bibleData[book][chapter][verse];
    return { book, chapter, verse, text: verseText };
}

// Display verse smoothly
function displayVerse(data) {
    const verseTextEl = document.getElementById("verse-text");
    const verseRefEl = document.getElementById("verse-ref");

    if (!verseTextEl || !verseRefEl) return;
    if (!data) {
        verseTextEl.textContent = "Loading verse...";
        verseRefEl.textContent = "";
        return;
    }

    verseTextEl.style.opacity = 0;
    verseRefEl.style.opacity = 0;

    setTimeout(() => {
        verseTextEl.textContent = data.text;
        verseRefEl.textContent = `${data.book} ${data.chapter}:${data.verse}`;
        verseTextEl.style.opacity = 1;
        verseRefEl.style.opacity = 1;
    }, 150);
}

// Calculate ms until next midnight
function msUntilMidnight() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return nextMidnight - now;
}

// Change verse & save to localStorage
function setNewDailyVerse() {
    if (!bibleData) return;
    const newVerse = getRandomVerse();
    const today = new Date().toDateString();
    localStorage.setItem("dailyVerse", JSON.stringify({ date: today, verse: newVerse }));
    displayVerse(newVerse);
    console.log("🔄 Daily verse changed:", `${newVerse.book} ${newVerse.chapter}:${newVerse.verse}`);
}

// Initialize (AJAX + caching)
async function initDailyVerse() {
    try {
        displayVerse(null); // show “loading verse...”
        await loadBible();

        const today = new Date().toDateString();
        const savedData = JSON.parse(localStorage.getItem("dailyVerse"));
        let verseData;

        if (savedData && savedData.date === today) {
            verseData = savedData.verse;
            console.log("📅 Using saved verse for today.");
        } else {
            verseData = getRandomVerse();
            localStorage.setItem("dailyVerse", JSON.stringify({ date: today, verse: verseData }));
            console.log("✨ New daily verse set.");
        }

        displayVerse(verseData);

        // Schedule refresh at midnight
        const timeToMidnight = msUntilMidnight();
        setTimeout(() => {
            setNewDailyVerse();
            setInterval(setNewDailyVerse, 24 * 60 * 60 * 1000);
        }, timeToMidnight);

        // Debug helper
        window.debugChangeVerse = () => {
            console.warn("⚙️ Debug: Changing verse manually...");
            setNewDailyVerse();
        };
        console.log("💡 Type `debugChangeVerse()` in console to manually refresh verse.");

    } catch (err) {
        console.error("Error initializing daily verse:", err);
        document.getElementById("verse-text").textContent = "Unable to load verse.";
    }
}

// Run init
initDailyVerse();
