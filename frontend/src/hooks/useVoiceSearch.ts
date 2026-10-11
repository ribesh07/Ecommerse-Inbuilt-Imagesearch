"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice search via the browser Web Speech API. Speech-to-text happens entirely
 * client-side, so no external/paid speech service is required. Once we have a
 * transcript we hand it to the normal product search (see searchByVoice).
 *
 * Browser support: Chrome/Edge/Safari (webkit prefix). Firefox has no Speech
 * Recognition, in which case `supported` is false and the UI shows a message.
 */

/* Minimal structural typings for the non-standard Web Speech API. */
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceStatus = "idle" | "listening" | "processing" | "unsupported" | "error";

interface UseVoiceSearchOptions {
  language?: string;
  /** Called with the final transcript when the user stops speaking. */
  onResult?: (transcript: string) => void;
  onError?: (message: string) => void;
}

export interface UseVoiceSearchResult {
  supported: boolean;
  status: VoiceStatus;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const LANG_TAGS: Record<string, string> = {
  en: "en-US",
  ne: "ne-NP",
  bn: "bn-BD",
  zh: "zh-CN",
  hi: "hi-IN",
};

export function useVoiceSearch(options: UseVoiceSearchOptions = {}): UseVoiceSearchResult {
  const { language = "en", onResult, onError } = options;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const resultRef = useRef(onResult);
  const errorRef = useRef(onError);

  // Keep the latest callbacks in refs so the recognition instance always calls
  // the current handler. Updated in an effect (never during render).
  useEffect(() => {
    resultRef.current = onResult;
    errorRef.current = onError;
  }, [onResult, onError]);

  const supported = getRecognitionCtor() !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      setError("Voice search is not supported in this browser.");
      errorRef.current?.("Voice search is not supported in this browser.");
      return;
    }

    // Reset any previous session.
    recognitionRef.current?.abort();
    setError(null);
    setTranscript("");

    const recognition = new Ctor();
    recognition.lang = LANG_TAGS[language] ?? "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (interim) {
        setTranscript(interim);
        setStatus("listening");
      }
      if (final) {
        const cleaned = final.trim();
        setTranscript(cleaned);
        setStatus("processing");
        resultRef.current?.(cleaned);
      }
    };

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission denied. Enable it in your browser settings and try again."
          : event.error === "no-speech"
            ? "No speech detected. Please try again."
            : "Voice search failed. Please try again.";
      setError(message);
      setStatus("error");
      errorRef.current?.(message);
    };

    recognition.onend = () => {
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setStatus("error");
      setError("Unable to start voice recognition.");
    }
  }, [language]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus((prev) => (prev === "listening" ? "idle" : prev));
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    setStatus("idle");
    setTranscript("");
    setError(null);
  }, []);

  return { supported, status, transcript, error, start, stop, reset };
}
