from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agent import analyze_transaction

app = FastAPI(title="RiskStream AI AI Engine")

class TransactionInput(BaseModel):
    id: int
    sender_name: str
    receiver_name: str
    amount: float
    currency: str
    description: Optional[str] = None

class AnalysisOutput(BaseModel):
    transaction_id: int
    risk_score: int
    reasoning: str
    sources_checked: List[str]

@app.post("/analyze", response_model=AnalysisOutput)
async def run_analysis(txn: TransactionInput):
    try:
        # Senior SWE: Pass dict representation to the agent
        result = analyze_transaction(txn.model_dump())
        return result
    except Exception as e:
        # Senior SWE: Robust error handling and logging
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="Internal AI Engine error during analysis.")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "engine": "LangGraph"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
