# 🚀 KILOS Bill Decoder

A multi-agent AI system for analyzing electricity bills with OCR, parsing, appliance breakdown, and actionable insights.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## Features

- 📸 **OCR Processing**: Extract text from bill images using Tesseract.js
- 📋 **Smart Parsing**: AI-powered extraction of consumption, costs, and billing data
- 🔌 **Appliance Breakdown**: Detailed analysis of energy consumption by appliance
- 💡 **Insights & Tips**: Personalized recommendations to reduce electricity costs
- 🏆 **Gamification**: KILOS score and achievement badges

## Architecture

### Multi-Agent System

```
📸 OCR Agent → 📋 Parser Agent → 🔌 Appliance Analyzer → 💡 Insights Agent
                              ↓
                        Orchestrator
```

Each agent is specialized and independent:

- **OCR Agent**: Image-to-text extraction
- **Parser Agent**: Structured data extraction from text
- **Appliance Analyzer**: Energy consumption breakdown
- **Insights Agent**: Recommendations and scoring

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **OCR**: Tesseract.js
- **AI**: Google Generative AI / OpenAI
- **Database**: Firebase
- **Styling**: Tailwind CSS

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze-text/      # Text analysis endpoint
│   │   └── chat-simple/        # Chatbot endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── SimpleChatbot.tsx       # Chat interface
├── lib/
│   └── agents/
│       ├── index.ts            # Orchestrator
│       ├── parser-agent.ts     # Main parsing logic
│       └── types.ts            # Type definitions
└── firebase/
    └── firebase.ts             # Firebase config
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_ai_key
```

## Usage

1. **Upload a bill image** (drag & drop or click)
2. **Click "Analyze Bill"**
3. **View results**:
   - Consumption breakdown
   - Appliance-level costs
   - Money-saving tips
   - KILOS Score & badges

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## API Endpoints

- `POST /api/analyze-text` - Analyze bill text
- `POST /api/chat-simple` - Chatbot interactions

## License

Private project for KILOS Hackathon
