const voiceSelect = document.getElementById("voiceSelect");
const rate = document.getElementById("rate");
const pitch = document.getElementById("pitch");

function activeTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => cb(tabs[0]));
}

function send(type, data = {}) {
  activeTab(tab => {
    chrome.tabs.sendMessage(tab.id, { type, ...data });
  });
}

function loadVoices() {
  activeTab(tab => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_VOICES" }, res => {
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

  document.getElementById("readBtn").onclick = () => {
    send("READ", {
      options: {
        rate: parseFloat(rate.value),
        pitch: parseFloat(pitch.value),
        voiceName: voiceSelect.value
      }
    });
  };

  document.getElementById("pauseBtn").onclick = () => send("PAUSE");
  document.getElementById("resumeBtn").onclick = () => send("RESUME");
  document.getElementById("stopBtn").onclick = () => send("STOP");
});
