(() => {
"use strict";

/* ---------------- Knowledge base (summarized from the learner's copy of Influence; own words) ---------------- */
const P = [
  {id:"contrast", name:"Contrast", ch:"Ch. 1", pages:"pp. 1–12", gist:"Shortcuts fire on one feature. What comes first changes how the next thing looks."},
  {id:"reciprocation", name:"Reciprocation", ch:"Ch. 2", pages:"pp. 13–42", gist:"We repay what we're given, including concessions."},
  {id:"commitment", name:"Commitment & Consistency", ch:"Ch. 3", pages:"pp. 43–86", gist:"Once we take a stand, we act to stay consistent with it."},
  {id:"social", name:"Social Proof", ch:"Ch. 4", pages:"pp. 87–125", gist:"Under uncertainty we copy what similar others do."},
  {id:"liking", name:"Liking", ch:"Ch. 5", pages:"pp. 126–156", gist:"We say yes to people we know and like."},
  {id:"authority", name:"Authority", ch:"Ch. 6", pages:"pp. 157–177", gist:"We defer to real or apparent experts, even to their symbols."},
  {id:"scarcity", name:"Scarcity", ch:"Ch. 7", pages:"pp. 178–204", gist:"What's less available, or about to be lost, feels more valuable."},
  {id:"mix", name:"Mix it up", ch:"All", pages:"", gist:"Random principles each round, the way real conversations go."}
];
const PMAP = Object.fromEntries(P.map(p => [p.id, p]));
const EX = [
  {id:"lesson", name:"Learn it", d:"Short animated lesson, then check questions"},
  {id:"spot", name:"Spot it", d:"Read a real-world exchange and name the lever"},
  {id:"craft", name:"Use it", d:"Write the line you'd say; get it scored and improved"},
  {id:"defend", name:"Defend", d:"It's used on you. Say no well, the book's way"},
  {id:"roleplay", name:"Roleplay", d:"Live conversation with a counterpart, then debrief"}
];
const AR = [
  {id:"job", name:"Job search", d:"Recruiters, hiring managers, offers"},
  {id:"hiring", name:"Hiring", d:"Selling a role, closing candidates"},
  {id:"enterprise", name:"Enterprise sales", d:"Champions, buying committees, procurement"},
  {id:"everyday", name:"Everyday", d:"Partners, vendors, negotiations"}
];
const ARMAP = Object.fromEntries(AR.map(a => [a.id, a]));


/* ---------------- Helpers & state ---------------- */
const $ = s => document.querySelector(s);
const el = (tag, attrs={}, ...kids) => { const n = document.createElement(tag); for (const [k,v] of Object.entries(attrs)) { if (k === "class") n.className = v; else if (k === "style") n.setAttribute("style", v); else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v); } for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(String(k))); return n; };
const ls = { get(k,d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }, del(k){ try { localStorage.removeItem(k); } catch {} } };
const state = {
  tab:"learn", principle:"reciprocation", exercise:"lesson", arena:"enterprise",
  about: ls.get("ic.about", ""), sessions: ls.get("ic.sessions", []), current:null, busy:false, ctl:null,
  key: ls.get("ic.key", ""), svc:{coach:true, voice:true}, store:"local"
};

/* ---------------- Server calls ---------------- */
async function api(path, body, opts = {}){
  const headers = {"x-app-key": state.key};
  if (opts.raw) { headers["content-type"] = "application/octet-stream"; headers["x-audio-type"] = opts.type || "audio/webm"; }
  else headers["content-type"] = "application/json";
  let r;
  try { r = await fetch(path, {method:"POST", headers, body: opts.raw ? body : JSON.stringify(body || {}), signal: opts.signal}); }
  catch (e) { if (e && e.name === "AbortError") throw {code:"cancelled"}; throw {code:"network"}; }
  if (r.status === 401) { lock("That access code didn't work. Enter it again."); throw {code:"unauthorized"}; }
  return r;
}
async function errorFrom(r){ let j = {}; try { j = await r.json(); } catch {} return {code: j.error || (r.status === 429 ? "rate_limited" : "upstream_error"), message: j.message || ""}; }

/* ---------------- Learn launcher ---------------- */
function renderLearn(){
  const g = $("#pGrid"); g.textContent = "";
  for (const p of P) {
    const b = el("button", {class:"pcard", role:"radio", "aria-checked": String(state.principle === p.id), style:`--pc:var(--p-${p.id})`, type:"button", onclick:() => { state.principle = p.id; renderLearn(); }},
      el("span", {class:"nm"}, el("span", {class:"sw"}), p.name),
      el("span", {class:"mono ch"}, p.pages ? `${p.ch} · ${p.pages}` : "All chapters"),
      el("span", {class:"gist"}, p.gist));
    g.append(b);
  }
  const e = $("#exGrid"); e.textContent = "";
  for (const x of EX) e.append(el("button", {class:"opt", role:"radio", type:"button", "aria-checked": String(state.exercise === x.id), onclick:() => { state.exercise = x.id; renderLearn(); }}, el("b", {}, x.name), el("span", {}, x.d)));
  const a = $("#arGrid"); a.textContent = "";
  for (const x of AR) a.append(el("button", {class:"opt chipopt", role:"radio", type:"button", "aria-checked": String(state.arena === x.id), onclick:() => { state.arena = x.id; renderLearn(); }}, el("b", {}, x.name), el("span", {}, x.d)));
  $("#learnSummary").textContent = `${PMAP[state.principle].name} · ${EX.find(x => x.id === state.exercise).name} · ${ARMAP[state.arena].name}`;
  ls.set("ic.learn", {p:state.principle, e:state.exercise, a:state.arena});
}


