// menu.js

async function loadPage(pageName, forceReload = false) {
    try {
        // Add a timestamp to bypass browser cache when forceReload is true
        const url = forceReload ? `pages/${pageName}?_=${Date.now()}` : `pages/${pageName}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Page not found: ${pageName}`);
        const content = await response.text();

        const temp = document.createElement('div');
        temp.innerHTML = content;

        const inlineScripts = Array.from(temp.querySelectorAll('script:not([src])')).map(s => s.textContent);
        const externalSrcs = Array.from(temp.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
        temp.querySelectorAll('script').forEach(s => s.remove());

        const container = document.getElementById('content');
        container.innerHTML = temp.innerHTML;

        // Execute inline scripts
        inlineScripts.forEach(code => {
            const s = document.createElement('script');
            s.text = code;
            document.body.appendChild(s);
            setTimeout(() => document.body.removeChild(s), 0);
        });

        // Helper for managing script loading
        function ensureExternalScript(src, dataName, onloadInitName) {
            const absSrc = src;
            const existing = Array.from(document.querySelectorAll('script')).find(el =>
                (el.dataset && el.dataset.name === dataName) || el.getAttribute('src') === absSrc
            );

            // Always reload the script if forceReload is true
            if (forceReload && existing) {
                existing.remove();
            }

            if (!existing || forceReload) {
                const s = document.createElement('script');
                s.src = absSrc;
                if (dataName) s.dataset.name = dataName;
                s.onload = () => {
                    if (onloadInitName && typeof window[onloadInitName] === 'function') {
                        try { window[onloadInitName](); } catch (e) { console.error(e); }
                    }
                };
                document.body.appendChild(s);
            } else {
                if (onloadInitName && typeof window[onloadInitName] === 'function') {
                    try { window[onloadInitName](); } catch (e) { console.error(e); }
                }
            }
        }

        // Inject external scripts (respect their paths)
        externalSrcs.forEach(src => {
            if (src.includes('daily.js')) {
                ensureExternalScript(src, 'daily-js', 'initDailyVerse');
            } else if (src.includes('bible.js')) {
                ensureExternalScript(src, 'bible-js', 'initializeBible');
            } else {
                ensureExternalScript(src, `ext-${src}`, null);
            }
        });

        // Default fallback if no script tags found
        if (pageName === 'daily.html') {
            ensureExternalScript('js/daily.js', 'daily-js', 'initDailyVerse');
        } else if (pageName === 'bible.html') {
            ensureExternalScript('js/bible.js', 'bible-js', 'initializeBible');
        }

    } catch (error) {
        console.error('Error loading page:', error);
        document.getElementById('content').innerHTML = '<p>Error loading page content.</p>';
    }
}

// Load home by default
document.addEventListener('DOMContentLoaded', () => {
    loadPage('home.html');
});

// Menu clicks
document.addEventListener("click", (e) => {
    const target = e.target.closest(".menu-item");
    if (!target) return;

    e.preventDefault();

    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    target.classList.add("active");

    const page = target.getAttribute("data-page");

    // 🔹 Always reload the page content even if it's the same
    loadPage(page, true);
});
