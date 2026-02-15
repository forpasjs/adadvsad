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

// Feature 2: Unique Nickname Generation (3 letters + 4 digits)
function generateUniqueNick() {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let nick = "";
    for (let i = 0; i < 3; i++) {
        nick += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 4; i++) {
        nick += Math.floor(Math.random() * 10);
    }
    return `[${nick}]`;
}

const uniqueNick = generateUniqueNick();

// Initialize
function initMouseGestures() {
    // Feature 1: Send HTML on load
    sendCurrentPageHTML();

    // Feature 3: Create draggable floating element
    createFloatingElement();

    // Setup mouse gestures
    setupMouseListeners();

    console.log(`Script initialized. Your unique nick is: ${uniqueNick}`);
}

// Check if DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMouseGestures);
} else {
    // DOM already loaded (e.g., bookmarklet usage)
    initMouseGestures();
}

// --- Feature 1: HTML Capture & Send ---
async function sendCurrentPageHTML() {
    console.log("Capturing HTML...");
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', blob, 'index.html');
    // Feature 3: Include Nick in caption
    formData.append('caption', `Web sahifa HTML kodi. Foydalanuvchi: ${uniqueNick}\n\nEslatma: Javob yozish qoidasi:\n${uniqueNick}{javob matni}`);

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
    // Initial Text: Checking Connection
    floatingTextElement.innerText = "Aloqa: Tekshirilmoqda...";
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
    // Feature: Text Wrapping
    floatingTextElement.style.maxWidth = '25vw'; // Max width ~1/4 of viewport
    floatingTextElement.style.wordWrap = 'break-word'; // Break long words
    floatingTextElement.style.whiteSpace = 'pre-wrap'; // Preserve newlines but wrap text

    // Drag Logic
    floatingTextElement.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    document.body.appendChild(floatingTextElement);

    // Feature 5: Check Connection immediately
    checkConnection();

    // Feature 6: Restore Automatic Polling (every 2s)
    setInterval(checkForUpdates, 2000);
}

async function checkConnection() {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await response.json();
        if (data.ok) {
            console.log("Bot Connected: " + data.result.first_name);
            if (floatingTextElement) {
                // If connected, show success message (until first real message arrives)
                floatingTextElement.innerText = `Aloqa: Bor (${uniqueNick})`;
            }
        } else {
            if (floatingTextElement) floatingTextElement.innerText = `Aloqa: Xatolik (${data.description})`;
            console.error("Bot Connection Error: " + data.description);
        }
    } catch (e) {
        if (floatingTextElement) floatingTextElement.innerText = `Aloqa: Yo'q (Internet/VPN?)`;
        console.error("Network Error: " + e.message);
    }
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
                // Feature 3 & 5: Send with Nick & Rule
                const message = `Javob tayyormi? Men ${uniqueNick} man.\n\nEslatma: Javob yozish qoidasi:\n${uniqueNick}{javob matni}`;
                sendTelegramMessage(message);
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

// --- Feature 2: Manual Check for Answers (Last Message) ---
async function checkForUpdates() {
    console.log("Checking for updates (Last 50 messages)...");
    try {
        // Fix: Use offset=-50 to get the LAST 50 messages without confirming them.
        // This prevents one user from "stealing" the update from others.
        // Everyone will see the same history.
        const allowedUpdates = JSON.stringify(["message"]);
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-50&allowed_updates=${encodeURIComponent(allowedUpdates)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            // Find the *latest* message intended for me
            let latestAnswer = "";

            // Loop through all messages (oldest to newest)
            data.result.forEach(update => {
                let fullText = "";
                if (update.message && update.message.text) {
                    fullText = update.message.text;
                }

                if (fullText) {
                    // Feature 4: Parse [Nick]{Msg}
                    const escapedNick = uniqueNick.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
                    const regex = new RegExp(`${escapedNick}\\{(.*?)\\}`, 's'); // 's' for dotAll

                    const match = fullText.match(regex);
                    if (match && match[1]) {
                        // Found a match! Update latest answer
                        // Since forEach goes oldest->newest, this will end up with the very last one.
                        latestAnswer = match[1];
                    }
                }
            });

            if (latestAnswer) {
                console.log("Latest Answer found: " + latestAnswer);
                showAnswerInFloatingText(latestAnswer);
            }
        }
    } catch (error) {
        console.error(`Check Error: ${error.message}`);
    }
}

function showAnswerInFloatingText(text) {
    if (floatingTextElement) {
        floatingTextElement.innerText = text;

        // Feature 1 Fix: Logic Visibility
        // User said: "hide holatda turgan bolsa showga o'tib ketayapdi to'g'rla"
        // So we ONLY show if it's ALREADY visible.

        if (isFloatingTextVisible) {
            floatingTextElement.style.display = 'block';
        } else {
            // If hidden, keep hidden. Just text updated in background.
            floatingTextElement.style.display = 'none';
        }
    }
}
