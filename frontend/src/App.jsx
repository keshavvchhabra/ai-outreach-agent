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
    subtitle: "Tell us who the message is coming from.",
    fields: [
      {
        name: "sender_name",
        label: "Sender Name",
        required: true,
        placeholder: "Example: Keshav Sharma",
        helperText: "Used in the opening context and final signature.",
      },
      {
        name: "sender_company",
        label: "Sender Company",
        required: false,
        placeholder: "Example: ReachForge Labs",
        helperText: "Optional, but adds credibility and professional context.",
      },
    ],
  },
  {
    id: 2,
    title: "Recipient Details",
    subtitle: "Add the contact information for your recipient.",
    fields: [
      {
        name: "recipient_name",
        label: "Recipient Name",
        required: true,
        placeholder: "Example: Sarah Chen",
        helperText: "Use the recipient's real name for a more personal tone.",
      },
      {
        name: "recipient_email",
        label: "Recipient Email",
        required: true,
        type: "email",
        placeholder: "Example: sarah@northstar.com",
        helperText: "This is where the final email will be sent through Gmail.",
      },
      {
        name: "recipient_company",
        label: "Recipient Company",
        required: false,
        placeholder: "Example: Northstar Ventures",
        helperText: "Useful for tailoring the email to the recipient's context.",
      },
    ],
  },
  {
    id: 3,
    title: "Outreach Details",
    subtitle: "Define the reason, value, and next step for the message.",
    fields: [
      {
        name: "topic",
        label: "Topic",
        required: true,
        placeholder: "Example: Strategic partnership for outbound growth",
        helperText: "Summarize the main purpose of the outreach clearly.",
      },
      {
        name: "value_proposition",
        label: "Value Proposition",
        required: true,
        multiline: true,
        rows: 4,
        placeholder:
          "Example: We help revenue teams improve qualified response rates through stronger outbound positioning, sharper messaging, and more relevant targeting.",
        helperText: "Explain the value in a way that is concrete and useful to the recipient.",
      },
      {
        name: "personalization",
        label: "Personalization",
        required: false,
        multiline: true,
        rows: 3,
        placeholder:
          "Example: I noticed your team is expanding into enterprise accounts and recently launched a partnerships initiative.",
        helperText: "Optional context that makes the draft more specific and credible.",
      },
      {
        name: "call_to_action",
        label: "Call To Action",
        required: false,
        multiline: true,
        rows: 3,
        placeholder: "Example: Would you be open to a 20-minute conversation next week to explore fit?",
        helperText: "A clear next step helps the email end with purpose.",
      },
    ],
  },
];

