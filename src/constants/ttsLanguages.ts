import type { LanguageCode } from "./languages";

/**
 * BCP-47 language tags used for SpeechSynthesisUtterance.lang.
 *
 * We prefer the India locale variants so that voices available on Indian
 * Android/Chrome installs are preferred by the browser's voice selection.
 *
 * Future IndicTrans2 note:
 *   When IndicTrans2 is wired in, the TTS layer will always receive text
 *   already in the user's chosen language, so this map remains correct.
 */
export const TTS_LANG_MAP: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  gu: "gu-IN",
  or: "or-IN",
};
