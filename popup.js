const voiceSelect = document.getElementById("voiceSelect");
const rate = document.getElementById("rate");
const pitch = document.getElementById("pitch");

function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => cb(tabs[0]));
}

function extractText(callback) {
  getActiveTab(tab => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          const sel = window.getSelection().toString().trim();
          if (sel) return sel;

          return document.body.innerText || "";
        }
      },
      results => {
        if (results && results[0]) callback(results[0].result);
        else callback("");
      }
    );
  });
}

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });
}

speechSynthesis.onvoiceschanged = loadVoices;

document.addEventListener("DOMContentLoaded", () => {
  loadVoices();

  document.getElementById("readBtn").onclick = () => {
    extractText(text => {
      if (!text) return;

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = parseFloat(rate.value);
      utter.pitch = parseFloat(pitch.value);

      const voice = speechSynthesis.getVoices().find(v => v.name === voiceSelect.value);
      if (voice) utter.voice = voice;

      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    });
  };

  document.getElementById("pauseBtn").onclick = () => speechSynthesis.pause();
  document.getElementById("resumeBtn").onclick = () => speechSynthesis.resume();
  document.getElementById("stopBtn").onclick = () => speechSynthesis.cancel();
});
