import os
import re
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
LLM_PROVIDER = "anthropic"
LLM_MODEL = "claude-sonnet-4-6"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("negotio")


# ----------------------------- Utilities ---------------------------------

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_json(text: str):
    """Extract and parse the first JSON object from an LLM response."""
    if text is None:
        raise ValueError("empty llm response")
    t = text.strip()
    t = re.sub(r"^```(json)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    # find first balanced object
    start = t.find("{")
    if start == -1:
        raise ValueError("no json object found")
    depth = 0
    for i in range(start, len(t)):
        if t[i] == "{":
            depth += 1
        elif t[i] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(t[start:i + 1])
    return json.loads(t[start:])


async def llm_json(system_message: str, user_text: str, session_tag: str) -> dict:
    chat = (LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_tag, system_message=system_message)
            .with_model(LLM_PROVIDER, LLM_MODEL))
    resp = await chat.send_message(UserMessage(text=user_text))
    return clean_json(resp)


# ----------------------------- Models -------------------------------------

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


class CreateSessionBody(BaseModel):
    scenario_id: str


class MessageBody(BaseModel):
    content: str


# ----------------------------- Scenarios ----------------------------------

PORTRAITS = {
    "m1": "https://images.unsplash.com/photo-1745060594679-61578eb592f7?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "m2": "https://images.unsplash.com/photo-1767175620484-1ed37931a0d1?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "m3": "https://images.unsplash.com/photo-1633366147060-ce9e1a9fd39c?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "m4": "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "f1": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "f2": "https://images.unsplash.com/photo-1758599543125-0a927f1d7a3b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "f3": "https://images.unsplash.com/photo-1781888681811-332968760c2a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
}

COVERS = {
    "columns": "https://images.unsplash.com/photo-1586073054612-fdd6537fc6d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "monolith": "https://images.unsplash.com/photo-1522743791393-522312deeebf?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "stairs": "https://images.unsplash.com/photo-1520529890308-f503006340b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "arch": "https://images.unsplash.com/photo-1665779736808-047a6bbf43a0?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "lines": "https://images.unsplash.com/photo-1483366774565-c783b9f70e2c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "wall": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "dark": "https://images.unsplash.com/photo-1690983320828-c01b88baacb0?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
}

