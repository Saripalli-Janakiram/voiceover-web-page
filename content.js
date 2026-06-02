console.log("VoiceOver Web Page: content script loaded");

let utterance = null;
let isPaused = false;

// Ensure voices load
speechSynthesis.onvoiceschanged = () => {};

function getMainText() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  let text = "";
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (t.length > 0) text += t + " ";
  }
  return text.trim();
}

function speakText(options) {
  const selected = window.getSelection().toString().trim();
  const text = selected || getMainText();

  if (!text) return;

  if (utterance) speechSynthesis.cancel();

  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;

  if (options.voiceName) {
    const voice = speechSynthesis.getVoices().find(v => v.name === options.voiceName);
    if (voice) utterance.voice = voice;
  }

  speechSynthesis.speak(utterance);
  isPaused = false;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "READ") {
    speakText(msg.options);
  }

  if (msg.type === "PAUSE") speechSynthesis.pause();
  if (msg.type === "RESUME") speechSynthesis.resume();
  if (msg.type === "STOP") speechSynthesis.cancel();

  if (msg.type === "GET_VOICES") {
    const voices = speechSynthesis.getVoices();
    sendResponse({ voices });
    return true;
  }
});
