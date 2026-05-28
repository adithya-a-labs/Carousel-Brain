const INSTAGRAM_UI_NOISE = [
  /^liked by\b/i,
  /^view all \d+ comments/i,
  /^add a comment/i,
  /^see translation/i,
  /^follow\b/i,
  /^sponsored\b/i,
  /^more$/i,
  /^original audio$/i,
  /^send message$/i,
];

export function cleanOcrText(text: string) {
  return applyCommonCorrections(removeUiNoise(text));
}

export function cleanSlideTexts(slideTexts: Array<{ slideIndex: number; text: string }>) {
  return slideTexts
    .map((slide) => ({
      slideIndex: slide.slideIndex,
      text: cleanOcrText(slide.text),
    }))
    .filter((slide) => slide.text.trim());
}

function removeUiNoise(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !INSTAGRAM_UI_NOISE.some((pattern) => pattern.test(line)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function applyCommonCorrections(text: string) {
  return text
    .replace(/\bAl\b/g, "AI")
    .replace(/\bOpenAl\b/g, "OpenAI")
    .replace(/\bGithub\b/g, "GitHub")
    .replace(/\bC[\u00fc\u00fcu]rs0r\b/gi, "Cursor")
    .replace(/\bC[\u00fc\u00fcu]rsor\b/gi, "Cursor")
    .replace(/\bClaud\u00e9\b/g, "Claude")
    .replace(/\bClaude\s*Code\b/gi, "Claude Code")
    .replace(/([a-z0-9.-]+)\s*\/\s*([a-z0-9._/-]+)/gi, "$1/$2")
    .replace(/([a-z0-9-])\s*\.\s*([a-z]{2,})(\/[^\s]*)?/gi, "$1.$2$3")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
