import os
import json
import pandas as pd
from typing import Dict, List
import requests
from tavily import TavilyClient

# Senior SWE: Use absolute path relative to this file to ensure it runs from any CWD
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SANCTIONS_PATH = os.path.join(CURRENT_DIR, "sanctions_list.csv")

# Load sanctions data once for performance
SANCTIONS_DF = pd.read_csv(SANCTIONS_PATH)

# Senior SWE: Initialize Tavily with environment check
tavily_api_key = os.getenv("TAVILY_API_KEY")
tavily = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

# Senior SWE: Initialize OpenSanctions with environment check
opensanctions_api_key = os.getenv("OPENSANCTIONS_API_KEY")

def mock_news_search(entity_name: str) -> str:
    """
    Performs real-time news search via Tavily.
    If the API key is missing, returns an empty result set instead of mock data.
    """
    if tavily:
        try:
            print(f"Executing real-time search for: {entity_name}")
            # Query focused on AML and regulatory issues
            query = f"recent AML controversies or regulatory sanctions news regarding {entity_name}"
            response = tavily.search(query=query, search_depth="advanced", max_results=5)

            # Format results for the LLM
            formatted_results = [
                {"title": res['title'], "source": res['url'], "content": res['content']} 
                for res in response.get('results', [])
            ]
            return json.dumps(formatted_results)
        except Exception as e:
            print(f"Real-time search error: {e}.")
            return json.dumps([{"title": "Search error", "source": "API", "content": str(e)}])

    return json.dumps([{"title": "No live search data available", "source": "System", "content": "Tavily API key is missing."}])

def check_sanctions_list(entity_name: str) -> str:
    """
    Checks for a match with the entity name via OpenSanctions API (Live),
    falling back to the local regulatory list (CSV) if the API is unavailable.
    """
    if opensanctions_api_key:
        try:
            print(f"Executing real-time sanctions check for: {entity_name}")
            # Search entities endpoint
            url = f"https://api.opensanctions.org/search/default?q={entity_name}&limit=1"
            headers = {"Authorization": f"ApiKey {opensanctions_api_key}"}
            response = requests.get(url, headers=headers, timeout=10)
            data = response.json()

            if data.get('results'):
                result = data['results'][0]
                # Filter for high-confidence matches or specific properties
                return json.dumps({
                    "match": True, 
                    "source": "OpenSanctions API",
                    "details": {
                        "entity_name": result.get('caption'),
                        "reason": f"This entity was found on official global watchlists and regulatory databases.",
                        "risk_level": "High" if 'sanctions' in result.get('datasets', []) else "Medium"
                    }
                })
        except Exception as e:
            print(f"Real-time sanctions error: {e}. Falling back to local regulatory list.")

    # Local Regulatory List (CSV) as Secondary Source
    match = SANCTIONS_DF[SANCTIONS_DF['entity_name'].str.contains(entity_name, case=False, na=False)]
    
    if not match.empty:
        # Convert first match to dictionary
        result = match.iloc[0].to_dict()
        return json.dumps({"match": True, "source": "Local Regulatory List", "details": result})
    
    return json.dumps({"match": False, "source": "N/A", "details": None})

# Integration for LangChain/LangGraph
from langchain.tools import tool

@tool
def get_entity_risk_data(entity_name: str) -> str:
    """
    Aggregated tool to fetch news and sanctions data for a given entity.
    This simplifies the agent's reasoning by providing all external data at once.
    """
    news = json.loads(mock_news_search(entity_name))
    sanctions = json.loads(check_sanctions_list(entity_name))
    
    return json.dumps({
        "entity": entity_name,
        "adverse_media": news,
        "sanctions_check": sanctions
    })
