import { useCallback, useEffect, useRef, useState } from 'react';

const DIGIT_MAP = {
  '0': 'Kosong',
  '1': 'Satu',
  '2': 'Dua',
  '3': 'Tiga',
  '4': 'Empat',
  '5': 'Lima',
  '6': 'Enam',
  '7': 'Tujuh',
  '8': 'Delapan',
  '9': 'Sembilan',
};

function isBrowser() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export default function useTTS({ lang = 'id-ID', rate = 0.95, pitch = 1 } = {}) {
  const primedRef = useRef(false);
  const queueRef = useRef([]);
  const speakingRef = useRef(false);
  const [ready, setReady] = useState(isBrowser());
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  useEffect(() => {
    if (!isBrowser()) return;
    // If there are no voices yet, mark that we might need interaction
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      setNeedsUserInteraction(true);
      const onVoicesChanged = () => {
        setNeedsUserInteraction(false);
        setReady(true);
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    }

    // Some browsers block audio before user gesture — add a one-time listener to prime
    const onFirstGesture = () => {
      prime();
      setNeedsUserInteraction(false);
      document.removeEventListener('pointerdown', onFirstGesture);
      document.removeEventListener('keydown', onFirstGesture);
    };

    document.addEventListener('pointerdown', onFirstGesture, { once: true });
    document.addEventListener('keydown', onFirstGesture, { once: true });

    return () => {
      document.removeEventListener('pointerdown', onFirstGesture);
      document.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  const cancel = useCallback(() => {
    if (!isBrowser()) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    speakingRef.current = false;
  }, []);

  const prime = useCallback(() => {
    if (!isBrowser() || primedRef.current) return;
    try {
      // Try to speak a very short zero-volume utterance to satisfy autoplay policies
      const u = new SpeechSynthesisUtterance('.');
      u.lang = lang;
      u.volume = 0; // attempt to play silently
      u.rate = rate;
      u.pitch = pitch;
      u.onend = () => { primedRef.current = true; };
      window.speechSynthesis.speak(u);
      primedRef.current = true;
      setReady(true);
      setNeedsUserInteraction(false);
    } catch (e) {
      // If speaking fails, mark that we need user interaction
      setNeedsUserInteraction(true);
    }
  }, [lang, rate, pitch]);

  // Chain utterances and speak sequentially
  const speakSequence = useCallback((texts = []) => {
    if (!isBrowser() || !texts || texts.length === 0) return;
    // Cancel previous speaking
    cancel();

    const utterances = texts.map((t) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;
      return u;
    });

    // Chain using onend
    for (let i = 0; i < utterances.length - 1; i++) {
      utterances[i].onend = () => window.speechSynthesis.speak(utterances[i + 1]);
    }

    speakingRef.current = true;
    window.speechSynthesis.speak(utterances[0]);
    const last = utterances[utterances.length - 1];
    last.onend = () => { speakingRef.current = false; };
  }, [lang, rate, pitch, cancel]);

  const parseTicketToSpeechParts = useCallback((ticket) => {
    // ticket like 'A-005' or 'P-12'
    if (!ticket) return [];
    const parts = String(ticket).split('-');
    const letterPart = parts[0] || '';
    const numberPart = parts[1] || '';

    const texts = [];
    texts.push('Nomor Antrian');

    // speak letters — split into characters and say them separated by pauses
    for (let ch of letterPart.split('')) {
      // Speak letter as isolated character
      texts.push(ch);
    }

    // digits
    for (let d of numberPart.split('')) {
      texts.push(DIGIT_MAP[d] || d);
    }

    return texts;
  }, []);

  const announce = useCallback(async (ticket, counterName) => {
    if (!isBrowser()) return;
    if (!ticket) return;
    if (!primedRef.current) {
      // try to prime automatically; if still blocked, return signal that user interaction is needed
      prime();
      if (!primedRef.current) return;
    }

    const parts = parseTicketToSpeechParts(ticket);
    // Insert small guiding texts and pauses by creating separate utterances
    const seq = [];
    seq.push('Nomor Antrian');
    // letter(s)
    const letters = parts.slice(1, 1 + (ticket.split('-')[0] || '').length);
    for (let l of letters) seq.push(l);
    // numbers speak already in parts after letters
    const numbersStart = 1 + letters.length;
    for (let i = numbersStart; i < parts.length; i++) seq.push(parts[i]);

    seq.push('Silakan ke');
    if (counterName) {
      // Convert counterName into speech parts, mapping digits to words
      const parts = String(counterName).split(/\s+/).filter(Boolean);
      for (const p of parts) {
        // If the part contains only digits, map each digit to its word
        if (/^\d+$/.test(p)) {
          for (const d of String(p)) seq.push(DIGIT_MAP[d] || d);
        } else {
          // Mixed or word parts: if contains digits, split chars, else push whole word
          if (/\d/.test(p)) {
            for (const ch of p.split('')) {
              if (/\d/.test(ch)) seq.push(DIGIT_MAP[ch] || ch);
              else seq.push(ch);
            }
          } else {
            seq.push(p);
          }
        }
      }
    }

    speakSequence(seq);
  }, [parseTicketToSpeechParts, speakSequence, prime]);

  return {
    announce,
    cancel,
    prime,
    ready,
    needsUserInteraction,
  };
}
