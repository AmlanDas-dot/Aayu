/**
 * Text-to-Speech helper using the browser Web Speech API.
 * Works fully offline — no server call needed.
 */

export function speak(text: string, lang: string = "en-IN"): void {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  // Strip markdown symbols before speaking
  const clean = text
    .replace(/[*_#`>~[\]]/g, "")
    .replace(/\n+/g, ". ")
    .trim();

  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = lang;
  utt.rate = 0.9;
  utt.pitch = 1.0;

  // Pick the best available voice for the language
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split("-")[0];
  const match = voices.find((v) => v.lang.startsWith(langPrefix));
  if (match) utt.voice = match;

  window.speechSynthesis.speak(utt);
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return "speechSynthesis" in window && window.speechSynthesis.speaking;
}
