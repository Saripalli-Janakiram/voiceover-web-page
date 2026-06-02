console.log("VoiceOver Web Page: content script loaded");

let utterance = null;
let isPaused = false;

// Force voices to initialize in Chrome
speechSynthesis.onvoiceschanged = speechSynthesis.onvoiceschanged || (() => {});

function getMainText() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const style = window.getComputedStyle(node.parentElement);
        if (style.visibility === "hidden" || style.display === "none") {
          return NodeFilter.FILTER_REJECT;
        }
        const text = node.textContent.trim();
        return text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let text = "";
  let node;
  while ((node = walker.nextNode())) {
    text += node.textContent + " ";
  }
  return text.trim();
}

function speakFullPage(options) {
  const selection = window.getSelection().toString().trim();
  const text = selection || getMainText();
  if (!text) {
    console.warn("VoiceOver Web Page: No text found to read.");
    return;
  }

  if (utterance) {
    window.speechSynthesis.cancel();
  }

  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;

  if (options.voiceName) {
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === options.voiceName);
    if (voice) {
      utterance.voice = voice;
    }
  }

  window.speechSynthesis.speak(utterance);
  isPaused = false;
}

function pauseSpeech() {
  if (!utterance) return;
  if (!isPaused) {
    window.speechSynthesis.pause();
    isPaused = true;
  }
}

function resumeSpeech() {
  if (!utterance) return;
  if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
  }
}

function stopSpeech() {
  if (!utterance) return;
  window.speechSynthesis.cancel();
  utterance = null;
  isPaused = false;
}

function getVoicesAsync(sendResponse) {
  let voices = speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    sendResponse({
      voices: voices.map(v => ({ name: v.name, lang: v.lang }))
    });
    return;
  }

  const handler = () => {
    voices = speechSynthesis.getVoices();
    sendResponse({
      voices: voices.map(v => ({ name: v.name, lang: v.lang }))
    });
    speechSynthesis.removeEventListener("voiceschanged", handler);
  };

  speechSynthesis.addEventListener("voiceschanged", handler);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "READ_PAGE") {
    speakFullPage(msg.options || {});
  } else if (msg.type === "PAUSE") {
    pauseSpeech();
  } else if (msg.type === "RESUME") {
    resumeSpeech();
  } else if (msg.type === "STOP") {
    stopSpeech();
  } else if (msg.type === "GET_VOICES") {
    getVoicesAsync(sendResponse);
    return true; // keep channel open for async response
  }
});
