const voiceSelect = document.getElementById("voiceSelect");
const rateInput = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");
const readBtn = document.getElementById("readBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const stopBtn = document.getElementById("stopBtn");

function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      callback(tabs[0]);
    }
  });
}

function sendToContent(type, extra = {}) {
  getActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type, ...extra }, (res) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        console.warn("VoiceOver Web Page: message error", lastError.message);
      }
    });
  });
}

function loadVoices() {
  getActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_VOICES" }, (res) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        console.warn("VoiceOver Web Page: GET_VOICES error", lastError.message);
        return;
      }
      if (!res || !res.voices) return;

      voiceSelect.innerHTML = "";
      res.voices.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        voiceSelect.appendChild(opt);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadVoices();

  readBtn.onclick = () => {
    const options = {
      rate: parseFloat(rateInput.value),
      pitch: parseFloat(pitchInput.value),
      voiceName: voiceSelect.value || null
    };
    sendToContent("READ_PAGE", { options });
  };

  pauseBtn.onclick = () => sendToContent("PAUSE");
  resumeBtn.onclick = () => sendToContent("RESUME");
  stopBtn.onclick = () => sendToContent("STOP");
});
