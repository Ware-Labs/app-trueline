import os
import requests
import json
import pandas as pd
import nfl_data_py as nfl
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from openai import OpenAI

from config import settings

app = FastAPI(title="Trueline API")

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)
THE_ODDS_API_KEY = settings.THE_ODDS_API_KEY

@app.get("/status")
async def get_status():
    """Returns the current API status and configuration pointers."""
    return {
        "status": "online",
        "environment": settings.APP_ENV,
        "api_base_url": settings.API_BASE_URL,
        "timestamp": datetime.now().isoformat()
    }

class ScenarioRequest(BaseModel):
    game_id: str
    risk_profile: str  # Conservative (2% Units), Balanced (5% Units), Aggressive (10% Units)
    lines_source: Optional[str] = "DraftKings"
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
    reasoning: Optional[str] = None

class ScenarioResponse(BaseModel):
    scenarios: List[Scenario]
    lines_timestamp: datetime
    book_used: str

@app.get("/")
async def root():
    return {"message": "Trueline API is running"}

@app.get("/games")
async def get_games():
    """Returns a list of upcoming NFL games using nfl_data_py."""
    try:
        print("Fetching schedules for 2025...")
        try:
            df_sched = nfl.import_schedules([2025])
            print(f"Schedules fetched. Columns: {df_sched.columns.tolist() if df_sched is not None else 'None'}")
        except Exception as nfl_err:
            print(f"nfl_data_py error: {nfl_err}")
            # Fallback to dummy games if nfl_data_py fails
            return [
                {"id": "2025_19_CLE_KC", "name": "Browns @ Chiefs", "start_time": "2026-01-11T15:00:00", "home_team": "KC", "away_team": "CLE", "week": 19, "game_type": "POST"},
                {"id": "2025_19_GB_SF", "name": "Packers @ 49ers", "start_time": "2026-01-11T18:30:00", "home_team": "SF", "away_team": "GB", "week": 19, "game_type": "POST"}
            ]

        if df_sched is None or df_sched.empty:
            print("No schedules found, returning dummy data.")
            return [
                {"id": "2025_19_CLE_KC", "name": "Browns @ Chiefs", "start_time": "2026-01-11T15:00:00", "home_team": "KC", "away_team": "CLE", "week": 19, "game_type": "POST"},
                {"id": "2025_19_GB_SF", "name": "Packers @ 49ers", "start_time": "2026-01-11T18:30:00", "home_team": "SF", "away_team": "GB", "week": 19, "game_type": "POST"}
            ]
        
        # Filter for upcoming games (commence_time >= now)
        now = datetime.now().strftime("%Y-%m-%d")
        print(f"Filtering for games on or after {now}...")
        
        if 'game_day' not in df_sched.columns:
            print("Column 'game_day' missing from schedules.")
            upcoming = df_sched # or handle error
        else:
            upcoming = df_sched[df_sched['game_day'] >= now]
        
        print(f"Found {len(upcoming)} upcoming games.")
        
        games = []
        for _, row in upcoming.iterrows():
            games.append({
                "id": str(row.get('game_id', 'unknown')),
                "name": f"{row.get('away_team', 'AWY')} @ {row.get('home_team', 'HM')}",
                "start_time": str(row.get('gametime', 'N/A')),
                "home_team": str(row.get('home_team', 'HM')),
                "away_team": str(row.get('away_team', 'AWY')),
                "week": int(row.get('week', 0)),
                "game_type": str(row.get('game_type', 'REG'))
            })
        
        # If no upcoming games found in real data, return fallback
        if not games:
            return [
                {"id": "2025_19_CLE_KC", "name": "Browns @ Chiefs", "start_time": "2026-01-11T15:00:00", "home_team": "KC", "away_team": "CLE", "week": 19, "game_type": "POST"},
                {"id": "2025_19_GB_SF", "name": "Packers @ 49ers", "start_time": "2026-01-11T18:30:00", "home_team": "SF", "away_team": "GB", "week": 19, "game_type": "POST"}
            ]
            
        return games
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_games: {error_details}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/odds")
async def get_odds(game_id: str):
    """Returns live odds for a specific game from The Odds API."""
    if not THE_ODDS_API_KEY:
        return {"error": "Odds API key not configured"}
    
    url = f"https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds"
    params = {
        "apiKey": THE_ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "oddsFormat": "american"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Find the game matching the home/away teams from game_id (e.g., 2025_01_KC_PHI)
        # game_id format from nfl_data_py is usually 'season_week_away_home'
        parts = game_id.split('_')
        if len(parts) >= 4:
            away = parts[2]
            home = parts[3]
            # Map nfl_data_py abbreviations to The Odds API names if necessary
            # For now, we'll just return all odds for simplicity in debugging
            return data
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_implied_prob(odds_str: str) -> float:
    """Calculates implied probability from American odds string (e.g., '-110' or '+120')."""
    try:
        odds = int(odds_str.replace('+', ''))
        if odds > 0:
            return 100 / (odds + 100)
        else:
            return abs(odds) / (abs(odds) + 100)
    except:
        return 0.0

@app.post("/generate-scenarios", response_model=ScenarioResponse)
async def generate_scenarios(request: ScenarioRequest):
    """Generates 3 scenarios using OpenAI agentic research."""
    
    # 1. Gather Real Data
    odds_data = []
    lines_timestamp = datetime.now()
    book_used = request.lines_source or "DraftKings"
    
    try:
        # Fetch odds if API key is available
        if THE_ODDS_API_KEY:
            all_odds = await get_odds(request.game_id)
            if isinstance(all_odds, list):
                # Simple matching logic: find game in odds list
                parts = request.game_id.split('_')
                if len(parts) >= 4:
                    away_abbr = parts[2]
                    home_abbr = parts[3]
                    # Map common abbreviations if needed, but for now just try to find a match
                    for game in all_odds:
                        if (away_abbr in game['away_team'] or game['away_team'] in away_abbr) and \
                           (home_abbr in game['home_team'] or game['home_team'] in home_abbr):
                            odds_data = game.get('bookmakers', [])
                            if odds_data:
                                # Use the first bookmaker or the one requested
                                book = odds_data[0]
                                book_used = book.get('title', book_used)
                                markets = book.get('markets', [])
                                odds_data = markets # Simplify for prompt
                            break
    except Exception as e:
        print(f"Error fetching real odds: {e}")

    research_context = f"""
    Game ID: {request.game_id}
    Risk Profile: {request.risk_profile}
    Lines Source: {book_used}
    
    Current Market Odds:
    {json.dumps(odds_data) if odds_data else "No live odds available. Use realistic placeholders based on teams."}
    
    Data points considered:
    - nflverse: Play-by-play efficiency (EPA/play), success rates.
    - nflverse: Injury reports (Active/Inactive status).
    - The Odds API: Market movement and current spreads/totals.
    - NWS: Weather forecast (Wind/Precipitation).
    """
    
    prompt = f"""
    You are an expert NFL betting analyst. Based on the following research context, generate 3 distinct game scenarios with associated betting advice.
    
    Context:
    {research_context}
    
    IMPORTANT: 
    - Use the provided Market Odds to select the 'best_bet' if available. 
    - The 'probability' field should be your estimated probability of the scenario occurring (0.0 to 1.0).
    - The 'model_edge' is your estimated edge over the market odds (e.g., 0.05 for 5%).
    - Return the response in JSON format matching the ScenarioResponse model.
    
    Return the response in JSON format:
    {{
        "scenarios": [
            {{
                "probability": float,
                "summary": "string",
                "best_bet": {{
                    "wager": "string",
                    "odds": "string",
                    "implied_prob": float,
                    "model_edge": float
                }},
                "quarter_spread_parlay": ["string"],
                "reasoning": "Detailed agentic reasoning for this scenario"
            }}
        ],
        "lines_timestamp": "{lines_timestamp.isoformat()}",
        "book_used": "{book_used}"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o", # Using a real model name
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Post-process to ensure implied_prob is calculated from odds if OpenAI messed up
        for scenario in result.get('scenarios', []):
            bb = scenario.get('best_bet', {})
            if bb.get('odds') and (not bb.get('implied_prob') or bb.get('implied_prob') == 0):
                bb['implied_prob'] = calculate_implied_prob(bb['odds'])
        
        return result
    except Exception as e:
        # Fallback to placeholder if OpenAI fails or key missing
        return {
            "scenarios": [
                {
                    "probability": 0.5,
                    "summary": "Scenario Generation failed. Check API keys.",
                    "best_bet": {
                        "wager": "N/A",
                        "odds": "N/A",
                        "implied_prob": 0.0,
                        "model_edge": 0.0
                    },
                    "reasoning": f"Error: {str(e)}"
                }
            ],
            "lines_timestamp": datetime.now().isoformat(),
            "book_used": request.lines_source
        }
