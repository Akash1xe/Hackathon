'use client';

import { useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

const LANGUAGES = [
  ['en-IN', 'English'], ['hi-IN', 'हिन्दी'], ['bn-IN', 'বাংলা'], ['mr-IN', 'मराठी'],
  ['ta-IN', 'தமிழ்'], ['te-IN', 'తెలుగు'], ['gu-IN', 'ગુજરાતી'], ['kn-IN', 'ಕನ್ನಡ'],
  ['ml-IN', 'മലയാളം'], ['pa-IN', 'ਪੰਜਾਬੀ'], ['ur-IN', 'اردو']
];

export default function VoiceReportInput({ onTranscript }) {
  const recognitionRef = useRef(null);
  const [language, setLanguage] = useState('en-IN');
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  function toggle() {
    if (listening) { recognitionRef.current?.stop(); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setMessage('Voice reporting is not supported in this browser. You can still type the report.');
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setMessage('Listening… describe the civic issue naturally.'); };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setMessage('Voice capture stopped. Please try again or type your report.'); };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ').trim();
      if (transcript) { onTranscript({ transcript, language }); setMessage('Voice captured. Review the generated report details before submitting.'); }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  return <div className="rounded-2xl border border-[#dce3df] bg-[#f7faf8] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold">Multilingual voice report</p><p className="mt-1 text-xs text-[#627570]">Speak naturally; Samvid places the transcript into your description.</p></div><div className="flex gap-2"><select className="field min-w-32 py-2 text-sm" value={language} onChange={(event) => setLanguage(event.target.value)}>{LANGUAGES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={toggle} className={listening ? 'inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white' : 'button-secondary'}>{listening ? <StopIcon className="h-4 w-4" /> : <MicrophoneIcon className="h-4 w-4" />}{listening ? 'Stop' : 'Speak'}</button></div></div>{message && <p className="mt-3 text-xs font-semibold text-[#627570]">{message}</p>}</div>;
}