SCENARIOS = [
    {
        "id": "salary-raise",
        "title": "The Raise You've Earned",
        "category": "Career",
        "difficulty": "Foundational",
        "difficulty_level": 1,
        "duration_min": 8,
        "role": "Senior Product Manager asking for a compensation adjustment",
        "objective": "Secure a base salary increase to at least $165k (from $142k).",
        "situation": "You've shipped two flagship launches this year and outgrew your band. Your manager controls the budget but is under pressure to keep raises modest.",
        "batna": "A competing offer at $170k you'd rather not take.",
        "target_zone": "$160k–$172k plus a one-time equity refresh.",
        "stakes": "Medium",
        "cover": COVERS["lines"],
        "opponent": {
            "name": "David Rourke",
            "title": "VP of Product",
            "avatar": PORTRAITS["m2"],
            "persona": "Measured, budget-conscious, respects data. Opens low, warms if you quantify impact.",
        },
        "opening": "Thanks for making time. I know you wanted to talk about your comp. Before we get into numbers — walk me through how you're thinking about this. Budgets are tight this cycle, so I want to set expectations early.",
        "tags": ["Compensation", "1:1", "Influence"],
    },
    {
        "id": "car-purchase",
        "title": "Below Sticker",
        "category": "Consumer",
        "difficulty": "Foundational",
        "difficulty_level": 1,
        "duration_min": 7,
        "role": "Buyer negotiating a used premium sedan",
        "objective": "Close below $28,500 out-the-door (listed at $32,000).",
        "situation": "The car has been on the lot 60 days. The dealer needs to hit a monthly quota but will anchor high and use add-ons.",
        "batna": "A comparable car at another dealer for $29,900.",
        "target_zone": "$27,000–$29,000 out-the-door.",
        "stakes": "Low",
        "cover": COVERS["stairs"],
        "opponent": {
            "name": "Tony Marchetti",
            "title": "Sales Manager",
            "avatar": PORTRAITS["m1"],
            "persona": "Warm, fast-talking, uses urgency and add-ons. Folds late if you hold firm and cite alternatives.",
        },
        "opening": "Beautiful choice — this one's been getting a lot of attention. I can already tell you're serious. The sticker's $32, but I like you, so let's see what we can do. What kind of monthly payment were you hoping to land at?",
        "tags": ["Anchoring", "Price", "Walk-away"],
    },
    {
        "id": "enterprise-saas",
        "title": "The Six-Figure Contract",
        "category": "B2B Sales",
        "difficulty": "Intermediate",
        "difficulty_level": 2,
        "duration_min": 12,
        "role": "Account Executive closing an annual enterprise deal",
        "objective": "Protect price above $120k ARR and a 24-month term.",
        "situation": "Procurement wants a 30% discount and month-to-month flexibility. The champion loves you, but this gatekeeper is paid to grind.",
        "batna": "Quarter ends in two weeks; you have other deals but need this logo.",
        "target_zone": "$120k–$140k ARR, 24-month term, minimal discount.",
        "stakes": "High",
        "cover": COVERS["columns"],
        "opponent": {
            "name": "Marissa Vail",
            "title": "Head of Procurement",
            "avatar": PORTRAITS["f3"],
            "persona": "Cold, procedural, relentless on price. Concedes only for term length or multi-year commitment.",
        },
        "opening": "I'll be direct — the business unit likes your product, but the number you sent is a non-starter. We benchmark every renewal, and you're 30% above where we need to be. Tell me why I shouldn't take that to your competitor.",
        "tags": ["Procurement", "Discounting", "Value defense"],
    },
    {
        "id": "vendor-renewal",
        "title": "Renewal Under Pressure",
        "category": "Procurement",
        "difficulty": "Intermediate",
        "difficulty_level": 2,
        "duration_min": 10,
        "role": "Operations lead renewing a critical software vendor",
        "objective": "Cut annual cost by 15% while keeping the same SLA.",
        "situation": "The vendor is essential and knows switching is painful for you. They're proposing an 8% price increase.",
        "batna": "Migration to a competitor would cost 4 months and internal pain.",
        "target_zone": "Flat to -15% with SLA intact.",
        "stakes": "Medium",
        "cover": COVERS["monolith"],
        "opponent": {
            "name": "Grant Ellison",
            "title": "Enterprise Account Director",
            "avatar": PORTRAITS["m3"],
            "persona": "Confident, relationship-driven, leans on switching costs. Will trade price for a longer commitment or case study.",
        },
        "opening": "Great to reconnect ahead of renewal. You've had a strong year on our platform — usage is up 40%. Given that expansion and rising infra costs, we're looking at a modest 8% uplift this term. I assume that's straightforward?",
        "tags": ["Renewal", "Leverage", "Trade-offs"],
    },
    {
        "id": "job-offer",
        "title": "The Counter-Offer",
        "category": "Career",
        "difficulty": "Intermediate",
        "difficulty_level": 2,
        "duration_min": 10,
        "role": "Candidate negotiating a startup job offer",
        "objective": "Improve total comp: base to $180k and equity to 0.6%.",
        "situation": "You received an offer: $165k base, 0.35% equity. The founder is excited but guards the cap table fiercely.",
        "batna": "A stable big-tech offer at $195k base, lower upside.",
        "target_zone": "$175k–$185k base, 0.5%–0.7% equity, or a signing bonus.",
        "stakes": "High",
        "cover": COVERS["arch"],
        "opponent": {
            "name": "Nadia Brenner",
            "title": "Co-Founder & CEO",
            "avatar": PORTRAITS["f1"],
            "persona": "Charismatic, mission-driven, protective of equity. Sells vision; trades cash more easily than shares.",
        },
        "opening": "I'll be honest — the whole team is fired up about you joining. I want to get this across the line today. I saw you wanted to revisit the offer. Talk to me. What's going to make this a yes?",
        "tags": ["Equity", "Total comp", "Leverage"],
    },
    {
        "id": "supplier-increase",
        "title": "Holding the Line",
        "category": "Business",
        "difficulty": "Advanced",
        "difficulty_level": 3,
        "duration_min": 12,
        "role": "Founder pushing back on a supplier's surprise price hike",
        "objective": "Reject the 22% increase; land at 6% or lower with locked pricing.",
        "situation": "Your sole supplier for a key component announced a 22% increase citing raw material costs. Your margins can't absorb it.",
        "batna": "A secondary supplier exists but is unproven and 3 months out.",
        "target_zone": "0%–6% increase with a 12-month price lock.",
        "stakes": "High",
        "cover": COVERS["wall"],
        "opponent": {
            "name": "Peter Halloran",
            "title": "Regional Sales Director",
            "avatar": PORTRAITS["m4"],
            "persona": "Firm, cites external market forces, tests your alternatives. Softens if you threaten credible volume shifts.",
        },
        "opening": "I'll cut to it — I know the 22% notice wasn't welcome. But raw materials are up across the board, and frankly every one of our accounts is absorbing it. I'd rather keep you as a partner than lose you over this. Where does that leave us?",
        "tags": ["Cost", "Sole-source", "Pressure"],
    },
    {
        "id": "series-a",
        "title": "The Term Sheet",
        "category": "Fundraising",
        "difficulty": "Advanced",
        "difficulty_level": 3,
        "duration_min": 14,
        "role": "Founder negotiating a Series A term sheet",
        "objective": "Hold pre-money at $30M+ and keep board control founder-friendly.",
        "situation": "A top-tier VC offers $8M at $28M pre with a 2-1 board tilt and a participating preference. You want cleaner terms.",
        "batna": "A second, smaller term sheet at $25M pre with friendlier terms.",
        "target_zone": "$30M+ pre, 1x non-participating, balanced board.",
        "stakes": "Critical",
        "cover": COVERS["dark"],
        "opponent": {
            "name": "Julian Ostrowski",
            "title": "General Partner",
            "avatar": PORTRAITS["m2"],
            "persona": "Polished, patient, information-savvy. Anchors on 'market standard'. Trades economics for control and vice versa.",
        },
        "opening": "We're genuinely excited — this is a business we want to back. Our standard structure here is $8M at $28 pre. The terms are very market for this stage. I'd love to keep momentum and get to signature this week. How are you feeling about the shape of it?",
        "tags": ["Valuation", "Board", "High stakes"],
    },
    {
        "id": "layoff-severance",
        "title": "The Exit Package",
        "category": "Executive",
        "difficulty": "Expert",
        "difficulty_level": 4,
        "duration_min": 12,
        "role": "Departing executive negotiating a severance package",
        "objective": "Extend severance to 9 months and accelerate unvested equity.",
        "situation": "Your role is being eliminated. HR's opening offer is 3 months and a standard release. You have leverage you must use carefully.",
        "batna": "Litigation is possible but slow, costly, and reputationally risky.",
        "target_zone": "6–9 months, partial equity acceleration, neutral reference.",
        "stakes": "Critical",
        "cover": COVERS["arch"],
        "opponent": {
            "name": "Elaine Cho",
            "title": "Chief People Officer",
            "avatar": PORTRAITS["f2"],
            "persona": "Empathetic but tightly scripted, manages legal risk. Moves when you calmly signal leverage without threats.",
        },
        "opening": "First, I want to say this isn't a reflection of your work — the restructure is above all of us. I've prepared a standard package: three months and the usual release. I'd like to make this respectful and quick for both of us. Shall we walk through it?",
        "tags": ["Severance", "Leverage", "Composure"],
    },
]

