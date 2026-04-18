# MyGOV Agent 2.0: Product Requirements & Architecture Document

## 1. Project Overview
MyGOV Agent 2.0 is a multimodal, agentic, RAG-grounded citizen-service orchestrator designed to transform Malaysian government interactions from reactive chatbots to proactive concierges.

## 2. Core Personas
*   **The Citizen:** Needs low-friction, multilingual access to services (voice, photo, text) and proactive updates.
*   **The Officer:** Needs high-quality case summaries, extracted document data, and policy-grounded evidence to make faster decisions.

## 3. The "Hero" Workflows
### A. Flood Relief & Document Verification
*   **Input:** Voice (Bahasa/Manglish), Photos of damage, MyKad upload.
*   **Process:** Intent extraction (Gemini 2.5 Flash-Lite), OCR (Document AI), Landmark resolution (Maps), Policy checking (RAG Engine).
*   **Output:** Eligibility draft, Citizen summary, Officer case packet.

### B. "No Wrong Door" Complaint Routing
*   **Input:** "There's a pothole and broken streetlamp near SS2."
*   **Process:** Intent splitting (Gemini), Location normalization (Places API).
*   **Output:** One citizen ticket, two backend service tasks (Roads + Lighting).

### C. Guardian Mode (Proactive)
*   **Input:** System-detected expiry (License, Welfare renewal).
*   **Process:** Scheduler -> Gemini 2.5 Flash-Lite -> FCM.
*   **Output:** "Your license expires in 12 days. Renew now?"

## 4. Technical Stack (Google Cloud)
*   **AI Layer:** Gemini 2.5 Flash/Flash-Lite (Vertex AI), Gemini Live API.
*   **Orchestration:** Vertex AI Agent Engine & Agent Builder.
*   **Grounding:** Vertex AI RAG Engine (Official .gov.my corpus).
*   **Extraction:** Document AI (OCR & Form Parsing).
*   **Location:** Google Maps Platform (Geocoding, Places, Routes).
*   **Compute/Storage:** Cloud Run, Firestore, Cloud Storage.
*   **Messaging/Auth:** Firebase FCM, Identity Platform, Cloud Tasks.

## 5. Information Architecture
*   **Citizen App:** Dashboard, Active Cases, Profile/Documents, Service Catalog.
*   **Officer Portal:** Case Queue, Case Detail (Evidence, AI Summary, Policy Match), Decision Center.
