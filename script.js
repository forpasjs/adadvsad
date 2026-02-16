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

    // Feature 6: Continuous Polling State
    // No complicated state needed, just an interval ID
    let pollingInterval = null;

    // Feature 7: Global Message State
    let currentGlobalIndex = 1;
    let globalMessageContent = "";

    // Feature 5: Check Connection immediately
    checkConnection();

    // Feature 6: Continuous Polling (every 5s)
    console.log("Starting Continuous Polling (5s)...");
    setInterval(checkForUpdates, 5000);
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

// Helper: Start Polling (Kept for compatibility if called, but irrelevant)
function startPolling() {
    // No-op or manual check triggered by clicks
    checkForUpdates();
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
    let rightClickCount = 0;
    let rightClickTimer = null;

    document.addEventListener('mousedown', (event) => {
        const currentTime = new Date().getTime();

        if (event.button === 0) { // Left Click
            // Check for Double Left Click (within 500ms)
            if (currentTime - lastLeftClickTime < 500) {
                console.log("Double Left Click Detected!");
                toggleFloatingText();
                startPolling(); // Trigger Polling
                lastLeftClickTime = 0;
                return;
            }
            lastLeftClickTime = currentTime;
        } else if (event.button === 2) { // Right Click
            rightClickCount++;

            if (rightClickTimer) clearTimeout(rightClickTimer);

            rightClickTimer = setTimeout(() => {
                if (rightClickCount === 2) {
                    console.log("Double Right Click Detected! (Quick Replies)");
                    // Send 4 Quick Reply Buttons
                    sendQuickReplyOptions();
                    startPolling();
                } else if (rightClickCount === 3) {
                    console.log("Triple Right Click Detected! (Global Ack)");
                    // Acknowledge Global Message
                    handleGlobalAck();
                    toggleGlobalMessageVisibility();
                    startPolling();
                }
                rightClickCount = 0;
            }, 400); // Wait 400ms for clicks
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

// Hide/Show ONLY the Global Message part (locally)
function toggleGlobalMessageVisibility() {
    // Logiz: If we triple click, we "read" it, so we might want to hide it
    // But user asked to "Hide until next [all] comes OR triple click again".
    // For simplicity, let's just clear the visual global content until next update.
    console.log("Toggling Global Msg Visibility / Ack");

    // Logic: 
    // 1. Send Ack to Bot "allN o'qidim"
    // 2. Clear current global content from screen
    // 3. Increment index to look for next one
}

async function handleGlobalAck() {
    const msg = `all${currentGlobalIndex} o'qidim`;
    await sendTelegramMessageSimple(msg);

    // Clear current global content visual
    globalMessageContent = "";
    updateFloatingTextDisplay();

    // Move to next index
    currentGlobalIndex++;
    console.log(`Global Index Incremented to: ${currentGlobalIndex}`);
}


async function sendQuickReplyOptions() {
    const text = `Javob tayyormi? Men ${uniqueNick} man.\n\nEslatma: Javob yozish qoidasi:\n${uniqueNick}{javob matni}`;

    // 4 Quick Reply Buttons
    const buttons = [
        [{ text: "Yo'q hali", callback_data: `${uniqueNick}{yo'q hali}` }],
        [{ text: "Sabr qiling", callback_data: `${uniqueNick}{Sabr qiling}` }],
        [{ text: "10 daqiqa", callback_data: `${uniqueNick}{10 daqiqa}` }],
        [{ text: "5 daqiqa", callback_data: `${uniqueNick}{5 daqiqa}` }]
    ];

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const data = {
        chat_id: CHAT_ID,
        text: text,
        reply_markup: { inline_keyboard: buttons }
    };

    try {
        await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        console.log("Quick Reply Options sent.");
    } catch (error) {
        console.error(`Send Error: ${error.message}`);
    }
}

async function sendTelegramMessageSimple(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const data = { chat_id: CHAT_ID, text: text };
    try {
        await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } catch (e) {
        console.error(e);
    }
}

// Local variable to store the User's private answer
let myPrivateAnswer = "";

// --- Feature 2: Manual Check for Answers (Last Message) ---
async function checkForUpdates() {
    console.log("Checking for updates...");
    try {
        // Fix: Use offset=-50 to get the LAST 50 messages
        const allowedUpdates = JSON.stringify(["message", "callback_query"]);
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-50&allowed_updates=${encodeURIComponent(allowedUpdates)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            data.result.forEach(update => {
                let fullText = "";

                // Check Callback Query (Button Clicks by Admin?)
                // NOTE: Usually Admin clicks button, Bot receives callback. 
                // If Bot ECHOES it as a message, we see it here.
                // Or if Admin types manually.

                if (update.message && update.message.text) {
                    fullText = update.message.text;
                } else if (update.callback_query && update.callback_query.data) {
                    // Start parsing callbacks if we can see them (unlikely in basic bot API without server echoing)
                    // But assume Admin messages dictate the answers.
                    fullText = update.callback_query.data;
                }

                if (fullText) {
                    // Start of Simplified Logic: Show ANY latest message
                    // We treat every message as a "private answer" for display purposes
                    myPrivateAnswer = fullText;

                    // Optional: Still support Global Message if needed? 
                    // User said "eng oxirgi osha xabarni ko'rsatsin" (show the very last message).
                    // So we just overwrite everything with the latest text.
                    // But maybe we should still check for [allN] to handle that specific feature?
                    // User said "id tizimini olib tashla" (remove ID system).
                    // Let's assume Global Message logic is distinct and might still be useful, 
                    // BUT the main display area now shows EVERYTHING.

                    // Actually, if we show everything, a [allN] message will also be shown as "myPrivateAnswer".
                    // So we don't need special parsing for it unless we want to hide it from the main view?
                    // Let's keep it simple: Show existing text.

                    console.log("New Message Found: " + fullText);
                }
            });

            // Update UI
            updateFloatingTextDisplay();
        }
    } catch (error) {
        console.error(`Check Error: ${error.message}`);
    }
}

function updateFloatingTextDisplay() {
    if (floatingTextElement) {
        let finalHtml = "";

        // Private Message Part
        if (myPrivateAnswer) {
            finalHtml += `${myPrivateAnswer}`;
        } else if (!myPrivateAnswer && floatingTextElement.innerText.includes("Aloqa")) {
            // Keep connection status if no message yet
            finalHtml = floatingTextElement.innerText;
        } else {
            finalHtml = "Kutilmoqda...";
        }

        // Global Message Part (2 lines below)
        if (globalMessageContent) {
            finalHtml += `\n\n----------------\n${globalMessageContent}`;
        } else {
            // If "all" message is hidden/read, it's empty string, so checks valid
        }

        floatingTextElement.innerText = finalHtml;

        // Visibility Check
        if (isFloatingTextVisible) {
            floatingTextElement.style.display = 'block';
        } else {
            floatingTextElement.style.display = 'none';
        }
    }
}
