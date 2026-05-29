const INSTAGRAM_UI_NOISE = [
  /^liked by\b/i,
  /^view all \d+ comments/i,
  /^add a comment/i,
  /^see translation/i,
  /^follow\b/i,
  /^following\b/i,
  /^sponsored\b/i,
  /^more$/i,
  /^original audio$/i,
  /^send message$/i,
  /^share$/i,
  /^save$/i,
  /^reply$/i,
  /^\d+\s+(likes?|comments?|shares?|followers?|following|posts?)$/i,
  /^\d+(?:[.,]\d+)?[kKmM]?\s+(likes?|comments?|shares?|followers?|following|posts?)$/i,
];

export function cleanOcrText(text: string) {
  return applyCommonCorrections(joinBrokenUrls(removeUiNoise(text)));
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
    .replace(/\bA[lI]\b(?=\s+(tools?|apps?|models?|agents?|prompts?|automation|coding|generated|assistant|image|startup|workflow|roadmap|stack|for|in|and)\b)/gi, "AI")
    .replace(/\b(generative|artificial intelligence|using|with|for)\s+A[lI]\b/gi, "$1 AI")
    .replace(/\bA[lI]-/g, "AI-")
    .replace(/\bOpen\s*A[lI]\b/gi, "OpenAI")
    .replace(/\bGithub\b/gi, "GitHub")
    .replace(/\bHugging\s*face\b/gi, "Hugging Face")
    .replace(/\bJavascript\b/gi, "JavaScript")
    .replace(/\bTypescript\b/gi, "TypeScript")
    .replace(/\bPostgresSQL\b/gi, "PostgreSQL")
    .replace(/\bPostgre\s*SQL\b/gi, "PostgreSQL")
    .replace(/\bSupa\s*base\b/gi, "Supabase")
    .replace(/\bSupabse\b/gi, "Supabase")
    .replace(/\bSupab[a@]se\b/gi, "Supabase")
    .replace(/\bC[\u00fc\u00f8u]rs0r\b/gi, "Cursor")
    .replace(/\bC[\u00fc\u00f8u]rsor\b/gi, "Cursor")
    .replace(/\bClaud\u00e9\b/gi, "Claude")
    .replace(/\bClaude\s*[-_]*\s*Code\b/gi, "Claude Code")
    .replace(/\bClaudeCode\b/g, "Claude Code")
    .replace(/\bAPls\b/g, "APIs")
    .replace(/\bAPl\b/g, "API")
    .replace(/\bAPI\s*s\b/g, "APIs")
    .replace(/\bNode\s*js\b/gi, "Node.js")
    .replace(/\bNext\s*js\b/gi, "Next.js")
    .replace(/\bReact\s*js\b/gi, "React.js")
    .replace(/([a-z0-9.-]+)\s*\/\s*([a-z0-9._/-]+)/gi, "$1/$2")
    .replace(/([a-z0-9-])\s*\.\s*([a-z]{2,})(\/[^\s]*)?/gi, "$1.$2$3")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function joinBrokenUrls(text: string) {
  return text
    .replace(/\b(https?:\/\/|www\.)\s+/gi, "$1")
    .replace(/\b(github)\s*\.\s*(com)\s*[\/\\]\s*/gi, "github.com/")
    .replace(/\b(git\s*hub)\s*\.\s*(com)\s*[\/\\]\s*/gi, "github.com/")
    .replace(/\b(github\.com\/[A-Za-z0-9_.-]+)\s*\n\s*\/\s*([A-Za-z0-9_.-]+)/gi, "$1/$2")
    .replace(/\b(github\.com\/[A-Za-z0-9_.-]+)\s*\n\s*([A-Za-z0-9_.-]+)/gi, "$1/$2")
    .replace(/\b(https?:\/\/[^\s/]+)\s*\n\s*\/\s*/gi, "$1/")
    .replace(/\b(www\.[^\s/]+)\s*\n\s*\/\s*/gi, "$1/");
}
