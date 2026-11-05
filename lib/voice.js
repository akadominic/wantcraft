// Which text-to-speech provider to use. Fish Audio is preferred when its key is set
// (cheaper); ElevenLabs is the alternative. TTS_PROVIDER=fish|elevenlabs forces one.
export function voiceProvider() {
  const forced = (process.env.TTS_PROVIDER || "").toLowerCase();
  if (forced === "fish" && process.env.FISH_API_KEY) return "fish";
  if (forced === "elevenlabs" && process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.FISH_API_KEY) return "fish";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return null;
}
