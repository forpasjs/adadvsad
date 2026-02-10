// Telegram Bot Configuration
// WARNING: Exposing your bot token in client-side JavaScript is insecure.
// Anyone can view the source code and use your token to control your bot.
const BOT_TOKEN = '8349358858:AAEC666hqcvSi3p2TN01cpB_SSxm-raBAWs';
const CHAT_ID = '1456865327';

let lastRightClickTime = 0;
let lastLeftClickTime = 0;
let floatingTextElement = null;
let isFloatingTextVisible = false;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastUpdateId = 0; // For polling updates

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Feature 1: Send HTML on load
    sendCurrentPageHTML();

    // Feature 3: Create draggable floating element
    createFloatingElement();

    // Setup mouse gestures
    setupMouseListeners();

    console.log("Script initialized. Manual update checks only.");
});

// --- Feature 1: HTML Capture & Send ---
async function sendCurrentPageHTML() {
    console.log("Capturing HTML...");
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', blob, 'index.html');
    formData.append('caption', 'Web sahifa HTML kodi (index.html)');

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.ok) {
            console.log("HTML file sent successfully.");
        } else {
            console.error(`Failed to send HTML: ${result.description}`);
        }
    } catch (error) {
        console.error(`Error sending HTML: ${error.message}`);
    }
}

// --- Feature 3: Draggable Floating Text ---
function createFloatingElement() {
    floatingTextElement = document.createElement('div');
    floatingTextElement.innerText = "Suzib Yuruvchi Matn"; // Floating Text
    floatingTextElement.style.position = 'fixed';
    floatingTextElement.style.top = '50%';
    floatingTextElement.style.left = '50%';
    floatingTextElement.style.transform = 'translate(-50%, -50%)'; // Only for initial centering
    floatingTextElement.style.color = 'rgba(0, 0, 0, 0.05)'; // Very subtle black
    floatingTextElement.style.fontSize = '24px';
    floatingTextElement.style.fontWeight = 'bold';
    floatingTextElement.style.fontFamily = 'Arial, sans-serif';
    floatingTextElement.style.zIndex = '9999';
    floatingTextElement.style.display = 'none'; // Hidden by default
    floatingTextElement.style.cursor = 'move'; // Indicate draggable
    floatingTextElement.style.userSelect = 'none'; // Prevent text selection while dragging
    floatingTextElement.style.padding = '10px';
    floatingTextElement.style.backgroundColor = 'transparent'; // No background
    floatingTextElement.style.borderRadius = '5px';

    // Drag Logic
    floatingTextElement.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    document.body.appendChild(floatingTextElement);
}

function startDrag(e) {
    if (e.target !== floatingTextElement) return; // Only drag if clicking the text itself
    isDragging = true;
    const rect = floatingTextElement.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    // Remove transform to rely on top/left absolute positioning
    floatingTextElement.style.transform = 'none';
    floatingTextElement.style.left = rect.left + 'px';
    floatingTextElement.style.top = rect.top + 'px';
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    floatingTextElement.style.left = `${x}px`;
    floatingTextElement.style.top = `${y}px`;
}

function stopDrag() {
    isDragging = false;
}

function setupMouseListeners() {
    document.addEventListener('mousedown', (event) => {
        const currentTime = new Date().getTime();

        if (event.button === 0) { // Left Click
            // Check for Double Left Click (within 500ms)
            if (currentTime - lastLeftClickTime < 500) {
                console.log("Double Left Click Detected!");
                toggleFloatingText();
                checkForUpdates(); // Manual check logic here
                lastLeftClickTime = 0;
                return;
            }
            lastLeftClickTime = currentTime;
        } else if (event.button === 2) { // Right Click
            // Check for Double Right Click (within 500ms)
            if (currentTime - lastRightClickTime < 500) {
                console.log("Double Right Click Detected!");
                sendTelegramMessage("javob tayyormi?");
                lastRightClickTime = 0;
                return;
            }
            lastRightClickTime = currentTime;
        }
    });
}

function toggleFloatingText() {
    isFloatingTextVisible = !isFloatingTextVisible;
    if (floatingTextElement) {
        floatingTextElement.style.display = isFloatingTextVisible ? 'block' : 'none';
        console.log(`Floating Text: ${isFloatingTextVisible ? 'Visible' : 'Hidden'}`);
    }
}

async function sendTelegramMessage(text) {
    // Send message with an Inline Keyboard Button for the answer
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const data = {
        chat_id: CHAT_ID,
        text: text,
        reply_markup: {
            inline_keyboard: [[
                { text: "Javob (Answer)", callback_data: "answer_ready" }
            ]]
        }
    };

    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log("Message sent to Telegram: " + text);

        // Check shortly after sending to catch quick responses
        setTimeout(checkForUpdates, 1000);
        setTimeout(checkForUpdates, 4000);
    } catch (error) {
        console.error(`Send Error: ${error.message}`);
    }
}

// --- Feature 2: Manual Check for Answers ---
async function checkForUpdates() {
    console.log("Checking for updates (Manual)...");
    try {
        const allowedUpdates = JSON.stringify(["callback_query", "message"]);
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&allowed_updates=${encodeURIComponent(allowedUpdates)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            data.result.forEach(update => {
                lastUpdateId = update.update_id;
                let answerText = "";

                // Check for Callback Query (Button Click)
                if (update.callback_query) {
                    const cb = update.callback_query;
                    console.log(`Button click from ID: ${cb.from.id}`);

                    if (cb.data === "answer_ready") {
                        answerText = "Javob tayyor!";
                    }
                }

                // Check for text messages
                if (update.message) {
                    console.log(`Message from ID: ${update.message.chat.id}`);
                    if (update.message.text) {
                        // Accept text message as answer
                        answerText = update.message.text;
                    }
                }

                if (answerText) {
                    console.log("Answer received: " + answerText);
                    showAnswerInFloatingText(answerText);
                }
            });
        }
    } catch (error) {
        console.error(`Check Error: ${error.message}`);
    }
}

function showAnswerInFloatingText(text) {
    if (floatingTextElement) {
        floatingTextElement.innerText = text;
        floatingTextElement.style.display = 'block';
        // Subtle visible style
        floatingTextElement.style.color = 'rgba(0, 0, 0, 0.1)';
        floatingTextElement.style.backgroundColor = 'transparent';
        isFloatingTextVisible = true;
    }
}
