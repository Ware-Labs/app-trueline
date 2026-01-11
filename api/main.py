from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Trueline API")

class ScenarioRequest(BaseModel):
    game_id: str
    risk_profile: str  # Conservative, Balanced, Aggressive
    lines_source: Optional[str] = "primary"
    timestamp: datetime

class BestBet(BaseModel):
    wager: str
    odds: str
    implied_prob: float
    model_edge: float

class Scenario(BaseModel):
    probability: float
    summary: str
    best_bet: BestBet
    quarter_spread_parlay: Optional[List[str]] = None
    explanation: Optional[str] = None

class ScenarioResponse(BaseModel):
    scenarios: List[Scenario]
    lines_timestamp: datetime
    book_used: str

@app.get("/")
async def root():
    return {"message": "Trueline API is running"}

@app.post("/generate-scenarios", response_model=ScenarioResponse)
async def generate_scenarios(request: ScenarioRequest):
    # Placeholder implementation
    return {
        "scenarios": [
            {
                "probability": 0.45,
                "summary": "High scoring game dominated by offense.",
                "best_bet": {
                    "wager": "Over 45.5",
                    "odds": "-110",
                    "implied_prob": 0.52,
                    "model_edge": 0.07
                },
                "quarter_spread_parlay": ["Q1: +3.5", "Q2: -2.5", "Q3: +1.5", "Q4: -0.5"]
            },
            {
                "probability": 0.35,
                "summary": "Defensive struggle with low red zone efficiency.",
                "best_bet": {
                    "wager": "Under 45.5",
                    "odds": "-110",
                    "implied_prob": 0.48,
                    "model_edge": 0.03
                },
                "explanation": "Quarter spread parlay not available for low-scoring projections."
            },
            {
                "probability": 0.20,
                "summary": "Lopsided victory for the home team.",
                "best_bet": {
                    "wager": "Home Team -7.5",
                    "odds": "+105",
                    "implied_prob": 0.49,
                    "model_edge": 0.04
                },
                "quarter_spread_parlay": ["Q1: -0.5", "Q2: -3.5", "Q3: -1.5", "Q4: -2.5"]
            }
        ],
        "lines_timestamp": datetime.now(),
        "book_used": request.lines_source or "DraftKings"
    }

# Placeholder endpoints
@app.get("/games")
async def get_games():
    """Returns a list of upcoming games."""
    return [{"id": "game_1", "name": "NFL: Chiefs vs Eagles", "start_time": datetime.now()}]

@app.get("/odds")
async def get_odds(game_id: str):
    """Returns historical odds and lines for a specific game."""
    return {"game_id": game_id, "odds": []}