function App() {
  const [form, setForm] = useState(initialForm);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const currentStepConfig = steps.find((step) => step.id === currentStep) || steps[0];

  const allRequiredFields = useMemo(
    () => ["sender_name", "recipient_name", "recipient_email", "topic", "value_proposition"],
    [],
  );

  const isSendDisabled =
    !subject.trim() || !bodyText.trim() || !form.recipient_email.trim() || loadingSend || loadingGenerate;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function resetMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function validateEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
  }

  function validateStep(stepId) {
    const stepConfig = steps.find((step) => step.id === stepId);
    if (!stepConfig) {
      return true;
    }

    const nextErrors = {};

    for (const field of stepConfig.fields) {
      if (field.required && !form[field.name].trim()) {
        nextErrors[field.name] = "This field is required.";
      }

      if (field.name === "recipient_email" && form.recipient_email.trim() && !validateEmail(form.recipient_email)) {
        nextErrors.recipient_email = "Enter a valid email address.";
      }
    }

    setFieldErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function validateAll() {
    const nextErrors = {};

    for (const field of allRequiredFields) {
      if (!form[field].trim()) {
        nextErrors[field] = "This field is required.";
      }
    }

    if (form.recipient_email.trim() && !validateEmail(form.recipient_email)) {
      nextErrors.recipient_email = "Enter a valid email address.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToNextStep() {
    resetMessages();
    if (!validateStep(currentStep)) {
      setErrorMessage("Please complete the required fields in this step before continuing.");
      return;
    }

    setCurrentStep((value) => Math.min(value + 1, steps.length));
  }

  function goToPreviousStep() {
    resetMessages();
    setCurrentStep((value) => Math.max(value - 1, 1));
  }

  async function generateEmail() {
    resetMessages();

    if (!validateAll()) {
      setErrorMessage("Please complete the required fields before generating the email.");
      return;
    }

    setLoadingGenerate(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate email.");
      }

      setSubject(data.subject);
      setBodyText(data.body_text);
      setSuccessMessage("Email draft generated successfully. Review and refine it before sending.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function sendEmail() {
    resetMessages();

    if (!subject.trim() || !bodyText.trim()) {
      setErrorMessage("Generate the email first, then review the subject and body before sending.");
      return;
    }

    setLoadingSend(true);

    try {
      const response = await fetch(`${API_BASE_URL}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_email: form.recipient_email,
          subject,
          body_text: bodyText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to send email.");
      }

      setSuccessMessage(`Email sent successfully. Message ID: ${data.message_id}`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingSend(false);
    }
  }

  const stepComplete = currentStepConfig.fields
    .filter((field) => field.required)
    .every((field) => form[field.name].trim());

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.22),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(96,165,250,0.18),_transparent_22%),linear-gradient(180deg,#eef2ff_0%,#f8fafc_45%,#eef2ff_100%)] px-4 py-8 font-body text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-tight text-slate-900 md:text-5xl">
            Create Outreach Email
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Build a polished outreach message in a guided flow, then review and send it through your connected Gmail account.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(79,70,229,0.12)] backdrop-blur xl:p-8">
            <StepIndicator currentStep={currentStep} steps={steps} />

            <div className="mt-8 rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm md:p-7">
              <FormStepHeader step={currentStepConfig} />

              <div className="mt-6 grid gap-5 md:grid-cols-2">
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

              {(errorMessage || successMessage) && (
                <div className="mt-6 space-y-3">
                  {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}
                  {successMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1 || loadingGenerate || loadingSend}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <span className="text-sm text-slate-500">
                    {stepComplete ? "Step complete" : "Complete required fields to continue"}
                  </span>

                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!stepComplete || loadingGenerate || loadingSend}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(79,70,229,0.25)] transition hover:from-indigo-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                    >
                      Next Step
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={generateEmail}
                        disabled={loadingGenerate || loadingSend}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(79,70,229,0.25)] transition hover:from-indigo-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                      >
                        {loadingGenerate ? <Spinner label="Generating" /> : "Generate Email"}
                      </button>
                      <button
                        type="button"
                        onClick={sendEmail}
                        disabled={isSendDisabled}
                        className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {loadingSend ? <Spinner label="Sending" dark /> : "Send Email"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[36px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(79,70,229,0.12)] backdrop-blur xl:p-8">
            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/70">
                Email Preview
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight">
                Review and refine the final draft.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Your generated subject and body will appear here. You can edit both before sending.
              </p>

              <div className="mt-6 space-y-5">
                <PreviewField
                  label="Subject"
                  value={subject}
                  placeholder="The generated subject line will appear here"
                  onChange={setSubject}
                />
                <PreviewTextArea
                  label="Body"
                  value={bodyText}
                  placeholder="The generated email body will appear here"
                  onChange={setBodyText}
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/68">
                Gmail OAuth may open in your browser the first time you send. After that, the app will reuse your saved token.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StepIndicator({ currentStep, steps }) {
  return (
    <div className="rounded-[28px] bg-slate-100/80 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => {
          const isCurrent = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <div
              key={step.id}
              className={`rounded-[22px] px-4 py-4 transition-all duration-300 ${
                isCurrent
                  ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)]"
                  : isComplete
                    ? "bg-white text-slate-900"
                    : "bg-transparent text-slate-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent
                      ? "bg-white/20 text-white"
                      : isComplete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white text-slate-400"
                  }`}
                >
                  {step.id}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                    Step {step.id}
                  </p>
                  <p className="text-sm font-semibold">{step.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormStepHeader({ step }) {
  return (
    <div className="text-center md:text-left">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-500">Step {step.id}</p>
      <h2 className="mt-2 font-display text-3xl text-slate-900">{step.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{step.subtitle}</p>
    </div>
  );
}

function FormField({ field, value, error, onChange }) {
  const wrapperClass = field.multiline ? "md:col-span-2" : "";
  const baseClass = `w-full rounded-3xl border px-4 py-3.5 text-sm text-slate-900 outline-none transition ${
    error
      ? "border-red-300 bg-red-50/80 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
  }`;

  return (
    <div className={wrapperClass}>
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
          {field.label}
          {field.required ? (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              Required
            </span>
          ) : null}
        </span>

        {field.multiline ? (
          <textarea
            name={field.name}
            value={value}
            onChange={onChange}
            rows={field.rows || 4}
            placeholder={field.placeholder}
            className={`${baseClass} leading-6`}
          />
        ) : (
          <input
            type={field.type || "text"}
            name={field.name}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            className={baseClass}
          />
        )}
      </label>

      <p className={`mt-2 text-xs leading-5 ${error ? "text-red-600" : "text-slate-500"}`}>
        {error || field.helperText}
      </p>
    </div>
  );
}

function PreviewField({ label, value, placeholder, onChange }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <label className="mb-2 block text-sm font-medium text-white/75">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

function PreviewTextArea({ label, value, placeholder, onChange }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <label className="mb-2 block text-sm font-medium text-white/75">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={14}
        className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

function Spinner({ label, dark = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-4 w-4 animate-spin rounded-full border-2 ${
          dark ? "border-slate-400/40 border-t-slate-700" : "border-white/35 border-t-white"
        }`}
      />
      {label}...
    </span>
  );
}

export default App;
