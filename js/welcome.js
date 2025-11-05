// Welcome modal with typing animation
document.addEventListener('DOMContentLoaded', () => {
    const welcomeModal = document.getElementById('welcomeModal');
    const welcomeContent = document.getElementById('welcomeContent');
    const userNameInput = document.getElementById('userNameInput');
    const saveNameBtn = document.getElementById('saveNameBtn');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';

    // Create typing dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingIndicator.appendChild(dot);
    }

    // Check user state
    const userName = localStorage.getItem('userName');
    const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';

    // Only show modal if user hasn't completed onboarding AND doesn't have a name set
    // Also prevent showing if we're coming from the greeting
    const isFirstOpen = !localStorage.getItem('appOpenedBefore');
    if (!onboardingComplete && !userName && !isFirstOpen) {
        // Hide everything initially
        welcomeContent.style.display = 'none';
        welcomeModal.style.display = 'flex';

        // Show typing indicator first
        welcomeModal.appendChild(typingIndicator);

        // Simulate typing effect
        setTimeout(() => {
            // Remove typing indicator
            welcomeModal.removeChild(typingIndicator);

            // Show welcome content with animation
            welcomeContent.style.display = 'block';

            // Focus on input after animation
            setTimeout(() => {
                userNameInput.focus();
            }, 1000);
        }, 1500); // Show typing indicator for 1.5 seconds
    }

    // Save the user's name with animation
    function saveUserName() {
        const name = userNameInput.value.trim();
        if (name) {
            // Show typing indicator while saving
            welcomeContent.style.opacity = '0.5';
            welcomeContent.style.pointerEvents = 'none';
            welcomeModal.appendChild(typingIndicator);

            // Simulate saving with a delay
            setTimeout(() => {
                try {
                    // Save all user data in a single transaction
                    localStorage.setItem('userName', name);

                    // Update profile in localStorage
                    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    profile.name = name;
                    localStorage.setItem('userProfile', JSON.stringify(profile));

                    // Mark onboarding as complete
                    localStorage.setItem('onboardingComplete', 'true');
                } catch (e) {
                    console.error('Error saving user data:', e);
                    return; // Don't proceed if we can't save the data
                }

                // Fade out the welcome modal
                welcomeModal.style.opacity = '0';
                welcomeModal.style.transition = 'opacity 0.5s ease-out';

                // Remove the modal after fade out
                setTimeout(() => {
                    welcomeModal.style.display = 'none';
                    welcomeModal.remove(); // Remove from DOM completely

                    // Update profile name in the UI
                    updateProfileName(name);

                    // Mark that onboarding is complete and app has been opened
                    localStorage.setItem('appOpenedBefore', 'true');
                    
                    // Always redirect to index.html#home
                    if (window.location.pathname.endsWith('index.html') || 
                        window.location.pathname.endsWith('/') || 
                        window.location.pathname === '') {
                        // If already on index.html, just update the hash and reload
                        window.location.hash = 'home';
                        window.location.reload();
                    } else {
                        // Otherwise navigate to index.html#home
                        window.location.href = 'index.html#home';
                    }
                }, 500);
            }, 1000);
        } else {
            // Add shake animation to input if empty
            userNameInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                userNameInput.style.animation = '';
                userNameInput.focus();
            }, 500);
        }
    }

    // Update profile name in the UI
    function updateProfileName(name) {
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            profileName.textContent = name;
        }
    }

    // Event listeners
    saveNameBtn.addEventListener('click', saveUserName);

    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveUserName();
        }
    });

    // Ensure modal is properly shown or hidden based on state
    if (welcomeModal) {
        if (!onboardingComplete && !userName) {
            welcomeModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else if (welcomeModal.parentNode) {
            welcomeModal.remove();
        }
    }
});
