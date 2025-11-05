// Shared greeting functionality for all pages
function showPageGreeting() {
    
    // Get the current time for greeting
    const hour = new Date().getHours();
    let greeting = 'Good ';
    
    if (hour < 12) {
        greeting += 'morning';
    } else if (hour < 18) {
        greeting += 'afternoon';
    } else {
        greeting += 'evening';
    }
    
    // Get the page name for the greeting
    let pageName = document.title.replace(' - Bible App', '');
    if (pageName === 'Bible App') {
        pageName = '';
    } else {
        pageName = `on ${pageName}`;
    }
    
    // Create greeting element
    const greetingEl = document.createElement('div');
    greetingEl.className = 'page-greeting';
    greetingEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 1rem;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        pointer-events: none;
    `;
    
    // Add greeting text
    greetingEl.textContent = `${greeting}${pageName ? `, welcome ${pageName}` : ''}!`;
    
    // Add to document
    document.body.appendChild(greetingEl);
    
    // Trigger fade in
    setTimeout(() => {
        greetingEl.style.opacity = '1';
    }, 100);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        greetingEl.style.opacity = '0';
        // Remove from DOM after fade out
        setTimeout(() => {
            if (greetingEl.parentNode) {
                greetingEl.parentNode.removeChild(greetingEl);
            }
        }, 500);
    }, 3000);
}

// Export the function for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showPageGreeting };
}
