from __future__ import annotations

import base64
import json
import os
import re
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

from agents import Agent, Runner
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
CREDENTIALS_FILE = Path("credentials.json")
TOKEN_FILE = Path("token.json")


class OutreachEmail(BaseModel):
    subject: str = Field(min_length=5, max_length=90)
    body_text: str = Field(min_length=80)


class OutreachRequest(BaseModel):
    sender_name: str = Field(min_length=1)
    sender_company: str | None = None
    recipient_name: str = Field(min_length=1)
    recipient_email: str = Field(min_length=3)
    recipient_company: str | None = None
    topic: str = Field(min_length=3)
    value_proposition: str = Field(min_length=10)
    personalization: str | None = None
    call_to_action: str | None = None


class SendEmailRequest(BaseModel):
    recipient_email: str = Field(min_length=3)
    subject: str = Field(min_length=1, max_length=120)
    body_text: str = Field(min_length=1)


class SendEmailResponse(BaseModel):
    status: str
    message_id: str


def validate_email_address(value: str, field_name: str) -> str:
    candidate = value.strip()
    if not EMAIL_PATTERN.match(candidate):
        raise ValueError(f"{field_name} must be a valid email address.")
    return candidate


def ensure_openai_config() -> str:
    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not openai_api_key:
        raise ValueError("Missing required environment variable: OPENAI_API_KEY")
    return os.getenv("OPENAI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL


def build_agent(model: str) -> Agent[Any]:
    instructions = """
You are an experienced business communication specialist and senior business development professional.

Write an outreach email that feels considered, credible, detailed, and professionally persuasive. The email should sound like it was written by a thoughtful human professional, not by an automated sales system.

Use this structure:
1. Introduction: who the sender is and relevant context
2. Purpose of the outreach
3. Detailed explanation of the value or opportunity being offered
4. Why the recipient should seriously consider it
5. Invitation to continue the conversation
6. Clear and polite call to action
7. Professional closing

Quality standards:
- The tone must be formal, polished, and respectful.
- The writing must feel natural and human, not robotic.
- Make the email informative and persuasive without sounding exaggerated.
- Expand the value proposition clearly so the recipient understands both the opportunity and its practical relevance.
- Show why the message matters specifically to the recipient whenever input details support that.
- If personalization is limited, stay professional and specific without inventing facts.

Hard constraints:
- The body must be between 180 and 250 words.
- Avoid generic filler phrases such as "I hope you are doing well", "I wanted to reach out", or vague corporate jargon.
- Do not use markdown, bullet points, emojis, or slogans.
- The subject line should be strong, professional, and specific.
- End with a professional closing and sign off appropriately using the sender name and sender company when available.
- Return valid structured output only.
""".strip()

    return Agent(
        name="Professional Outreach Agent",
        instructions=instructions,
        output_type=OutreachEmail,
        model=model,
    )


def build_generation_prompt(request: OutreachRequest) -> str:
    return (
        "Write one detailed professional outreach email from the following JSON.\n"
        "The result should read like it was written by an experienced business professional.\n"
        "Keep the body between 180 and 250 words.\n"
        "Make the message informative, polished, persuasive, and easy to follow.\n"
        "Use clear paragraph structure and ensure the opportunity and recipient benefit are properly explained.\n"
        "The subject line should be strong, specific, and professional.\n"
        "If personalization is limited, do not fake familiarity or invent details.\n\n"
        f"{json.dumps(request.model_dump(), indent=2)}"
    )


def generate_email(request: OutreachRequest, model: str | None = None) -> OutreachEmail:
    selected_model = model or ensure_openai_config()
    request.recipient_email = validate_email_address(request.recipient_email, "recipient_email")

    agent = build_agent(selected_model)
    result = Runner.run_sync(agent, build_generation_prompt(request))
    draft = result.final_output

    if not isinstance(draft, OutreachEmail):
        raise RuntimeError("The agent did not return a valid outreach email.")

    return draft


def authenticate_gmail(
    credentials_path: Path = CREDENTIALS_FILE,
    token_path: Path = TOKEN_FILE,
):
    if not credentials_path.exists():
        raise FileNotFoundError(
            f"Missing {credentials_path}. Download the OAuth desktop app credentials from Google Cloud and place the file next to this script."
        )

    creds: Credentials | None = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            creds = flow.run_local_server(port=0)

        token_path.write_text(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def create_gmail_message(recipient_email: str, subject: str, message_body: str) -> dict[str, str]:
    message = MIMEText(message_body, "plain", "utf-8")
    message["to"] = validate_email_address(recipient_email, "recipient_email")
    message["subject"] = subject

    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    return {"raw": encoded_message}


def send_email(recipient_email: str, subject: str, message_body: str) -> str:
    service = authenticate_gmail()
    gmail_message = create_gmail_message(recipient_email, subject, message_body)

    try:
        response = (
            service.users()
            .messages()
            .send(userId="me", body=gmail_message)
            .execute()
        )
    except HttpError as exc:
        raise RuntimeError(f"Gmail API failed to send the email: {exc}") from exc

    return response["id"]


app = FastAPI(
    title="Outreach Agent API",
    description="Generate personalized outreach emails with OpenAI and send them with the Gmail API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "ok", "message": "Outreach Agent API is running."}


@app.post("/generate-email", response_model=OutreachEmail)
def generate_email_endpoint(request: OutreachRequest) -> OutreachEmail:
    try:
        return generate_email(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/send-email", response_model=SendEmailResponse)
def send_email_endpoint(request: SendEmailRequest) -> SendEmailResponse:
    try:
        message_id = send_email(
            recipient_email=request.recipient_email,
            subject=request.subject,
            message_body=request.body_text,
        )
        return SendEmailResponse(status="success", message_id=message_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
