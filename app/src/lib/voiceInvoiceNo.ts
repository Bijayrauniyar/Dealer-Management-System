/** Normalize spoken/text input toward invoice style e.g. "inv 001" → "INV-001". */
export function normalizeInvoiceNoSpoken(raw: string): string {
  let s = raw.trim().toUpperCase();
  if (!s) return "";
  s = s.replace(/\s+/g, " ");
  const invMatch = s.match(/^INV[\s-]*(\d+)$/);
  if (invMatch) return `INV-${invMatch[1].padStart(3, "0")}`;
  return s;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => { start: () => void; stop: () => void };
  webkitSpeechRecognition?: new () => { start: () => void; stop: () => void };
};

export function speechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SpeechRecognitionWindow;
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export type SpeechRecognitionHandle = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function createSpeechRecognition(): SpeechRecognitionHandle | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechRecognitionWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? (new Ctor() as SpeechRecognitionHandle) : null;
}
