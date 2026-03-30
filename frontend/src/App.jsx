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

const sections = [
  {
    title: "Sender Details",
    description: "Tell the assistant who the email is coming from.",
    fields: [
      {
        name: "sender_name",
        label: "Sender Name",
        required: true,
        placeholder: "Example: Keshav Sharma",
        helperText: "This will be used in the email introduction and signature.",
      },
      {
        name: "sender_company",
        label: "Sender Company",
        required: false,
        placeholder: "Example: ReachForge Labs",
        helperText: "Optional, but useful for credibility and context.",
      },
    ],
  },
  {
    title: "Recipient Details",
    description: "Add the contact details for the person receiving the outreach.",
    fields: [
      {
        name: "recipient_name",
        label: "Recipient Name",
        required: true,
        placeholder: "Example: Sarah Chen",
        helperText: "Use the recipient's real name for a more professional email.",
      },
      {
        name: "recipient_email",
        label: "Recipient Email",
        required: true,
        type: "email",
        placeholder: "Example: sarah@northstar.com",
        helperText: "This is the address Gmail will use when sending the message.",
      },
      {
        name: "recipient_company",
        label: "Recipient Company",
        required: false,
        placeholder: "Example: Northstar Ventures",
        helperText: "Optional context that helps the draft feel more specific.",
      },
    ],
  },
  {
    title: "Outreach Details",
    description: "Describe the reason for the email and the value you want to communicate.",
    fields: [
      {
        name: "topic",
        label: "Topic",
        required: true,
        placeholder: "Example: Strategic partnership for outbound growth",
        helperText: "Keep this focused on the main purpose of the outreach.",
      },
      {
        name: "value_proposition",
        label: "Value Proposition",
        required: true,
        multiline: true,
        rows: 3,
        placeholder:
          "Example: We help GTM teams improve qualified response rates through personalized outbound systems and better campaign intelligence.",
        helperText: "Explain clearly what you offer and why it matters to the recipient.",
      },
      {
        name: "personalization",
        label: "Personalization",
        required: false,
        multiline: true,
        rows: 2,
        placeholder:
          "Example: I noticed your team is expanding into enterprise accounts and recently launched a new partnerships initiative.",
        helperText: "Optional recipient-specific context that makes the message more relevant.",
      },
      {
        name: "call_to_action",
        label: "Call To Action",
        required: false,
        multiline: true,
        rows: 2,
        placeholder: "Example: Would you be open to a 20-minute conversation next week to explore fit?",
        helperText: "Optional, but recommended so the email ends with a clear next step.",
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

  const requiredFields = useMemo(
    () => ["sender_name", "recipient_name", "recipient_email", "topic", "value_proposition"],
    [],
  );

  const isGenerateDisabled = requiredFields.some((field) => !form[field].trim()) || loadingGenerate;
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

  function validateForm() {
    const nextErrors = {};

    for (const field of requiredFields) {
      if (!form[field].trim()) {
        nextErrors[field] = "This field is required.";
      }
    }

    if (form.recipient_email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.recipient_email.trim())) {
      nextErrors.recipient_email = "Enter a valid email address.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function generateEmail() {
    resetMessages();

    if (!validateForm()) {
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

  return (
    <main className="min-h-screen px-4 py-5 font-body text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Outreach Assistant
              </p>
              <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">
                Create polished outreach emails with a workflow designed for thoughtful professional communication.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
                Add the sender context, recipient details, and your value proposition. The assistant will generate a
                professional draft you can edit before sending through Gmail.
              </p>
            </div>
            <div className="rounded-[24px] border border-ink/10 bg-slate-900 px-4 py-3 text-sm text-white/80">
              Generate on the left, review instantly on the right
            </div>
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_0.92fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-soft backdrop-blur md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink">Outreach Brief</h2>
                <p className="mt-1 text-sm leading-6 text-ink/65">
                  Complete the core details once, then generate and edit the final email without leaving the page.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
                {successMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {sections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="mb-4">
                    <h3 className="font-display text-xl text-ink">{section.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-ink/60">{section.description}</p>
                  </div>

                  <div className="grid gap-4">
                    {section.fields.map((field) => (
                      <Field
                        key={field.name}
                        field={field}
                        value={form[field.name]}
                        error={fieldErrors[field.name]}
                        onChange={updateField}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateEmail}
                disabled={isGenerateDisabled}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loadingGenerate ? <Spinner label="Generating Email" /> : "Generate Email"}
              </button>
              <p className="self-center text-sm text-ink/60">
                Required fields must be completed before generating.
              </p>
            </div>
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-soft md:p-6 lg:sticky lg:top-5">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Email Preview</p>
              <h2 className="mt-2 font-display text-2xl leading-tight">Review the generated draft before sending.</h2>
            </div>

            <div className="space-y-5">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <label className="mb-2 block text-sm font-medium text-white/75">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="The generated subject line will appear here"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
                />
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <label className="mb-2 block text-sm font-medium text-white/75">Body</label>
                <textarea
                  value={bodyText}
                  onChange={(event) => setBodyText(event.target.value)}
                  placeholder="The generated email body will appear here"
                  rows={12}
                  className="w-full rounded-[22px] border border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
                />
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/68">
                The first send may open Gmail OAuth in your browser. After authorization, the backend reuses
                `token.json` for future sends.
              </div>

              <button
                type="button"
                onClick={sendEmail}
                disabled={isSendDisabled}
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/60"
              >
                {loadingSend ? <Spinner label="Sending Email" /> : "Send Email"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ field, value, onChange, error }) {
  const wrapperClass = field.multiline ? "md:col-span-2" : "";

  return (
    <div className={wrapperClass}>
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
          {field.label}
          {field.required ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600">
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
            className={`w-full rounded-[22px] border px-4 py-3 text-sm leading-6 text-ink outline-none transition ${
              error
                ? "border-red-300 bg-red-50/60 focus:border-red-400"
                : "border-slate-200 bg-slate-50/80 focus:border-slate-400"
            }`}
          />
        ) : (
          <input
            type={field.type || "text"}
            name={field.name}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            className={`w-full rounded-[22px] border px-4 py-3 text-sm text-ink outline-none transition ${
              error
                ? "border-red-300 bg-red-50/60 focus:border-red-400"
                : "border-slate-200 bg-slate-50/80 focus:border-slate-400"
            }`}
          />
        )}
      </label>

      <p className={`mt-2 text-xs leading-5 ${error ? "text-red-600" : "text-ink/55"}`}>
        {error || field.helperText}
      </p>
    </div>
  );
}

function Spinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      {label}...
    </span>
  );
}

export default App;