/* ---------------- Simulate form ---------------- */
const EXAMPLE = {
  arena:"hiring",
  who:"Priya, senior data engineer. Two competing offers, cautious about early-stage companies.",
  goal:"Accept our offer by Friday without feeling pushed.",
  sit:"Final round went well. Our cash is about 10% below her top competing offer; we offer more equity, broader scope, and she'd own the data platform from day one.",
  hist:"She asked twice about runway. She lit up at the team lunch and asked to meet our head of product. Recruiter already sent the written offer.",
  risk:"Doesn't want to feel pressured. The competitor gave her an exploding offer that expires Thursday. We can't move much on cash."
};
const F = {arena:"#simArena", who:"#simWho", goal:"#simGoal", sit:"#simSit", hist:"#simHist", risk:"#simRisk"};
function fillForm(v){ for (const [k,s] of Object.entries(F)) $(s).value = v[k] || ""; }
function readForm(){ const o = {}; for (const [k,s] of Object.entries(F)) o[k] = $(s).value.trim(); return o; }
function setupSim(){
  const sel = $("#simArena");
  for (const a of AR) sel.append(el("option", {value:a.id}, a.name));
  const saved = ls.get("ic.simDraft", null);
  if (saved && saved.who) { fillForm(saved); $("#exampleTag").hidden = true; $("#fillSim").hidden = false; }
  else fillForm(EXAMPLE);
  $("#clearSim").onclick = () => { fillForm({arena:"enterprise"}); $("#exampleTag").hidden = true; $("#fillSim").hidden = false; ls.set("ic.simDraft", readForm()); $("#simWho").focus(); };
  $("#fillSim").onclick = () => { fillForm(EXAMPLE); $("#exampleTag").hidden = false; $("#fillSim").hidden = true; };
  $("#simForm").addEventListener("input", () => { $("#exampleTag").hidden = true; ls.set("ic.simDraft", readForm()); });
  $("#simForm").addEventListener("submit", ev => {
    ev.preventDefault();
    const f = readForm();
    if (!f.who || !f.goal || !f.sit) { flash("Add who you're influencing, your goal and the situation."); return; }
    const title = `${ARMAP[f.arena].name}: ${f.goal}`.slice(0, 90);
    startSession({mode:"simulate", form:f, arena:f.arena, title, principle:"mix"}, "Build my approach.");
  });
}
function flash(msg){ const b = $("#aiBanner"); b.textContent = msg; b.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => { if (!state.aiDown) b.hidden = true; }, 4000); }


