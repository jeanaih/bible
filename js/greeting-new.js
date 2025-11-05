// Show greeting and navigate to home page
function showGreeting() {
    // Only show on index page
    const isIndexPage = window.location.pathname.endsWith('index.html') ||
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!isIndexPage) return;
    
    // Add fadeIn and fadeOut animations if not already added
    if (!document.getElementById('greeting-animations')) {
        const style = document.createElement('style');
        style.id = 'greeting-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }`;
        document.head.appendChild(style);
    }
    
    // Create greeting container
    const greeting = document.createElement('div');
    greeting.id = 'greeting';
    greeting.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Source Serif Pro', serif;
        font-size: 24px;
        z-index: 9999;
        opacity: 0;
        animation: fadeIn 0.5s ease-in-out forwards;
    `;
    
    // Add greeting text
    greeting.innerHTML = '<h1>Welcome to Bible App</h1>';
    
    // Add to document
    document.body.appendChild(greeting);
    
    // Navigate to home after delay
    setTimeout(() => {
        // Fade out greeting
        greeting.style.animation = 'fadeOut 0.5s ease-in-out forwards';
        
        // Remove greeting and navigate
        setTimeout(() => {
            if (greeting.parentNode) {
                greeting.parentNode.removeChild(greeting);
            }
            
            // Use SPA navigation if available, otherwise redirect
            if (window.loadPage) {
                window.loadPage('home.html');
            } else {
                window.location.href = 'pages/home.html';
            }
        }, 500);
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show greeting after short delay
    setTimeout(showGreeting, 100);
});
