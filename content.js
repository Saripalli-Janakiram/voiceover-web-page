let utterance = null;
let isPaused = false;

function getMainText() {
  // Simple version: read visible text from body
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
  const text = window.getSelection().toString().trim() || getMainText();
  if (!text) return;

  if (utterance) {
    window.speechSynthesis.cancel();
  }

  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  if (options.voiceName) {
    const voice = speechSynthesis
      .getVoices()
      .find(v => v.name === options.voiceName);
    if (voice) utterance.voice = voice;
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
    const voices = speechSynthesis.getVoices().map(v => ({
      name: v.name,
      lang: v.lang
    }));
    sendResponse({ voices });
    return true;
  }
});
