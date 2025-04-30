const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");
const faqsContainer = document.getElementById("faq-container");

let recognition;

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject("Error al obtener ubicación: " + error.message);
      }
    );
  });
}

function filtrarEmojis(texto) {
  const regexEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu;
  return texto.replace(regexEmoji, '');
}

function addMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender);
  messageElement.innerHTML = `<strong>${sender === "user" ? "You" : "EVA"}:</strong> ${message}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendToBot(message) {
  addMessage("user", message);
  userInput.value = "";
  typingIndicator.style.display = "block";

  const coords = await getBrowserLocation();

  const jsonResponse = JSON.stringify({ "message": message, "latitud": coords.lat, "longitud": coords.lng });

  try {
    const res = await fetch("http://127.0.0.1:5050/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonResponse,
    });

    const data = await res.json();
    typingIndicator.style.display = "none";

    let msj, voice;
    if (typeof data.response === "object" && data.response.message) {
      msj = data.response.message;
      voice = data.response.voice;
    } else {
      msj = data.response;
      voice = data.response;
    }

    console.log(data.response);
    console.log(msj);
    addMessage("eva", msj);

    if (recognition) {
      recognition.abort();
    }

    const cleanVoice = filtrarEmojis(voice);

    const utterance = new SpeechSynthesisUtterance(cleanVoice);
    utterance.lang = "en-US";
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("zira"));
    utterance.voice = femaleVoice || voices[0];
    speechSynthesis.speak(utterance);

    utterance.onend = () => {
      if (recognition) {
        recognition.start();
      }
    };

  } catch (err) {
    typingIndicator.style.display = "none";
    addMessage("eva", "⚠️ Sorry, something went wrong.");
    console.error(err);
  }
}

sendBtn.addEventListener("click", () => {
  const msg = userInput.value.trim();
  if (msg) sendToBot(msg);
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const msg = userInput.value.trim();
    if (msg) sendToBot(msg);
  }
});

voiceBtn.addEventListener("click", () => {
  startRecognition();
});

// 🔥 Aquí la corrección: escribe en el input cuando detecta voz
function startWakeWordListener() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("🎙️ Detected:", transcript);
    if (transcript.includes("eva")) {
      const wakeMsg = transcript.replace("eva", "").trim();
      if (wakeMsg) {
        userInput.value = wakeMsg;  // 🔥 Ahora también se escribe
        sendToBot(wakeMsg);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
    setTimeout(startWakeWordListener, 1000);
  };

  recognition.onend = () => {
    setTimeout(startWakeWordListener, 1000);
  };

  recognition.start();
}
startWakeWordListener();

const buttons = [
  { id: "battery-btn", text: "What is my current battery level?" },
  { id: "grants-btn", text: "What EV grants are available?" },
  { id: "stations-btn", text: "Where are the nearest EV charging stations?" },
  { id: "guides-btn", text: "guides" },
];

buttons.forEach(({ id, text }) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener("click", () => {
      if (id === "guides-btn") {
        faqsContainer.style.display = faqsContainer.style.display === "block" ? "none" : "block";
      } else {
        sendToBot(text);
      }
    });
  }
});

const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach(item => {
  const answer = item.querySelector(".faq-answer");
  answer.style.display = "none";
  item.addEventListener("click", () => {
    answer.style.display = answer.style.display === "none" ? "block" : "none";
  });
});
voiceBtn.addEventListener("click", () => {
  startRecognition();
});
function startRecognition() {
  if (!recognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript.trim();
      console.log("🎤 You said:", transcript);
      userInput.value = transcript;
      sendToBot(transcript);
    };

    recognition.onerror = function (event) {
      console.error("Voice button error:", event.error);
    };
  }

  // Detenemos la escucha continua temporalmente
  recognition.abort();

  // Reiniciamos para usar el botón
  recognition.start();
}
// startWakeWordListener();
const openBtn = document.getElementById("open-chat-btn");
const chatContainer = document.getElementById("chat-container");
const faqContainer = document.getElementById("faq-container");
;