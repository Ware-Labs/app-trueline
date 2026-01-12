import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Settings:
    """Application settings and environment management."""
    
    APP_ENV: str = os.getenv("APP_ENV", "development")
    IS_PROD: bool = APP_ENV == "production"
    
    # API Pointers
    # Default App Runner domain provided by the user
    PROD_URL: str = "https://zpz97xmkin.us-east-1.awsapprunner.com"
    DEV_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    @property
    def API_BASE_URL(self) -> str:
        return self.PROD_URL if self.IS_PROD else self.DEV_URL

    # Third-party API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    THE_ODDS_API_KEY: str = os.getenv("THE_ODDS_API_KEY")

settings = Settings()
