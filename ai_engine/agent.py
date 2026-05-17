import os
import json
from typing import TypedDict, List, Dict, Annotated
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from dotenv import load_dotenv
from tools import get_entity_risk_data

# Load environment variables
load_dotenv()

# Define the state for the LangGraph agent
class AgentState(TypedDict):
    transaction: Dict
    entities: List[str]
    research_results: Dict[str, Dict]
    risk_score: int
    reasoning: str
    sources_checked: List[str]
    messages: List[BaseMessage]

# Initialize the LLM (Senior SWE: Modular provider selection)
def get_llm():
    provider = os.getenv("LLM_PROVIDER", "OPENAI").upper()
    
    if provider == "NVIDIA":
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            print("Warning: NVIDIA_API_KEY not found. Falling back to Mock.")
            return MockLLM()
        return ChatNVIDIA(model="meta/llama-3.1-70b-instruct", nvidia_api_key=api_key)
    
    elif provider == "OPENAI":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("Warning: OPENAI_API_KEY not found. Falling back to Mock.")
            return MockLLM()
        return ChatOpenAI(model="gpt-4o", temperature=0)
    
    elif provider == "GEMINI":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("Warning: GOOGLE_API_KEY not found. Falling back to Mock.")
            return MockLLM()
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key, temperature=0)
    
    return MockLLM()

class MockLLM:
    def invoke(self, messages):
        raise Exception("No valid LLM provider configured.")

llm = get_llm()

def extract_entities_node(state: AgentState):
    """Extracts sender and receiver names from the transaction data."""
    txn = state['transaction']
    entities = list(set([txn['sender_name'], txn['receiver_name']]))
    return {"entities": entities}

def research_entities_node(state: AgentState):
    """Invokes tools for each extracted entity."""
    results = {}
    sources = []
    
    for entity in state['entities']:
        # In a real agent, the LLM would decide to call tools. 
        # Here we automate the call for reliability in the demo.
        data = get_entity_risk_data.invoke({"entity_name": entity})
        results[entity] = json.loads(data)
        sources.append(f"Sanctions List: {entity}")
        sources.append(f"Adverse Media Search: {entity}")
        
    return {"research_results": results, "sources_checked": sources}

def evaluate_risk_node(state: AgentState):
    """Uses LLM to evaluate research results and calculate final risk score."""
    research_data = json.dumps(state['research_results'], indent=2)
    txn_data = json.dumps(state['transaction'], indent=2)
    
    prompt = f"""
    You are a Senior AML Compliance Officer. Evaluate the following transaction and research findings:
    
    TRANSACTION:
    {txn_data}
    
    RESEARCH FINDINGS:
    {research_data}
    
    TASK:
    1. Calculate a Risk Score (0-100) based on:
       - Sanctions Match: Instantly 100.
       - Adverse Media: +30-50 depending on severity.
       - Amount: High volume (>$1M) adds weight.
    2. Provide a detailed professional reasoning.
    3. Return ONLY a JSON object with the following keys:
       "risk_score": (int),
       "reasoning": (str)
    """
    
    # For the sake of the prototype without a live API key, we handle the potential failure
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        # Attempt to parse JSON from the response
        try:
            output = json.loads(response.content)
        except:
            # Fallback parsing if LLM wraps in markdown
            content = response.content.replace("```json", "").replace("```", "").strip()
            output = json.loads(content)
    except Exception as e:
        # Fallback Mock Logic (Senior SWE: Graceful degradation)
        print(f"LLM Error: {e}. Using fallback deterministic logic.")
        output = fallback_risk_calculation(state)

    return {
        "risk_score": output['risk_score'],
        "reasoning": output['reasoning']
    }

def fallback_risk_calculation(state: AgentState) -> Dict:
    """Deterministic fallback for risk scoring in case of LLM unavailability."""
    score = 10
    reasoning_parts = ["Baseline risk assessed."]
    
    for entity, data in state['research_results'].items():
        if data['sanctions_check']['match']:
            score = 100
            reasoning_parts.append(f"CRITICAL: {entity} found on sanctions list ({data['sanctions_check']['details']['reason']}).")
            break
        
        adverse = data['adverse_media']
        if any(item.get('sentiment') == 'Highly Negative' for item in adverse):
            score += 50
            reasoning_parts.append(f"High risk adverse media found for {entity}.")
        elif any(item.get('sentiment') == 'Negative' for item in adverse):
            score += 25
            reasoning_parts.append(f"Adverse media found for {entity}.")

    if state['transaction']['amount'] > 1000000:
        score += 20
        reasoning_parts.append("Transaction amount exceeds $1M threshold.")
        
    return {
        "risk_score": min(100, score),
        "reasoning": " ".join(reasoning_parts)
    }

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("extract_entities", extract_entities_node)
workflow.add_node("research_entities", research_entities_node)
workflow.add_node("evaluate_risk", evaluate_risk_node)

workflow.set_entry_point("extract_entities")
workflow.add_edge("extract_entities", "research_entities")
workflow.add_edge("research_entities", "evaluate_risk")
workflow.add_edge("evaluate_risk", END)

# Compile the executable app
app = workflow.compile()

def analyze_transaction(transaction: Dict) -> Dict:
    """Entry point to trigger the AI analysis."""
    initial_state = {
        "transaction": transaction,
        "entities": [],
        "research_results": {},
        "risk_score": 0,
        "reasoning": "",
        "sources_checked": [],
        "messages": []
    }
    
    final_state = app.invoke(initial_state)
    
    return {
        "transaction_id": transaction.get('id'),
        "risk_score": final_state['risk_score'],
        "reasoning": final_state['reasoning'],
        "sources_checked": final_state['sources_checked']
    }
