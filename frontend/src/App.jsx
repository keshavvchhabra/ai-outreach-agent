import { useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const initialForm = {
  sender_name: "",
  sender_company: "",
  recipient_name: "",
  recipient_email: "",
  recipient_company: "",
  topic: "",
  value_proposition: "",
  personalization: "",
  call_to_action: "",
};

const steps = [
  {
    id: 1,
    title: "Sender Details",
    label: "Your Profile",
    subtitle: "Tell ReachForge who the message is coming from.",
    fields: [
      { name: "sender_name", label: "Sender Name", required: true, placeholder: "e.g. Keshav Sharma", helperText: "Used in opening context and signature." },
      { name: "sender_company", label: "Sender Company", required: false, placeholder: "e.g. ReachForge Labs", helperText: "Adds credibility and context." },
    ],
  },
  {
    id: 2,
    title: "Recipient Details",
    label: "Recipient Info",
    subtitle: "Add the person and company you are contacting.",
    fields: [
      { name: "recipient_name", label: "Recipient Name", required: true, placeholder: "e.g. Sarah Chen", helperText: "Use their real name for a personal tone." },
      { name: "recipient_email", label: "Recipient Email", required: true, type: "email", placeholder: "e.g. sarah@northstar.com", helperText: "Email will be sent here via Gmail." },
      { name: "recipient_company", label: "Recipient Company", required: false, placeholder: "e.g. Northstar Ventures", helperText: "Helps tailor the message." },
    ],
  },
  {
    id: 3,
    title: "Outreach Details",
    label: "Message",
    subtitle: "Define the topic, value, personalization, and CTA.",
    fields: [
      { name: "topic", label: "Topic", required: true, placeholder: "e.g. Strategic partnership for outbound growth", helperText: "The main purpose of the outreach." },
      { name: "value_proposition", label: "Value Proposition", required: true, multiline: true, rows: 2, placeholder: "e.g. We help revenue teams improve qualified response rates through stronger outbound positioning.", helperText: "Concrete and useful to the recipient." },
      { name: "personalization", label: "Personalization", required: false, multiline: true, rows: 2, placeholder: "e.g. I noticed your team is expanding into enterprise accounts.", helperText: "Makes the draft more specific and credible." },
      { name: "call_to_action", label: "Call To Action", required: false, multiline: true, rows: 2, placeholder: "e.g. Would you be open to a 20-minute conversation next week?", helperText: "A clear next step ends the email with purpose." },
    ],
  },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f1117;
    --surface: #181c27;
    --surface2: #1e2333;
    --surface3: #232840;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(255,255,255,0.13);
    --accent: #6366f1;
    --accent2: #818cf8;
    --accent-glow: rgba(99,102,241,0.22);
    --text: #f0f2f8;
    --text-muted: #8b90a8;
    --text-dim: #555c78;
    --success: #34d399;
    --danger: #f87171;
    --preview-bg: #0d1020;
    --gold: #f59e0b;
  }

  html, body, #root {
    height: 100%;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
  }

  /* ── SHELL ─────────────────────────────────── */
  .rf-shell {
    height: 100vh;
    display: grid;
    grid-template-rows: 52px 1fr;
    overflow: hidden;
  }

  /* ── TOPBAR ─────────────────────────────────── */
  .rf-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    border-bottom: 1px solid var(--border);
    background: rgba(15,17,23,0.95);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
    z-index: 10;
  }
  .rf-logo {
    font-family: 'Sora', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rf-logo-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px rgba(99,102,241,0.8);
  }
  .rf-topbar-right { font-size: 12px; color: var(--text-dim); }

  /* ── MAIN GRID ─────────────────────────────── */
  .rf-main {
    display: grid;
    grid-template-columns: 1fr 360px;
    overflow: hidden;
    height: 100%;
  }

  /* ── LEFT PANEL ────────────────────────────── */
  .rf-left {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 18px 28px;
    gap: 14px;
    border-right: 1px solid var(--border);
  }

  /* ── AI AUTOFILL BAR ───────────────────────── */
  .rf-autofill-bar {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: var(--surface);
    border: 1px solid rgba(245,158,11,0.18);
    border-radius: 12px;
    padding: 11px 14px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  .rf-autofill-bar::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(245,158,11,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .rf-autofill-inner {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rf-autofill-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .rf-autofill-label-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 6px rgba(245,158,11,0.7);
    flex-shrink: 0;
  }
  .rf-autofill-input {
    background: var(--surface2);
    border: 1px solid rgba(245,158,11,0.15);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    outline: none;
    width: 100%;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .rf-autofill-input::placeholder { color: var(--text-dim); font-weight: 300; font-size: 12.5px; }
  .rf-autofill-input:focus {
    border-color: rgba(245,158,11,0.4);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.07);
  }
  .rf-autofill-hint { font-size: 10.5px; color: var(--text-dim); font-weight: 300; }
  .rf-btn-autofill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 15px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    border: 1px solid rgba(245,158,11,0.35);
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.07));
    color: var(--gold);
    white-space: nowrap;
    transition: all 0.18s;
    flex-shrink: 0;
    line-height: 1;
  }
  .rf-btn-autofill:not(:disabled):hover {
    background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.12));
    border-color: rgba(245,158,11,0.5);
  }
  .rf-btn-autofill:disabled { opacity: 0.38; cursor: not-allowed; }

  /* ── STEP TRACK ────────────────────────────── */
  .rf-step-track {
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 3px;
    flex-shrink: 0;
  }
  .rf-step-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 7px 10px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-dim);
    transition: all 0.22s ease;
    cursor: default;
    user-select: none;
  }
  .rf-step-item.active {
    background: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(129,140,248,0.1));
    color: var(--accent2);
    border: 1px solid rgba(99,102,241,0.28);
  }
  .rf-step-item.done { color: var(--text-muted); }
  .rf-step-num {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 600;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-dim);
    transition: all 0.22s;
    flex-shrink: 0;
    line-height: 1;
  }
  .rf-step-item.active .rf-step-num {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
    box-shadow: 0 0 10px rgba(99,102,241,0.5);
  }
  .rf-step-item.done .rf-step-num {
    background: rgba(52,211,153,0.15);
    border-color: rgba(52,211,153,0.35);
    color: var(--success);
  }
  .rf-step-sep { color: var(--text-dim); font-size: 10px; padding: 0 2px; flex-shrink: 0; }

  /* ── FORM CARD ─────────────────────────────── */
  .rf-form-card {
    flex: 1;
    background: var(--surface);
    border-radius: 16px;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
  .rf-form-head {
    padding: 15px 22px 12px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(160deg, var(--surface2) 0%, var(--surface) 100%);
    flex-shrink: 0;
  }
  .rf-step-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 2px;
  }
  .rf-form-title {
    font-family: 'Sora', sans-serif;
    font-size: 19px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.35px;
  }
  .rf-form-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
    font-weight: 300;
  }

  .rf-form-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 22px;
    scrollbar-width: thin;
    scrollbar-color: var(--surface2) transparent;
    min-height: 0;
  }
  .rf-form-body::-webkit-scrollbar { width: 4px; }
  .rf-form-body::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 4px; }

  .rf-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
  .rf-field-full { grid-column: 1 / -1; }

  /* ── FIELD ─────────────────────────────────── */
  .rf-field { display: flex; flex-direction: column; gap: 4px; }
  .rf-label {
    font-size: 11.5px; font-weight: 500;
    color: var(--text-muted);
    display: flex; align-items: center; gap: 5px;
  }
  .rf-req {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.07em; text-transform: uppercase;
    color: var(--accent2);
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.18);
    padding: 1px 5px; border-radius: 4px; line-height: 1.6;
  }
  .rf-input, .rf-textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 9px 13px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    width: 100%;
  }
  .rf-textarea { resize: none; line-height: 1.6; }
  .rf-input::placeholder, .rf-textarea::placeholder { color: var(--text-dim); font-weight: 300; font-size: 12.5px; }
  .rf-input:focus, .rf-textarea:focus {
    border-color: rgba(99,102,241,0.55);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.09);
  }
  .rf-input.err { border-color: rgba(248,113,113,0.45); background: rgba(248,113,113,0.04); }
  .rf-textarea.err { border-color: rgba(248,113,113,0.45); background: rgba(248,113,113,0.04); }
  .rf-helper { font-size: 11px; color: var(--text-dim); font-weight: 300; }
  .rf-err-text { font-size: 11px; color: var(--danger); }

  /* ── ALERT ─────────────────────────────────── */
  .rf-alert { padding: 9px 13px; border-radius: 9px; font-size: 12px; margin-top: 10px; line-height: 1.5; }
  .rf-alert-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.18); color: #fca5a5; }
  .rf-alert-ok { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.18); color: #6ee7b7; }

  /* ── FORM FOOTER ───────────────────────────── */
  .rf-form-foot {
    padding: 11px 22px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 8px;
    background: var(--surface);
  }
  .rf-foot-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .rf-foot-hint { font-size: 11.5px; color: var(--text-dim); }

  /* ── BUTTONS ───────────────────────────────── */
  .rf-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    font-size: 12.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.18s; cursor: pointer; border: none; outline: none;
    white-space: nowrap; line-height: 1;
  }
  .rf-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .rf-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
  .rf-btn-ghost:not(:disabled):hover { border-color: var(--border-hover); color: var(--text); }
  .rf-btn-primary {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: white;
    box-shadow: 0 4px 14px rgba(99,102,241,0.28);
  }
  .rf-btn-primary:not(:disabled):hover { box-shadow: 0 6px 20px rgba(99,102,241,0.42); transform: translateY(-1px); }
  .rf-btn-success {
    background: rgba(52,211,153,0.09);
    border: 1px solid rgba(52,211,153,0.28);
    color: #34d399;
  }
  .rf-btn-success:not(:disabled):hover { background: rgba(52,211,153,0.16); }

  /* ── SPINNER ───────────────────────────────── */
  .rf-spin {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.18); border-top-color: white;
    animation: rf-spin 0.55s linear infinite; flex-shrink: 0;
  }
  .rf-spin-green { border-color: rgba(52,211,153,0.2); border-top-color: #34d399; }
  .rf-spin-gold { border-color: rgba(245,158,11,0.2); border-top-color: #f59e0b; }
  @keyframes rf-spin { to { transform: rotate(360deg); } }

  /* ── RIGHT PANEL ───────────────────────────── */
  .rf-right {
    display: flex; flex-direction: column;
    background: var(--preview-bg);
    overflow: hidden;
    border-left: 1px solid var(--border);
  }
  .rf-preview-head { padding: 18px 22px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .rf-preview-label {
    font-size: 9.5px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 2px;
  }
  .rf-preview-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); }
  .rf-preview-sub { font-size: 11.5px; color: var(--text-dim); margin-top: 2px; font-weight: 300; }

  .rf-preview-body {
    flex: 1; overflow-y: auto;
    padding: 16px 22px;
    display: flex; flex-direction: column; gap: 12px;
    scrollbar-width: thin; scrollbar-color: var(--surface2) transparent;
  }
  .rf-preview-body::-webkit-scrollbar { width: 4px; }
  .rf-preview-body::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 4px; }

  .rf-prev-field { display: flex; flex-direction: column; gap: 5px; flex: 0 0 auto; }
  .rf-prev-field.grow { flex: 1; display: flex; flex-direction: column; }
  .rf-prev-lbl { font-size: 10px; font-weight: 500; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.09em; }
  .rf-prev-input {
    background: var(--surface); border: 1px solid var(--border); border-radius: 9px;
    padding: 9px 13px; font-size: 12.5px;
    font-family: 'DM Sans', sans-serif; color: var(--text);
    outline: none; width: 100%; transition: border-color 0.18s;
  }
  .rf-prev-ta { resize: none; flex: 1; min-height: 160px; line-height: 1.7; font-size: 12.5px; }
  .rf-prev-input::placeholder, .rf-prev-ta::placeholder { color: var(--text-dim); font-size: 12px; font-weight: 300; }
  .rf-prev-input:focus, .rf-prev-ta:focus { border-color: rgba(99,102,241,0.45); }

  .rf-preview-note {
    margin: 0 22px 16px;
    padding: 9px 13px;
    background: rgba(99,102,241,0.05);
    border: 1px solid rgba(99,102,241,0.1);
    border-radius: 9px;
    font-size: 11px; color: var(--text-dim); line-height: 1.6;
    flex-shrink: 0;
  }

  /* ── RESPONSIVE ────────────────────────────── */
  @media (max-width: 900px) {
    .rf-main { grid-template-columns: 1fr; }
    .rf-right { display: none; }
    .rf-left { padding: 14px 16px; }
    .rf-step-item span { display: none; }
    .rf-autofill-bar { flex-direction: column; align-items: stretch; }
    .rf-btn-autofill { width: 100%; }
  }
