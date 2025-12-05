#!/bin/bash

# Test Lynk.id Webhook
WEBHOOK_URL="https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook"

echo "🧪 Testing Lynk.id Webhook..."
echo ""

# Test 1: Test Event (no signature needed)
echo "1️⃣ Testing Test Event..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"event":"test_event"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "---"
echo ""

# Test 2: Payment Event with Mock Data
echo "2️⃣ Testing Payment Event (will fail signature check - expected)..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-lynk-signature: mock_signature" \
  -d '{
    "event": "payment.received",
    "data": {
      "message_id": "test123",
      "message_data": {
        "refId": "REF123",
        "totals": {
          "grandTotal": 20000
        },
        "customer": {
          "email": "test@example.com"
        }
      }
    }
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "---"
echo ""
echo "✅ Test selesai!"
echo ""
echo "📝 Catatan:"
echo "- Test 1 harus return 200 dengan message 'Test event received'"
echo "- Test 2 akan return 401 (Invalid Signature) - ini normal karena signature mock"
echo ""
echo "🔍 Cek logs di Supabase Dashboard untuk detail:"
echo "https://supabase.com/dashboard/project/pjwmfyvknbtoofxfuwjm/functions/lynk-webhook/logs"