SCENARIO_BY_ID = {s["id"]: s for s in SCENARIOS}


# --------------------------- LLM Prompts ----------------------------------

def opponent_system(scn: dict, transcript: str) -> str:
    op = scn["opponent"]
    return f"""You are role-playing as a negotiation counterpart in a realistic training simulation for the app "Negotio".

YOUR CHARACTER
Name: {op['name']}
Title: {op['title']}
Persona: {op['persona']}

THE SCENARIO
{scn['situation']}
The human user's role: {scn['role']}
The user's objective (they are trying to achieve this — you may or may not know it): {scn['objective']}
Difficulty setting: {scn['difficulty']} (higher difficulty = you concede less and negotiate harder).

RULES
- Stay fully in character as {op['name']}. Never break character or mention that you are an AI.
- Be realistic, human, and concise (2-5 sentences). Use natural spoken language, not bullet points.
- Negotiate to protect your own interests. Concede only when the user earns it with strong tactics (anchoring, framing, leverage, trade-offs, calm firmness).
- React emotionally and strategically to what the user actually says. Do not give away everything at once.
- If the user makes a genuinely strong, fair proposal and pushes well, a deal can be reached. If they are weak, hold firm.
- Do NOT use emojis. Do NOT narrate stage directions.

CONVERSATION SO FAR (most recent last):
{transcript if transcript else "(this is the opening of the negotiation)"}

OUTPUT FORMAT
Respond with ONLY a JSON object, no markdown, no prose outside the JSON:
{{
  "reply": "your in-character spoken response to the user",
  "opponent_stance": "one word: Aggressive | Firm | Guarded | Neutral | Softening | Conciliatory",
  "sentiment": <integer -100 to 100, how warm you feel toward the user right now>,
  "deal_health": <integer 0 to 100, how close the two sides are to a deal the user would accept>,
  "momentum": <integer -100 to 100, who controls the negotiation; positive = the user is winning>,
  "opponent_conceded": <true if you gave meaningful ground this turn, else false>,
  "deal_closed": <true only if a final agreement has actually been reached and accepted>
}}"""


