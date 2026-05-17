import json
from ai_engine.agent import analyze_transaction

def test_agent():
    mock_txn = {
        "id": 1,
        "sender_name": "Siberian Minerals",
        "receiver_name": "Oceanic Logistics",
        "amount": 1500000.00,
        "currency": "USD",
        "description": "Payment for industrial machinery"
    }
    
    print("Starting analysis for mock transaction...")
    result = analyze_transaction(mock_txn)
    print("\n--- ANALYSIS RESULT ---")
    print(json.dumps(result, indent=2))
    
    # Validation
    assert result['risk_score'] > 0
    assert "Siberian Minerals" in result['reasoning'] or "Oceanic Logistics" in result['reasoning']
    print("\nTest Passed!")

if __name__ == "__main__":
    test_agent()
