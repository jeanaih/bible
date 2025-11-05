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
            @keyframes fadeOut {
                to { opacity: 0; visibility: hidden; }
            }
        `;
        document.head.appendChild(animationStyle);
    }

    // Create greeting text element
    const greetingText = document.createElement('div');
    greetingText.id = 'greeting-text';
    greetingText.style.cssText = `
        font-size: 2rem;
        font-weight: 600;
        color: #1a237e;
        text-align: center;
        padding: 20px;
    `;

    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.style.cssText = `
        display: flex;
        justify-content: center;
        margin-top: 20px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Add dots to typing indicator
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        dot.style.cssText = `
            width: 8px;
            height: 8px;
            background-color: #1a237e;
            border-radius: 50%;
            margin: 0 4px;
            animation: bounce 1.4s infinite ease-in-out both;
            animation-delay: ${i * 0.16}s;
        `;
        typingIndicator.appendChild(dot);
    }

    // Add elements to container
    greetingContainer.appendChild(greetingText);
    greetingContainer.appendChild(typingIndicator);
    document.body.appendChild(greetingContainer);

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        @keyframes fadeOut {
            to { opacity: 0; visibility: hidden; }
        }
    `;
    document.head.appendChild(style);

    // Get appropriate greeting based on time of day
    const hour = new Date().getHours();
    let greeting = 'Good ';

    if (hour < 12) greeting += 'morning';
    else if (hour < 18) greeting += 'afternoon';
    else greeting += 'evening';

    // Get user's name if available
    const userName = localStorage.getItem('userName');
    if (userName) {
        greeting += `, ${userName}`;
    }
    greeting += '!';

    // Type out the greeting
    typeText(greetingText, greeting, () => {
        // Show typing indicator after greeting is typed
        typingIndicator.style.opacity = '1';

        // Hide greeting after delay and redirect to home
        setTimeout(() => {
            greetingContainer.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
                if (document.body.contains(greetingContainer)) {
                    document.body.removeChild(greetingContainer);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }

                // For existing users, always go to home page after greeting
                const userName = localStorage.getItem('userName');
                const isExistingUser = userName && localStorage.getItem('onboardingComplete') === 'true';
                
                if (isExistingUser) {
                    // Use SPA navigation if available, otherwise redirect
                    if (window.loadPage) {
                        window.loadPage('home.html');
                    } else {
                        window.location.href = 'pages/home.html';
                    }
                } else {
                    // For new users, use safe navigation
                    safeNavigateToHome();
                }
            }, 500);
        }, 2000); // Show for 2 seconds after typing for better visibility
    });

    // Mark as shown for this session
    sessionStorage.setItem('greetingShownThisSession', 'true');
    
    // Initialize the app after greeting is done
    if (window.appState) {
        window.appState.init();
    } else {
        document.body.style.opacity = '1';
        safeNavigateToHome();
    }
}

// Helper function for typing effect
function typeText(element, text, onComplete) {
    let i = 0;
    const speed = 50; // milliseconds per character

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (onComplete) {
            onComplete();
        }
    }

    type();
}