def report_system(scn: dict) -> str:
    return f"""You are an elite negotiation coach analyzing a completed practice negotiation for the app "Negotio".

SCENARIO CONTEXT
Title: {scn['title']} ({scn['category']}, {scn['difficulty']})
The user played: {scn['role']}
Their objective: {scn['objective']}
Their target zone: {scn['target_zone']}
Their BATNA: {scn['batna']}
Opponent: {scn['opponent']['name']}, {scn['opponent']['title']}

You will receive the full transcript. Produce a rigorous, specific, professional coaching assessment. Quote or reference actual moments from the transcript. Be candid but constructive. Avoid generic filler.

Respond with ONLY a JSON object, no markdown:
{{
  "overall_score": <int 0-100>,
  "headline": "one sharp sentence summarizing the performance",
  "outcome": {{ "deal_reached": <bool>, "result": "1 short sentence on the final result vs the objective" }},
  "dimensions": {{
     "persuasion": <int 0-100>,
     "clarity": <int 0-100>,
     "empathy": <int 0-100>,
     "strategy": <int 0-100>,
     "listening": <int 0-100>,
     "leverage": <int 0-100>
  }},
  "strengths": [ {{ "title": "short label", "detail": "1-2 sentences, reference the transcript" }} ],
  "weaknesses": [ {{ "title": "short label", "detail": "1-2 sentences, reference the transcript" }} ],
  "communication_analysis": "2-3 sentences on clarity, listening, question quality",
  "persuasion_analysis": "2-3 sentences on framing, anchoring, use of leverage",
  "lost_leverage": "2-3 sentences: the specific moment(s) the user gave up leverage or bargaining power, and how",
  "opponent_responded_to": "2-3 sentences: which of the user's tactics or words actually moved the opponent",
  "strategic_decisions": [ {{ "moment": "what they did", "assessment": "was it wise, why" }} ],
  "concessions": {{ "by_you": <int>, "by_opponent": <int>, "notes": "1-2 sentences" }},
  "coach_feedback": "a direct 3-4 sentence note from the coach, second person",
  "improvement_plan": [ {{ "area": "short label", "action": "one concrete drill or habit" }} ],
  "recommended_scenario_id": "one of: {', '.join(SCENARIO_BY_ID.keys())}"
}}
Provide 2-4 items for each list. Scores must reflect genuine performance, not be inflated."""


def build_transcript(messages: List[dict], scn: dict) -> str:
    lines = []
    op_name = scn["opponent"]["name"]
    for m in messages:
        who = "USER" if m["role"] == "user" else op_name
        lines.append(f"{who}: {m['content']}")
    return "\n".join(lines)