`;

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [autofillInput, setAutofillInput] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingAutofill, setLoadingAutofill] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);

  const currentStepConfig = steps.find((s) => s.id === currentStep) || steps[0];
  const allRequiredFields = useMemo(
    () => ["sender_name", "recipient_name", "recipient_email", "topic", "value_proposition"],
    [],
  );
  const isSendDisabled =
    !subject.trim() || !bodyText.trim() || !form.recipient_email.trim() || loadingSend || loadingGenerate;
  const stepComplete = currentStepConfig.fields.filter((f) => f.required).every((f) => form[f.name].trim());

  function resetMessages() { setErrorMessage(""); setSuccessMessage(""); }

  function updateField(e) {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
    setFieldErrors((c) => ({ ...c, [name]: "" }));
  }

  function validateEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()); }

  function validateStep(stepId) {
    const cfg = steps.find((s) => s.id === stepId);
    if (!cfg) return true;
    const errs = {};
    for (const f of cfg.fields) {
      if (f.required && !form[f.name].trim()) errs[f.name] = "Required.";
      if (f.name === "recipient_email" && form.recipient_email.trim() && !validateEmail(form.recipient_email))
        errs.recipient_email = "Enter a valid email.";
    }
    setFieldErrors((c) => ({ ...c, ...errs }));
    return Object.keys(errs).length === 0;
  }

  function validateAll() {
    const errs = {};
    for (const f of allRequiredFields) if (!form[f].trim()) errs[f] = "Required.";
    if (form.recipient_email.trim() && !validateEmail(form.recipient_email))
      errs.recipient_email = "Enter a valid email.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToNextStep() {
    resetMessages();
    if (!validateStep(currentStep)) { setErrorMessage("Complete the required fields before continuing."); return; }
    setCurrentStep((v) => Math.min(v + 1, steps.length));
  }

  function goToPreviousStep() { resetMessages(); setCurrentStep((v) => Math.max(v - 1, 1)); }

  async function handleAutofill() {
    resetMessages();
    if (!autofillInput.trim()) {
      setErrorMessage("Enter a short outreach description before using AI Autofill.");
      return;
    }
    setLoadingAutofill(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: autofillInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to autofill outreach details.");
      setForm((c) => ({
        ...c,
        topic: data.topic || "",
        value_proposition: data.value_proposition || "",
        personalization: data.personalization || "",
        call_to_action: data.cta || "",
      }));
      setCurrentStep(3);
      setSuccessMessage("Outreach details autofilled — review and adjust before generating.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to autofill outreach details.");
    } finally {
      setLoadingAutofill(false);
    }
  }

  async function generateEmail() {
    resetMessages();
    if (!validateAll()) { setErrorMessage("Please complete all required fields."); return; }
    setLoadingGenerate(true);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate email.");
      setSubject(data.subject);
      setBodyText(data.body_text);
      setSuccessMessage("Draft generated — review and refine before sending.");
    } catch (err) { setErrorMessage(err.message); } finally { setLoadingGenerate(false); }
  }

  async function sendEmail() {
    resetMessages();
    if (!subject.trim() || !bodyText.trim()) { setErrorMessage("Generate the email first before sending."); return; }
    setLoadingSend(true);
    try {
      const res = await fetch(`${API_BASE_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_email: form.recipient_email, subject, body_text: bodyText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send email.");
      setSuccessMessage(`Sent! Message ID: ${data.message_id}`);
    } catch (err) { setErrorMessage(err.message); } finally { setLoadingSend(false); }
  }

  return (
    <>
      <style>{css}</style>
      <div className="rf-shell">

        {/* ── Topbar ── */}
        <header className="rf-topbar">
          <div className="rf-logo">
            <div className="rf-logo-dot" />
            <span>ReachForge</span>
          </div>
          <span className="rf-topbar-right">AI-Powered Outreach</span>
        </header>

        <div className="rf-main">

          {/* ── Left Panel ── */}
          <div className="rf-left">

            {/* AI Autofill Bar */}
            <div className="rf-autofill-bar">
              <div className="rf-autofill-inner">
                <div className="rf-autofill-label">
                  <div className="rf-autofill-label-dot" />
                  AI Autofill
                </div>
                <input
                  type="text"
                  className="rf-autofill-input"
                  value={autofillInput}
                  onChange={(e) => setAutofillInput(e.target.value)}
                  placeholder="Describe your outreach in one line, e.g. Offer letter for frontend intern…"
                  onKeyDown={(e) => e.key === "Enter" && !loadingAutofill && handleAutofill()}
                />
                <span className="rf-autofill-hint">
                  Instantly fills Step 3 fields — then jump straight to generating.
                </span>
              </div>
              <button
                className="rf-btn-autofill"
                onClick={handleAutofill}
                disabled={loadingAutofill || loadingGenerate || loadingSend}
              >
                {loadingAutofill
                  ? <><div className="rf-spin rf-spin-gold" /> Autofilling…</>
                  : "✨ Autofill"}
              </button>
            </div>

            {/* Step Track */}
            <div className="rf-step-track">
              {steps.map((step, i) => (
                <StepItem
                  key={step.id}
                  step={step}
                  currentStep={currentStep}
                  isLast={i === steps.length - 1}
                />
              ))}
            </div>

            {/* Form Card */}
            <div className="rf-form-card">
              <div className="rf-form-head">
                <div className="rf-step-label">Step {currentStep} of {steps.length}</div>
                <div className="rf-form-title">{currentStepConfig.title}</div>
                <div className="rf-form-sub">{currentStepConfig.subtitle}</div>
              </div>

              <div className="rf-form-body">
                <div className="rf-fields">
                  {currentStepConfig.fields.map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      value={form[field.name]}
                      error={fieldErrors[field.name]}
                      onChange={updateField}
                    />
                  ))}
                </div>
                {errorMessage && <div className="rf-alert rf-alert-err">{errorMessage}</div>}
                {successMessage && <div className="rf-alert rf-alert-ok">{successMessage}</div>}
              </div>

              <div className="rf-form-foot">
                <button
                  className="rf-btn rf-btn-ghost"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1 || loadingAutofill || loadingGenerate || loadingSend}
                >
                  ← Back
                </button>

                <div className="rf-foot-right">
                  <span className="rf-foot-hint">
                    {stepComplete ? "✓ Ready" : "Fill required fields"}
                  </span>

                  {currentStep < steps.length ? (
                    <button
                      className="rf-btn rf-btn-primary"
                      onClick={goToNextStep}
                      disabled={!stepComplete || loadingAutofill || loadingGenerate || loadingSend}
                    >
                      Next Step →
                    </button>
                  ) : (
                    <>
                      <button
                        className="rf-btn rf-btn-primary"
                        onClick={generateEmail}
                        disabled={loadingAutofill || loadingGenerate || loadingSend}
                      >
                        {loadingGenerate
                          ? <><div className="rf-spin" /> Generating…</>
                          : "✦ Generate Email"}
                      </button>
                      <button
                        className="rf-btn rf-btn-success"
                        onClick={sendEmail}
                        disabled={isSendDisabled}
                      >
                        {loadingSend
                          ? <><div className="rf-spin rf-spin-green" /> Sending…</>
                          : "↑ Send Email"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>{/* /rf-left */}

          {/* ── Right Panel: Preview ── */}
          <div className="rf-right">
            <div className="rf-preview-head">
              <div className="rf-preview-label">Email Preview</div>
              <div className="rf-preview-title">Review & Refine</div>
              <div className="rf-preview-sub">Edit before sending via Gmail.</div>
            </div>

            <div className="rf-preview-body">
              <div className="rf-prev-field">
                <div className="rf-prev-lbl">Subject</div>
                <input
                  className="rf-prev-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line will appear here…"
                />
              </div>

              <div className="rf-prev-field grow">
                <div className="rf-prev-lbl">Body</div>
                <textarea
                  className="rf-prev-input rf-prev-ta"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder={"Your generated email body will appear here.\nGenerate the email first, then review and refine before sending."}
                />
              </div>
            </div>

            <div className="rf-preview-note">
              Gmail OAuth may prompt on first send. After that, your token is reused automatically.
            </div>
          </div>

        </div>{/* /rf-main */}
      </div>
    </>
  );
}

function StepItem({ step, currentStep, isLast }) {
  const isCurrent = step.id === currentStep;
  const isDone = step.id < currentStep;
  const cls = `rf-step-item${isCurrent ? " active" : isDone ? " done" : ""}`;
  return (
    <>
      <div className={cls}>
        <div className="rf-step-num">{isDone ? "✓" : step.id}</div>
        <span>{step.label}</span>
      </div>
      {!isLast && <div className="rf-step-sep">›</div>}
    </>
  );
}

function FormField({ field, value, error, onChange }) {
  const isFullWidth = !!field.multiline;
  const inputCls = `rf-input${error ? " err" : ""}`;
  const taCls = `rf-textarea${error ? " err" : ""}`;
  return (
    <div className={`rf-field${isFullWidth ? " rf-field-full" : ""}`}>
      <label className="rf-label">
        {field.label}
        {field.required && <span className="rf-req">req</span>}
      </label>
      {field.multiline ? (
        <textarea
          name={field.name}
          value={value}
          onChange={onChange}
          rows={field.rows || 3}
          placeholder={field.placeholder}
          className={taCls}
        />
      ) : (
        <input
          type={field.type || "text"}
          name={field.name}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          className={inputCls}
        />
      )}
      {error
        ? <span className="rf-err-text">⚠ {error}</span>
        : <span className="rf-helper">{field.helperText}</span>
      }
    </div>
  );
}

// this is app.jsx