/* ---------------- Tabs / routing / access gate ---------------- */
const TABS = ["learn","simulate","progress"];
function show(view){
  for (const v of ["gate","learn","simulate","progress","session"]) $("#view-" + v).hidden = v !== view;
  document.body.classList.toggle("locked", view === "gate");
  document.querySelectorAll(".tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.tab === (view === "session" ? state.tab : view) ? "page" : "false"));
  if (view === "progress") renderProgress();
  window.scrollTo(0, 0);
}
function route(){
  if (!state.key) { show("gate"); return; }
  const h = (location.hash || "").slice(1);
  if (TABS.includes(h)) { state.tab = h; show(h); }
  else if (state.current) show("session");
  else show(state.tab);
}
function lock(msg){
  state.key = ""; ls.del("ic.key");
  state.ctl?.abort(); stopSpeaking(); stopListening();
  $("#gateErr").textContent = msg || "";
  show("gate");
  setTimeout(() => $("#gateCode").focus(), 50);
}
window.addEventListener("hashchange", route);
document.querySelectorAll(".tabs a").forEach(a => a.addEventListener("click", ev => {
  if (location.hash === "#" + a.dataset.tab) { ev.preventDefault(); state.tab = a.dataset.tab; show(a.dataset.tab); }
}));
$("#gateForm").addEventListener("submit", async ev => {
  ev.preventDefault();
  const code = $("#gateCode").value.trim(); if (!code) return;
  $("#gateBtn").disabled = true; $("#gateErr").textContent = "";
  state.key = code;
  try {
    const r = await api("/api/check", {});
    if (!r.ok) { const e = await errorFrom(r); throw e; }
    state.svc = await r.json();
    ls.set("ic.key", code);
    $("#gateCode").value = "";
    applyServiceNotes();
    route();
  } catch (e) {
    if (e.code !== "unauthorized") { state.key = ""; $("#gateErr").textContent = e.message || "Couldn't reach the server. Check your connection and try again."; }
  } finally { $("#gateBtn").disabled = false; }
});
$("#signOut").onclick = () => lock("Signed out.");
function applyServiceNotes(){
  const n = [];
  if (!state.svc.coach) n.push("The coach isn't configured yet: add ANTHROPIC_API_KEY on the server.");
  if (!state.svc.voice) n.push("Natural voice is off: no Fish Audio or ElevenLabs key on the server, so the device voice is used.");
  $("#svcNote").textContent = n.length ? n.join(" ") : `Signed in on this device · coach model ${state.svc.model || "default"}.`;
  renderEngine();
}

/* ---------------- Voice output: ElevenLabs natural voices, device voices as fallback ---------------- */
const EL_VOICES = [
  {id:"21m00Tcm4TlvDq8ikWAM", name:"Rachel · American, calm"},
  {id:"EXAVITQu4vr4xnSDxMaL", name:"Sarah · American, warm"},
  {id:"XrExE9yKIg1WjnnlVkGX", name:"Matilda · American, friendly"},
  {id:"Xb7hH8MSUJpSbSDYk0k2", name:"Alice · British, confident"},
  {id:"pFZP5JQG7iQjIQuC4Bku", name:"Lily · British, smooth"}
];
const tts = {
  on: ls.get("ic.voiceOn", true), rate: ls.get("ic.rate", 1), engine: ls.get("ic.engine", "natural"),
  elVoice: ls.get("ic.elVoice", EL_VOICES[0].id), elCustom: ls.get("ic.elCustom", ""),
  voiceName: ls.get("ic.voice", ""), voices: []
};
const player = new Audio();
player.preload = "auto";
let audioUnlocked = false;
function silentWav(){
  // 0.1 s of 8 kHz mono silence, built in place so the data is always valid.
  const n = 800, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, str) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  let bin = ""; new Uint8Array(buf).forEach(b => bin += String.fromCharCode(b));
  return "data:audio/wav;base64," + btoa(bin);
}
function unlockAudio(){
  if (audioUnlocked) return; audioUnlocked = true;
  // A silent play inside a tap lets later replies play on iPhone.
  player.src = silentWav();
  player.play().then(() => player.pause()).catch(() => {});
  try { speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch {}
}
document.addEventListener("pointerdown", unlockAudio, {once:true, capture:true});
document.addEventListener("keydown", unlockAudio, {once:true, capture:true});

const FEMALE = ["samantha","ava","allison","susan","victoria","karen","moira","tessa","serena","fiona","zoe","joanna","kendra","salli","nicky","aria","jenny","zira","libby","sonia","natasha","clara","emma","michelle","female","google us english","google uk english female"];
function femaleRank(v){ const n = v.name.toLowerCase(); const i = FEMALE.findIndex(f => n.includes(f)); return i < 0 ? 999 : i; }
function quality(v){ return /natural|neural|premium|enhanced|wavenet|studio|online/i.test(v.name) ? 0 : /google/i.test(v.name) ? 1 : 2; }
function loadVoices(){
  if (!("speechSynthesis" in window)) return;
  const all = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  tts.voices = all.sort((a,b) => quality(a) - quality(b) || (femaleRank(a) < 999 ? 0 : 1) - (femaleRank(b) < 999 ? 0 : 1) || femaleRank(a) - femaleRank(b));
  const sel = $("#voiceSel"); sel.textContent = "";
  for (const v of tts.voices) sel.append(el("option", {value:v.name}, `${v.name} (${v.lang})${quality(v) === 0 ? " · natural" : ""}${femaleRank(v) < 999 ? " · female" : ""}`));
  if (!tts.voices.length) sel.append(el("option", {value:""}, "No voices found on this device"));
  if (!tts.voiceName || !tts.voices.some(v => v.name === tts.voiceName)) tts.voiceName = tts.voices[0]?.name || "";
  sel.value = tts.voiceName;
}
function useNatural(){ return tts.engine === "natural" && state.svc.voice !== false; }
function isFish(){ return state.svc.voiceProvider === "fish"; }
function elVoiceId(){
  const custom = /^[A-Za-z0-9_-]{8,64}$/.test(tts.elCustom) ? tts.elCustom : "";
  return isFish() ? custom : (custom || tts.elVoice);
}

let speakToken = 0, speakDone = null;
function speaking(on){ $("#stopBtn").hidden = !on && !state.busy; document.body.classList.toggle("speaking", on); }
function finishSpeak(){ const f = speakDone; speakDone = null; speaking(false); if (f) f(); }
function fetchVoice(text){
  return api("/api/tts", {text, voice: elVoiceId()}).then(async r => {
    if (!r.ok) { const e = await errorFrom(r); if (r.status === 501) { state.svc.voice = false; applyServiceNotes(); } throw e; }
    return URL.createObjectURL(await r.blob());
  });
}
// Speaks text; resolves when finished or interrupted. `prepared` is a voice fetch started early.
function speak(text, prepared){
  stopSpeaking();
  if (!tts.on || !text) return Promise.resolve();
  const my = ++speakToken;
  return new Promise(resolve => {
    speakDone = resolve;
    speaking(true);
    if (useNatural()) {
      (prepared || fetchVoice(text)).then(url => {
        if (my !== speakToken) { URL.revokeObjectURL(url); return; }
        player.onended = player.onerror = () => { URL.revokeObjectURL(url); if (my === speakToken) finishSpeak(); };
        player.src = url; player.playbackRate = tts.rate;
        player.play().catch(() => { if (my === speakToken) speakDevice(text, my); });
      }).catch(() => { if (my === speakToken) speakDevice(text, my); });
    } else speakDevice(text, my);
  });
}
function speakDevice(text, my){
  if (!("speechSynthesis" in window)) { finishSpeak(); return; }
  const clean = text.replace(/[*_#`>]/g, "").replace(/\s+/g, " ").trim();
  const parts = clean.match(/[^.!?]+[.!?]+["”’)]*|\S[^.!?]*$/g) || [clean];
  const chunks = []; let buf = "";
  for (const p of parts) { if ((buf + p).length > 220 && buf) { chunks.push(buf); buf = p; } else buf += p; }
  if (buf.trim()) chunks.push(buf);
  const v = tts.voices.find(x => x.name === tts.voiceName);
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c.trim());
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = tts.rate;
    if (i === chunks.length - 1) u.onend = u.onerror = () => { if (my === speakToken) finishSpeak(); };
    speechSynthesis.speak(u);
  });
}
function stopSpeaking(){
  speakToken++;
  try { player.pause(); } catch {}
  try { speechSynthesis.cancel(); } catch {}
  finishSpeak();
}
function renderVoiceToggle(){
  $("#voiceToggle").setAttribute("aria-pressed", String(tts.on));
  $("#voiceLabel").textContent = tts.on ? "Voice on" : "Voice off";
  $("#waves").style.opacity = tts.on ? 1 : .2;
}
function renderEngine(){
  document.querySelectorAll("[data-engine]").forEach(b => b.setAttribute("aria-checked", String(b.dataset.engine === tts.engine)));
  $("#naturalField").hidden = tts.engine !== "natural";
  $("#deviceField").hidden = tts.engine !== "device";
  const fish = isFish();
  $("#elVoice").hidden = fish;
  $("#elCustom").placeholder = fish ? "Fish Audio voice ID (from a voice's page on fish.audio)" : "Or paste any ElevenLabs voice ID";
  $("#elCustom").setAttribute("aria-label", fish ? "Fish Audio voice ID" : "Custom ElevenLabs voice ID");
  $("#naturalHint").textContent = fish
    ? (state.svc.defaultVoice ? "Using the server's default Fish Audio voice. Paste another voice ID to switch." : "Pick a voice on fish.audio, copy its ID from the voice's page, and paste it here.")
    : "";
  $("#naturalHint").hidden = !fish;
  $("#engineNote").textContent = tts.engine === "natural"
    ? (state.svc.voice === false ? "Natural voice isn't set up on the server, so the device voice is used for now." : `Studio-quality voice from ${fish ? "Fish Audio" : "ElevenLabs"}. Uses your credits there.`)
    : "Quality depends on your device. Natural-sounding voices are listed first.";
}
function initVoiceSettings(){
  const s = $("#elVoice");
  for (const v of EL_VOICES) s.append(el("option", {value:v.id}, v.name));
  s.value = tts.elVoice; $("#elCustom").value = tts.elCustom;
  s.onchange = e => { tts.elVoice = e.target.value; ls.set("ic.elVoice", tts.elVoice); };
  $("#elCustom").onchange = e => { tts.elCustom = e.target.value.trim(); ls.set("ic.elCustom", tts.elCustom); };
  document.querySelectorAll("[data-engine]").forEach(b => b.onclick = () => { tts.engine = b.dataset.engine; ls.set("ic.engine", tts.engine); renderEngine(); });
  $("#voiceSel").onchange = e => { tts.voiceName = e.target.value; ls.set("ic.voice", tts.voiceName); };
  $("#rate").value = tts.rate; $("#rateVal").textContent = Number(tts.rate).toFixed(2).replace(/0$/, "") + "×";
  $("#rate").oninput = e => { tts.rate = Number(e.target.value); ls.set("ic.rate", tts.rate); $("#rateVal").textContent = tts.rate.toFixed(2).replace(/0$/, "") + "×"; };
  $("#testVoice").onclick = () => { const was = tts.on; tts.on = true; speak("Hi, I'm your influence coach. Let's make the six principles automatic."); tts.on = was; };
  $("#voiceToggle").onclick = () => { tts.on = !tts.on; ls.set("ic.voiceOn", tts.on); if (!tts.on) stopSpeaking(); renderVoiceToggle(); };
  if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  renderVoiceToggle(); renderEngine();
}

/* ---------------- Voice input: live speech recognition, recorder + /api/stt as fallback ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const listen = {active:false, rec:null, base:"", finalText:"", silenceT:null, media:null, stream:null, chunks:[], heard:false};
const input = $("#input");
function handsFree(){ return $("#handsFree").checked; }
function uiListening(on, label){
  listen.active = on;
  $("#micBtn").setAttribute("aria-pressed", String(on));
  $("#listenPanel").hidden = !on;
  if (label) $("#listenState").textContent = label;
  $("#listenHint").textContent = SR ? "Speak naturally. A two-second pause ends your turn." : "Tap Done when you've finished speaking.";
}
function armSilence(ms){ clearTimeout(listen.silenceT); listen.silenceT = setTimeout(stopListening, ms); }
function startListening(){
  if (listen.active || state.busy || !state.current) return;
  stopSpeaking();
  if (SR) startRecognition(); else startRecorder();
}
function startRecognition(){
  let rec;
  try { rec = new SR(); } catch { startRecorder(); return; }
  rec.lang = navigator.language || "en-US"; rec.continuous = true; rec.interimResults = true;
  listen.base = input.value.trim() ? input.value.trimEnd() + " " : ""; listen.finalText = ""; listen.heard = false;
  rec.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) listen.finalText += r[0].transcript + " "; else interim += r[0].transcript; }
    listen.heard = true;
    input.value = (listen.base + listen.finalText + interim).replace(/\s+/g, " ").trimStart(); autosize();
    armSilence(2000);
  };
  rec.onerror = e => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") { $("#handsFree").checked = false; flash("Microphone access is blocked. Allow it for this site in your browser settings, then try again."); }
  };
  rec.onend = () => finishListening();
  try { rec.start(); } catch { finishListening(); return; }
  listen.rec = rec; uiListening(true, "Listening…");
  armSilence(8000); // stop if nothing is said
}
async function startRecorder(){
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { flash("This browser can't record audio. Try Chrome, Edge or Safari."); return; }
  try { listen.stream = await navigator.mediaDevices.getUserMedia({audio:true}); }
  catch { $("#handsFree").checked = false; flash("Microphone access is blocked. Allow it for this site in your browser settings."); return; }
  const type = ["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg"].find(t => MediaRecorder.isTypeSupported?.(t)) || "";
  const media = new MediaRecorder(listen.stream, type ? {mimeType:type} : undefined);
  listen.chunks = [];
  media.ondataavailable = e => { if (e.data.size) listen.chunks.push(e.data); };
  media.onstop = async () => {
    listen.stream.getTracks().forEach(t => t.stop());
    uiListening(true, "Transcribing…");
    try {
      const blob = new Blob(listen.chunks, {type: media.mimeType || "audio/webm"});
      const r = await api("/api/stt", blob, {raw:true, type: blob.type});
      if (!r.ok) throw await errorFrom(r);
      const {text} = await r.json();
      if (text) { input.value = (input.value.trim() ? input.value.trimEnd() + " " : "") + text; autosize(); listen.heard = true; }
    } catch (e) { if (e.code !== "unauthorized") flash(e.message || "Couldn't transcribe that. Try again, or type."); }
    finishListening();
  };
  media.start(); listen.media = media; listen.heard = false;
  uiListening(true, "Recording…");
}
function stopListening(){
  clearTimeout(listen.silenceT);
  if (listen.rec) { try { listen.rec.stop(); } catch {} }
  if (listen.media && listen.media.state !== "inactive") { try { listen.media.stop(); } catch {} }
}
function finishListening(){
  clearTimeout(listen.silenceT);
  listen.rec = null; listen.media = null;
  uiListening(false);
  const t = input.value.trim();
  if (t && handsFree()) sendUser(t);
  else if (!listen.heard && handsFree()) flash("Didn't catch anything. Tap the mic when you're ready.");
}
$("#micBtn").onclick = () => { unlockAudio(); if (listen.active) stopListening(); else startListening(); };
$("#listenStop").onclick = stopListening;
$("#handsFree").checked = ls.get("ic.handsFree", false);
$("#handsFree").onchange = e => { ls.set("ic.handsFree", e.target.checked); if (e.target.checked && !state.busy && !document.body.classList.contains("speaking")) startListening(); if (!e.target.checked) stopListening(); };

/* ---------------- Composer ---------------- */
function autosize(){ input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 180) + "px"; }
input.addEventListener("input", autosize);
input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (input.value.trim()) { stopListening(); sendUser(input.value); } } });
$("#sendBtn").onclick = () => { if (input.value.trim()) { stopListening(); sendUser(input.value); } };
$("#stopBtn").onclick = () => { state.ctl?.abort(); stopSpeaking(); $("#stopBtn").hidden = true; };
$("#endSess").onclick = () => { state.ctl?.abort(); stopSpeaking(); stopListening(); state.current = null; const t = state.tab; if (location.hash !== "#" + t) location.hash = t; else show(t); };

