import { useCallback, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createSpeechRecognition,
  normalizeInvoiceNoSpoken,
  speechRecognitionSupported,
  type SpeechRecognitionHandle,
} from "@/lib/voiceInvoiceNo";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
};

export const InvoiceNoField = ({
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  className,
}: Props) => {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionHandle | null>(null);
  const canVoice = speechRecognitionSupported() && !disabled && !readOnly;

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!canVoice) return;
    stopListening();
    const rec = createSpeechRecognition();
    if (!rec) return;

    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      onChange(normalizeInvoiceNoSpoken(said));
    };
    rec.onerror = () => stopListening();
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [canVoice, onChange, stopListening]);

  return (
    <div className="flex gap-1">
      <Input
        className={cn("h-9 text-sm flex-1", className)}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
      {canVoice && (
        <Button
          type="button"
          variant={listening ? "primary" : "outline"}
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={listening ? "Stop voice input" : "Speak invoice number"}
          onClick={() => (listening ? stopListening() : startListening())}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </Button>
      )}
    </div>
  );
};
