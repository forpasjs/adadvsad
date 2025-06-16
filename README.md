(async () => {
  // WebSocket manziling (o'zingng Flask yoki Node server manzilini kiriting)
  const SERVER_URL = 'ws://localhost:5000'; // <-- bu yerga o‘zingning WebSocket manzilingni yoz

  const messageDiv = document.createElement('div');
  messageDiv.id = 'external-message-display';
  Object.assign(messageDiv.style, {
    position: 'fixed',
    bottom: '0px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    fontSize: '12px',
    padding: '4px',
    zIndex: '999999999',
    pointerEvents: 'none',
  });
  document.body.appendChild(messageDiv);

  const socket = new WebSocket(SERVER_URL);

  socket.onmessage = function (event) {
    messageDiv.innerText = event.data;
  };

  async function captureScreenAndSend() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        setInterval(() => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = canvas.toDataURL('image/jpeg', 0.5);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(image);
          }
        }, 1000);
      });
    } catch (err) {
      console.error('Ekranni olishda xatolik:', err);
    }
  }

  captureScreenAndSend();
})();