/* ---------------- Rendering helpers ---------------- */
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function inline(s){ return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>").replace(/(^|[\s(])_(?!\s)(.+?)_(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>"); }
function md(src){
  const lines = String(src || "").replace(/\r/g, "").split("\n");
  let html = "", list = null, para = [];
  const flushP = () => { if (para.length) { html += `<p>${para.map(inline).join("<br>")}</p>`; para = []; } };
  const flushL = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd();
    let m;
    if (!l.trim()) { flushP(); flushL(); continue; }
    if ((m = l.match(/^\s*[-•]\s+(.*)/))) { flushP(); if (list !== "ul") { flushL(); html += "<ul>"; list = "ul"; } html += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { flushP(); if (list !== "ol") { flushL(); html += "<ol>"; list = "ol"; } html += `<li>${inline(m[1])}</li>`; continue; }
    flushL(); para.push(l.replace(/^#+\s*/, ""));
  }
  flushP(); flushL();
  return html;
}
function tag(pid){ const p = PMAP[pid]; if (!p || pid === "mix") return null; return el("span", {class:"tag", style:`--pc:var(--p-${pid})`}, el("i"), p.name); }

/* SVG sanitizer: allowlist elements & attributes; no scripts, links, styles blocks or events. */
const SVG_OK = new Set(["svg","g","rect","circle","ellipse","line","polyline","polygon","path","text","tspan","title","desc","defs","lineargradient","radialgradient","stop","marker","clippath","animate","animatetransform","animatemotion","set","mpath"]);
function sanitizeSvg(str){
  if (!str || typeof str !== "string" || str.length > 60000) return null;
  let doc;
  try { doc = new DOMParser().parseFromString(str, "image/svg+xml"); } catch { return null; }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return null;
  const walk = node => {
    for (const child of [...node.children]) {
      const name = child.nodeName.toLowerCase();
      if (!SVG_OK.has(name)) { child.remove(); continue; }
      for (const a of [...child.attributes]) {
        const an = a.name.toLowerCase(), av = a.value;
        if (an.startsWith("on") || an === "style" && /url\s*\(|expression|@import|javascript/i.test(av)) { child.removeAttribute(a.name); continue; }
        if ((an === "href" || an === "xlink:href") && !av.startsWith("#")) { child.removeAttribute(a.name); continue; }
        if (/^(fill|stroke|stop-color)$/.test(an) && /var\(/.test(av)) { child.removeAttribute(a.name); child.setAttribute("style", `${an}:${av};` + (child.getAttribute("style") || "")); continue; }
        if ((an === "attributename") && /^(href|xlink:href|on)/i.test(av)) { child.remove(); break; }
      }
      if (child.isConnected) walk(child);
    }
  };
  for (const a of [...root.attributes]) if (a.name.toLowerCase().startsWith("on")) root.removeAttribute(a.name);
  walk(root);
  if (!root.getAttribute("viewBox")) root.setAttribute("viewBox", "0 0 640 360");
  root.removeAttribute("width"); root.removeAttribute("height");
  root.setAttribute("role", "img");
  return document.importNode(root, true);
}

function renderVisual(v){
  if (!v || !v.svg) return null;
  const svg = sanitizeSvg(v.svg);
  if (!svg) return null;
  const cv = el("div", {class:"cv"}, svg);
  const replay = el("button", {class:"linkbtn", type:"button", onclick:() => { try { svg.setCurrentTime(0); svg.unpauseAnimations(); } catch {} }}, "Replay");
  return el("figure", {class:"vis"}, cv, el("figcaption", {}, el("span", {}, el("b", {}, v.title || "Visual"), v.caption ? " · " + v.caption : ""), replay));
}

function renderPlan(plan){
  if (!plan || typeof plan !== "object") return null;
  const wrap = el("div", {class:"plan"});
  if (plan.read || plan.objective) wrap.append(el("div", {}, el("h3", {}, "The read"), plan.read ? el("div", {class:"read"}, plan.read) : null, plan.objective ? el("p", {style:"margin:.5em 0 0"}, el("b", {}, "The yes you want: "), plan.objective) : null));
  if (Array.isArray(plan.levers) && plan.levers.length) {
    const g = el("div", {class:"levers"});
    for (const l of plan.levers) {
      const pid = PMAP[l.principle] ? l.principle : "mix";
      g.append(el("div", {class:"lever", style:`--pc:var(--p-${pid})`}, tag(pid), el("div", {style:"margin-top:6px"}, el("b", {}, l.move || "")), el("div", {style:"color:var(--muted);font-size:14.5px;margin-top:2px"}, l.why || ""), l.line ? el("div", {class:"say-it"}, `“${String(l.line).replace(/^["“]|["”]$/g, "")}”`) : null));
    }
    wrap.append(el("div", {}, el("h3", {}, "Levers to pull, honestly"), g));
  }
  if (Array.isArray(plan.sequence) && plan.sequence.length) {
    const ol = el("ol", {class:"seq"});
    for (const s of plan.sequence) ol.append(el("li", {}, el("div", {}, el("b", {}, s.step || ""), PMAP[s.principle] && s.principle !== "mix" ? el("span", {class:"mono", style:"color:var(--muted);margin-left:8px"}, PMAP[s.principle].name) : null, el("div", {style:"color:var(--muted);font-size:14.5px"}, s.detail || ""))));
    wrap.append(el("div", {}, el("h3", {}, "Sequence"), ol));
  }
  if (Array.isArray(plan.watch_for) && plan.watch_for.length) {
    const w = el("div", {class:"watch"});
    for (const x of plan.watch_for) { const pid = PMAP[x.principle] ? x.principle : "mix"; w.append(el("div", {style:`--pc:var(--p-${pid})`}, el("b", {}, (PMAP[pid]?.name || "") + ": "), x.sign || "", el("div", {style:"color:var(--muted);font-size:14.5px"}, "Defense: " + (x.counter || "")))); }
    wrap.append(el("div", {}, el("h3", {}, "If they use it on you"), w));
  }
  if (Array.isArray(plan.guardrails) && plan.guardrails.length) wrap.append(el("div", {}, el("h3", {}, "Guardrails"), el("ul", {style:"margin:0;padding-left:1.2em"}, plan.guardrails.map(g => el("li", {}, g)))));
  if (Array.isArray(plan.refs) && plan.refs.length) wrap.append(el("div", {class:"refs mono"}, "Sources: " + plan.refs.join(" · ")));
  return wrap;
}

function scoreClass(s){ return s >= 4 ? "" : s >= 2 ? "mid" : "low"; }
function renderFeedback(fb){
  if (!fb || typeof fb.score !== "number") return null;
  const s = Math.max(0, Math.min(5, Math.round(fb.score)));
  const meter = el("div", {class:"meter " + scoreClass(s), "aria-label":`Score ${s} of 5`}, [0,1,2,3,4].map(i => el("span", {class: i < s ? "on" : ""})));
  return el("div", {class:"fb"}, meter, el("div", {}, el("div", {class:"v"}, `${s}/5 · ${fb.verdict || ""}`), fb.better ? el("div", {class:"better"}, el("b", {}, "Stronger: "), fb.better) : null));
}

function renderAI(data, opts = {}){
  const box = el("div", {class:"turn ai"});
  const tags = (Array.isArray(data.principles) ? data.principles : []).map(tag).filter(Boolean);
  if (tags.length) box.append(el("div", {class:"tags"}, tags));
  const say = el("div", {class:"say"}); say.innerHTML = md(data.say || ""); box.append(say);
  const fb = renderFeedback(data.feedback); if (fb) box.append(fb);
  const plan = renderPlan(data.plan); if (plan) box.append(plan);
  const vis = renderVisual(data.visual); if (vis) box.append(vis);
  if (!opts.past && Array.isArray(data.choices) && data.choices.length) {
    const c = el("div", {class:"choices"});
    for (const ch of data.choices.slice(0, 4)) c.append(el("button", {class:"choice", type:"button", onclick:() => { c.querySelectorAll("button").forEach(b => b.disabled = true); sendUser(String(ch)); }}, String(ch)));
    box.append(c);
  }
  const acts = el("div", {class:"turn-actions"});
  if (data.speak || data.say) acts.append(el("button", {class:"linkbtn", type:"button", onclick:() => { const was = tts.on; tts.on = true; speak(data.speak || data.say); tts.on = was; }}, "Read aloud"));
  if (!opts.past && data.done && state.current?.mode === "learn") {
    acts.append(el("button", {class:"btn small", type:"button", onclick:() => sendUser("Next exercise: same setup, a bit harder.")}, "Next exercise"));
    acts.append(el("button", {class:"btn ghost small", type:"button", onclick:() => $("#endSess").click()}, "New setup"));
  }
  box.append(acts);
  return box;
}


/* ---------------- Session engine ---------------- */
function newId(){ return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function sessTitle(s){
  if (s.mode === "simulate") return s.title;
  return `${PMAP[s.principle].name}: ${EX.find(x => x.id === s.exercise).name} · ${ARMAP[s.arena].name}`;
}
function renderSessionHead(){
  const s = state.current;
  $("#sessTitle").textContent = sessTitle(s);
  const t = $("#sessTags"); t.textContent = "";
  t.append(el("span", {class:"tag", style:`--pc:var(--${s.mode === "learn" ? "p-commitment" : "accent"})`}, el("i"), s.mode === "learn" ? "Learn" : "Simulate"));
}
function formBubble(f){ return el("div", {class:"turn me"}, `${f.who}\nGoal: ${f.goal}\n${f.sit}`); }
function startSession(setup, kickoff){
  if (state.svc.coach === false) { flash("The coach isn't set up yet: add ANTHROPIC_API_KEY on the server."); return; }
  const s = Object.assign({id:newId(), kind:"session", createdAt:Date.now(), updatedAt:Date.now(), turns:[], scores:[], seen:[]}, setup);
  s.title = sessTitle(s);
  state.current = s;
  $("#thread").textContent = "";
  renderSessionHead();
  if (location.hash) history.replaceState(null, "", location.pathname);
  show("session");
  if (s.mode === "simulate") $("#thread").append(formBubble(s.form));
  sendUser(kickoff || "Start the session.", {hidden:true});
}
function resumeSession(s){
  state.current = JSON.parse(JSON.stringify(s));
  state.tab = s.mode === "simulate" ? "simulate" : "learn";
  const th = $("#thread"); th.textContent = "";
  renderSessionHead();
  const turns = state.current.turns;
  turns.forEach((t, i) => {
    if (t.role === "user") { if (t.hidden && s.mode === "simulate" && s.form) th.append(formBubble(s.form)); else if (!t.hidden) th.append(el("div", {class:"turn me"}, t.content)); }
    else { const d = safeParse(t.content); th.append(d ? renderAI(d, {past: i < turns.length - 1}) : el("div", {class:"turn ai"}, t.content)); }
  });
  if (location.hash) history.replaceState(null, "", location.pathname);
  show("session");
  window.scrollTo(0, document.body.scrollHeight);
}
function safeParse(s){ try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; } }
function parseLoose(raw){
  const t = raw.trim();
  try { return JSON.parse(t); } catch {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  return null;
}
// Reads a string field out of JSON that is still streaming in. done = the closing quote has arrived.
function partialField(raw, key){
  const k = raw.indexOf(`"${key}"`); if (k < 0) return null;
  let i = raw.indexOf(":", k); if (i < 0) return null;
  i = raw.indexOf('"', i + 1); if (i < 0) return null;
  let out = "", j = i + 1;
  while (j < raw.length) {
    const c = raw[j];
    if (c === "\\") { const n = raw[j + 1]; if (n === undefined) break; if (n === "n") out += "\n"; else if (n === "t") out += " "; else if (n === "u") { const h = raw.substr(j + 2, 4); if (h.length < 4) break; out += String.fromCharCode(parseInt(h, 16)); j += 6; continue; } else out += n; j += 2; continue; }
    if (c === '"') return {text:out, done:true};
    out += c; j++;
  }
  return {text:out, done:false};
}
function historyForModel(s){
  // Visual SVGs are replaced by their titles to keep requests small.
  return s.turns.map(t => {
    if (t.role !== "assistant") return {role:"user", content:t.content};
    const d = safeParse(t.content);
    if (d && d.visual) d.visual = {title:d.visual.title, caption:d.visual.caption, svg:"[drawn]"};
    return {role:"assistant", content: d ? JSON.stringify(d) : t.content};
  });
}
function setupOf(s){ return {mode:s.mode, principle:s.principle, exercise:s.exercise, arena:s.arena, detail:s.detail, form:s.form}; }

const ERR = {
  rate_limited:"Claude is busy or your API limit was reached. Wait a moment, then press Retry.",
  bad_api_key:"The server's Claude API key was rejected. Check ANTHROPIC_API_KEY in Vercel.",
  not_configured:"The coach isn't set up on the server yet.",
  invalid_json:"The reply came back garbled. Press Retry.",
  network:"You seem to be offline. Check your connection, then press Retry.",
  upstream_error:"Connection hiccup. Press Retry."
};

async function sendUser(text, opts = {}){
  const s = state.current; if (!s || state.busy) return;
  text = String(text).trim(); if (!text) return;
  stopSpeaking();
  input.value = ""; autosize();
  s.turns.push(opts.hidden ? {role:"user", content:text, hidden:true} : {role:"user", content:text});
  if (!opts.hidden) $("#thread").append(el("div", {class:"turn me"}, text));
  await callModel();
}

async function callModel(){
  const s = state.current;
  state.busy = true; $("#sendBtn").disabled = true; $("#micBtn").disabled = true; $("#stopBtn").hidden = false;
  const box = el("div", {class:"turn ai"});
  const label = el("span", {}, s.turns.length <= 1 ? "The coach is preparing your session…" : "Thinking…");
  const think = el("div", {class:"thinking"}, el("span", {class:"reels", "aria-hidden":"true"}, el("i"), el("i")), label);
  const live = el("div", {class:"say"});
  box.append(think, live);
  $("#thread").append(box);
  box.scrollIntoView({block:"nearest", behavior:"smooth"});
  const ctl = new AbortController(); state.ctl = ctl;
  let raw = "", prepared = null, preparedText = "";
  const onText = () => {
    const say = partialField(raw, "say");
    if (say && say.text) { label.textContent = /"visual"\s*:\s*\{/.test(raw) ? "Drawing the visual…" : "Writing…"; live.innerHTML = md(say.text); }
    if (!prepared && tts.on && useNatural()) {
      const spk = partialField(raw, "speak");
      if (spk && spk.done && spk.text.trim()) { preparedText = spk.text; prepared = fetchVoice(spk.text); prepared.catch(() => {}); }
    }
  };
  let data = null;
  try {
    const r = await api("/api/coach", {setup: setupOf(s), about: state.about, messages: historyForModel(s)}, {signal: ctl.signal});
    if (!r.ok) throw await errorFrom(r);
    const reader = r.body.getReader(); const dec = new TextDecoder();
    for (;;) { const {value, done} = await reader.read(); if (done) break; raw += dec.decode(value, {stream:true}); onText(); }
    const cut = raw.indexOf("\u0000ERROR:");
    if (cut >= 0) { const code = raw.slice(cut + 7).trim(); throw {code: /overloaded|rate/.test(code) ? "rate_limited" : "upstream_error"}; }
    data = parseLoose(raw);
    if (!data || typeof data !== "object" || typeof data.say !== "string") throw {code:"invalid_json"};
    if (s !== state.current) return;
    s.turns.push({role:"assistant", content: JSON.stringify(trimForStore(data))});
    if (data.feedback && typeof data.feedback.score === "number") s.scores.push({p:(data.principles || [])[0] || (s.principle !== "mix" ? s.principle : "contrast"), s:Math.max(0, Math.min(5, Math.round(data.feedback.score))), t:Date.now()});
    for (const p of data.principles || []) if (PMAP[p] && !s.seen.includes(p)) s.seen.push(p);
    s.updatedAt = Date.now();
    box.replaceWith(renderAI(data));
    saveSession(s);
  } catch (e) {
    think.remove();
    if (e && (e.code === "cancelled" || ctl.signal.aborted)) { if (!live.textContent) box.remove(); else box.append(el("div", {class:"errline"}, "Stopped.")); }
    else if (e && e.code === "unauthorized") { box.remove(); }
    else {
      const msg = (e && e.code === "not_configured" && e.message) || ERR[e?.code] || e?.message || ERR.upstream_error;
      box.append(el("div", {class:"errline"}, msg), el("div", {class:"turn-actions"}, el("button", {class:"btn small", type:"button", onclick:() => { box.remove(); callModel(); }}, "Retry")));
    }
  } finally {
    if (state.ctl === ctl) state.ctl = null;
    state.busy = false; $("#sendBtn").disabled = false; $("#micBtn").disabled = false;
    if (!document.body.classList.contains("speaking")) $("#stopBtn").hidden = true;
  }
  if (data && s === state.current) {
    const words = data.speak || data.say;
    await speak(words, preparedText && preparedText === data.speak ? prepared : null);
    // Hands-free: when the coach finishes talking, start listening for the reply.
    if (handsFree() && state.current === s && !state.busy && !(data.done && data.expects === "none")) startListening();
  }
}
function trimForStore(d){
  const c = JSON.parse(JSON.stringify(d));
  if (c.visual && c.visual.svg && c.visual.svg.length > 14000) c.visual.svg = "";
  return c;
}

/* ---------------- Persistence (this device) ---------------- */
function serial(s){
  return {kind:"session", id:s.id, mode:s.mode, title:s.title, principle:s.principle || "mix", exercise:s.exercise || null, arena:s.arena || null, detail:s.detail || "", form:s.form || null, turns:s.turns.slice(-40), scores:s.scores.slice(-80), seen:s.seen, createdAt:s.createdAt, updatedAt:s.updatedAt};
}
function persist(){
  let list = state.sessions.slice(0, 40);
  // If storage is full, drop the oldest sessions until it fits.
  while (list.length && !ls.set("ic.sessions", list)) list = list.slice(0, -1);
  if (list.length < state.sessions.length) { state.sessions = list; flash("Storage on this device was full, so the oldest sessions were removed."); }
}
function saveSession(s){
  const doc = serial(s);
  const i = state.sessions.findIndex(x => x.id === doc.id);
  if (i >= 0) state.sessions[i] = doc; else state.sessions.unshift(doc);
  state.sessions.sort((a,b) => b.updatedAt - a.updatedAt);
  persist();
}
function deleteSession(id){ state.sessions = state.sessions.filter(x => x.id !== id); persist(); renderProgress(); }
$("#about").value = state.about;
$("#saveAbout").onclick = () => { state.about = $("#about").value.trim(); ls.set("ic.about", state.about); $("#aboutSaved").textContent = "Saved"; setTimeout(() => $("#aboutSaved").textContent = "", 2000); };

/* ---------------- Progress ---------------- */
function renderProgress(){
  const all = state.sessions;
  const scores = all.flatMap(s => s.scores || []);
  const avg = scores.length ? (scores.reduce((a,b) => a + b.s, 0) / scores.length) : null;
  const st = $("#stats"); st.textContent = "";
  st.append(
    el("div", {class:"stat"}, el("b", {}, String(all.length)), el("span", {}, "sessions")),
    el("div", {class:"stat"}, el("b", {}, String(scores.length)), el("span", {}, "scored reps")),
    el("div", {class:"stat"}, el("b", {}, avg == null ? "–" : avg.toFixed(1)), el("span", {}, "average score out of 5"))
  );
  const bars = $("#bars"); bars.textContent = "";
  const per = {};
  for (const p of P) if (p.id !== "mix") per[p.id] = {n:0, sum:0};
  for (const sc of scores) if (per[sc.p]) { per[sc.p].n++; per[sc.p].sum += sc.s; }
  bars.append(el("div", {class:"bar", style:"font-size:12px"}, el("span", {class:"label"}, "Principle"), el("span", {class:"label"}, "Average score"), el("span", {class:"label", style:"text-align:right"}, "Reps · avg")));
  for (const p of P) {
    if (p.id === "mix") continue;
    const d = per[p.id]; const a = d.n ? d.sum / d.n : 0;
    bars.append(el("div", {class:"bar", style:`--pc:var(--p-${p.id})`}, el("span", {}, p.name.replace(" & Consistency", "")), el("div", {class:"track"}, el("div", {class:"fill", style:`width:${(a / 5 * 100).toFixed(0)}%`})), el("span", {class:"num"}, d.n ? `${d.n} · ${a.toFixed(1)}` : "not yet")));
  }
  const weakest = Object.entries(per).sort((a,b) => (a[1].n ? a[1].sum / a[1].n : -1) - (b[1].n ? b[1].sum / b[1].n : -1))[0]?.[0] || "reciprocation";
  $("#practiceWeak").textContent = `Practice ${PMAP[weakest].name}`;
  $("#practiceWeak").onclick = () => { state.principle = weakest; state.exercise = "craft"; renderLearn(); location.hash = "learn"; };
  $("#storeNote").textContent = "Saved on this device";
  const h = $("#hist"); h.textContent = "";
  if (!all.length) h.append(el("div", {class:"empty"}, "Your sessions will appear here. Start one from Learn or Simulate; each one is saved as you go, so you can pick it back up."));
  for (const s of all.slice(0, 40)) {
    const n = (s.scores || []).length; const sa = n ? (s.scores.reduce((a,b) => a + b.s, 0) / n).toFixed(1) : null;
    const del = el("button", {class:"linkbtn", type:"button", "aria-label":"Delete session"}, "Delete");
    del.onclick = () => { if (del.dataset.armed) deleteSession(s.id); else { del.dataset.armed = "1"; del.textContent = "Confirm delete"; setTimeout(() => { del.textContent = "Delete"; delete del.dataset.armed; }, 3000); } };
    h.append(el("div", {class:"hrow"},
      el("div", {class:"t"}, el("b", {}, s.title || "Session"), el("span", {}, `${s.mode === "simulate" ? "Simulate" : "Learn"} · ${new Date(s.updatedAt).toLocaleDateString(undefined, {month:"short", day:"numeric"})}${sa ? ` · ${sa}/5 over ${n}` : ""}`)),
      el("button", {class:"btn ghost small", type:"button", onclick:() => resumeSession(s)}, "Resume"), del));
  }
}


/* ---------------- Boot ---------------- */
const savedLearn = ls.get("ic.learn", null);
if (savedLearn) { if (PMAP[savedLearn.p]) state.principle = savedLearn.p; if (EX.some(x => x.id === savedLearn.e)) state.exercise = savedLearn.e; if (ARMAP[savedLearn.a]) state.arena = savedLearn.a; }
renderLearn(); setupSim(); initVoiceSettings(); route();
$("#startLearn").onclick = () => startSession({mode:"learn", principle:state.principle, exercise:state.exercise, arena:state.arena, detail:$("#learnDetail").value.trim()}, "Start the session.");
if (state.key) {
  api("/api/check", {}).then(async r => { if (r.ok) { state.svc = await r.json(); applyServiceNotes(); } }).catch(() => {});
}
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

})();
