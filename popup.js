const voiceSelect = document.getElementById("voiceSelect");
const rateInput = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");

function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    cb(tabs[0]);
  });
}

function sendToContent(type, extra = {}) {
  getActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type, ...extra });
  });
}

function loadVoices() {
  getActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_VOICES" }, (res) => {
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

document.getElementById("readBtn").onclick = () => {
  const options = {
    rate: parseFloat(rateInput.value),
    pitch: parseFloat(pitchInput.value),
    voiceName: voiceSelect.value || null
  };
  sendToContent("READ_PAGE", { options });
};

document.getElementById("pauseBtn").onclick = () => sendToContent("PAUSE");
document.getElementById("resumeBtn").onclick = () => sendToContent("RESUME");
document.getElementById("stopBtn").onclick = () => sendToContent("STOP");

document.addEventListener("DOMContentLoaded", () => {
  loadVoices();
});