# --------------------------- Auth helpers ---------------------------------

async def get_current_user(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**{k: user_doc.get(k) for k in ["user_id", "email", "name", "picture"]})


# ------------------------------ Routes ------------------------------------

@api_router.get("/")
async def root():
    return {"message": "Negotio API"}


@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session id")

    async with httpx.AsyncClient() as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()

    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {
            "name": data.get("name"), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name"),
            "picture": data.get("picture"),
            "created_at": now_iso(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now_iso(),
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 60 * 60,
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "user": {k: user_doc.get(k) for k in ["user_id", "email", "name", "picture"]},
        "session_token": session_token,
    }


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


@api_router.get("/scenarios")
async def list_scenarios():
    return SCENARIOS


@api_router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    scn = SCENARIO_BY_ID.get(scenario_id)
    if not scn:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scn


@api_router.post("/sessions")
async def create_session(body: CreateSessionBody, user: User = Depends(get_current_user)):
    scn = SCENARIO_BY_ID.get(body.scenario_id)
    if not scn:
        raise HTTPException(status_code=404, detail="Scenario not found")
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    opening = {
        "role": "opponent",
        "content": scn["opening"],
        "ts": now_iso(),
        "state": {"opponent_stance": "Firm", "sentiment": 0, "deal_health": 20,
                  "momentum": 0, "opponent_conceded": False, "deal_closed": False},
    }
    doc = {
        "session_id": session_id,
        "user_id": user.user_id,
        "scenario_id": scn["id"],
        "scenario_title": scn["title"],
        "status": "active",
        "messages": [opening],
        "concessions_opponent": 0,
        "created_at": now_iso(),
        "completed_at": None,
        "report": None,
    }
    await db.sessions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/sessions")
async def list_sessions(user: User = Depends(get_current_user)):
    docs = await db.sessions.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        d["turns"] = len([m for m in d.get("messages", []) if m["role"] == "user"])
        d["overall_score"] = (d.get("report") or {}).get("overall_score")
        d.pop("messages", None)
    return docs


@api_router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: User = Depends(get_current_user)):
    doc = await db.sessions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc


@api_router.post("/sessions/{session_id}/message")
async def send_message(session_id: str, body: MessageBody, user: User = Depends(get_current_user)):
    doc = await db.sessions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    if doc["status"] != "active":
        raise HTTPException(status_code=400, detail="Session already completed")

    scn = SCENARIO_BY_ID[doc["scenario_id"]]
    messages = doc["messages"]
    user_msg = {"role": "user", "content": body.content.strip(), "ts": now_iso()}
    messages.append(user_msg)

    transcript = build_transcript(messages, scn)
    system = opponent_system(scn, transcript)
    try:
        data = await llm_json(system, "Respond to the user's latest message now, in JSON.", session_id)
    except Exception as e:
        logger.exception("opponent llm failed")
        raise HTTPException(status_code=502, detail="Negotiation engine error")

    state = {
        "opponent_stance": str(data.get("opponent_stance", "Neutral")),
        "sentiment": int(data.get("sentiment", 0)),
        "deal_health": int(data.get("deal_health", 20)),
        "momentum": int(data.get("momentum", 0)),
        "opponent_conceded": bool(data.get("opponent_conceded", False)),
        "deal_closed": bool(data.get("deal_closed", False)),
    }
    opp_msg = {"role": "opponent", "content": str(data.get("reply", "")).strip(), "ts": now_iso(), "state": state}
    messages.append(opp_msg)

    concessions = doc.get("concessions_opponent", 0) + (1 if state["opponent_conceded"] else 0)
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"messages": messages, "concessions_opponent": concessions}},
    )
    return {"message": opp_msg, "state": state, "concessions_opponent": concessions}


