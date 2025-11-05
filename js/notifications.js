// Daily Verse Notification System

// Request notification permission on page load
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Show daily verse notification
function showDailyVerseNotification(verseData) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('📖 Daily Verse', {
            body: `${verseData.reference}\n\n"${verseData.text.substring(0, 100)}..."`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'daily-verse',
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: {
                url: window.location.origin,
                reference: verseData.reference
            }
        });

        notification.onclick = function() {
            window.focus();
            this.close();
        };

        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);
    }
}

// Check if we should show notification today
function shouldShowNotification() {
    const lastNotification = localStorage.getItem('lastDailyVerseNotification');
    const today = new Date().toDateString();
    
    return lastNotification !== today;
}

// Mark notification as shown for today
function markNotificationShown() {
    const today = new Date().toDateString();
    localStorage.setItem('lastDailyVerseNotification', today);
}

// Schedule daily notification (9 AM)
function scheduleDailyNotification() {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0);

    // If it's past 9 AM today, schedule for tomorrow
    if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime - now;

    setTimeout(() => {
        if (shouldShowNotification()) {
            // Fetch verse data from daily verse iframe or localStorage
            const verseData = getDailyVerseData();
            if (verseData) {
                showDailyVerseNotification(verseData);
                markNotificationShown();
            }
        }
        // Reschedule for next day
        setTimeout(() => scheduleDailyNotification(), 86400000); // 24 hours
    }, timeUntilNotification);
}

// Get daily verse data
function getDailyVerseData() {
    // Try to get from localStorage or default
    try {
        const saved = localStorage.getItem('currentDailyVerse');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error getting daily verse:', e);
    }
    
    // Default verse
    return {
        reference: '1 Peter 4:1',
        text: 'Therefore, since Christ suffered in his body, arm yourselves also with the same attitude...'
    };
}

// Initialize notifications
async function initializeNotifications() {
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
        // Show notification immediately on first visit if not shown today
        if (shouldShowNotification()) {
            const verseData = getDailyVerseData();
            if (verseData) {
                // Delay initial notification by 3 seconds
                setTimeout(() => {
                    showDailyVerseNotification(verseData);
                    markNotificationShown();
                }, 3000);
            }
        }
        
        // Schedule future notifications
        scheduleDailyNotification();
    }
}

// Export functions
window.BibleNotifications = {
    init: initializeNotifications,
    requestPermission: requestNotificationPermission,
    showNotification: showDailyVerseNotification
};