@api_router.post("/sessions/{session_id}/report")
async def generate_report(session_id: str, user: User = Depends(get_current_user)):
    doc = await db.sessions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    if doc.get("report"):
        return doc["report"]

    scn = SCENARIO_BY_ID[doc["scenario_id"]]
    user_turns = [m for m in doc["messages"] if m["role"] == "user"]
    if len(user_turns) < 1:
        raise HTTPException(status_code=400, detail="Not enough conversation to assess")

    transcript = build_transcript(doc["messages"], scn)
    system = report_system(scn)
    try:
        report = await llm_json(system, f"Here is the full transcript to assess:\n\n{transcript}", session_id + "-report")
    except Exception:
        logger.exception("report llm failed")
        raise HTTPException(status_code=502, detail="Coaching engine error")

    report["generated_at"] = now_iso()
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"report": report, "status": "completed", "completed_at": now_iso()}},
    )
    return report


@api_router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    docs = await db.sessions.find({"user_id": user.user_id}, {"_id": 0}).to_list(500)
    completed = [d for d in docs if d.get("report")]
    completed.sort(key=lambda x: x.get("completed_at") or "")
    total = len(docs)
    scores = [d["report"]["overall_score"] for d in completed if d.get("report", {}).get("overall_score") is not None]

    dims = ["persuasion", "clarity", "empathy", "strategy", "listening", "leverage"]
    dim_labels = {"persuasion": "Persuasion", "clarity": "Clarity", "empathy": "Emotional IQ",
                  "strategy": "Strategy", "listening": "Listening", "leverage": "Leverage"}
    dim_avg = {}
    for dim in dims:
        vals = [d["report"]["dimensions"].get(dim) for d in completed
                if d.get("report", {}).get("dimensions", {}).get(dim) is not None]
        dim_avg[dim] = round(sum(vals) / len(vals)) if vals else 0

    deals = sum(1 for d in completed if d.get("report", {}).get("outcome", {}).get("deal_reached"))
    trend = [{"score": d["report"]["overall_score"], "title": d.get("scenario_title"),
              "at": d.get("completed_at")} for d in completed][-12:]

    # strongest / weakest behaviour
    graded = [(k, v) for k, v in dim_avg.items() if v > 0]
    strongest = max(graded, key=lambda x: x[1]) if graded else None
    weakest = min(graded, key=lambda x: x[1]) if graded else None

    # momentum = latest score vs trailing average
    latest = scores[-1] if scores else 0
    prior = scores[:-1]
    momentum = round(latest - (sum(prior) / len(prior))) if prior else 0

    # concession behaviour (from reports)
    won = sum((d.get("report", {}).get("concessions", {}) or {}).get("by_opponent", 0) or 0 for d in completed)
    given = sum((d.get("report", {}).get("concessions", {}) or {}).get("by_you", 0) or 0 for d in completed)

    # training streak (consecutive calendar days with a session, ending today or yesterday)
    days = set()
    for d in docs:
        ts = d.get("created_at")
        if ts:
            try:
                days.add(datetime.fromisoformat(ts).date())
            except Exception:
                pass
    streak = 0
    if days:
        cur = datetime.now(timezone.utc).date()
        if cur not in days and (cur - timedelta(days=1)) in days:
            cur = cur - timedelta(days=1)
        while cur in days:
            streak += 1
            cur = cur - timedelta(days=1)

    return {
        "total_sessions": total,
        "completed_sessions": len(completed),
        "avg_score": round(sum(scores) / len(scores)) if scores else 0,
        "best_score": max(scores) if scores else 0,
        "latest_score": latest,
        "deals_closed": deals,
        "win_rate": round(deals / len(completed) * 100) if completed else 0,
        "momentum": momentum,
        "streak": streak,
        "dimensions": dim_avg,
        "dimension_labels": dim_labels,
        "strongest": {"key": strongest[0], "label": dim_labels[strongest[0]], "value": strongest[1]} if strongest else None,
        "weakest": {"key": weakest[0], "label": dim_labels[weakest[0]], "value": weakest[1]} if weakest else None,
        "concessions": {"won": won, "given": given},
        "trend": trend,
    }


app.include_router(api_router)

_cors = os.environ.get('CORS_ORIGINS', '*')
if _cors.strip() == '*':
    # Echo the request origin so credentialed (cookie) requests are allowed by browsers.
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=".*",
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=_cors.split(','),
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
