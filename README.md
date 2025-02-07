# Saarthi AI (HACKQUINOX WINNER)

## 🚀 Overview
AI Interview Coach is an advanced **AI-powered interview simulator** that helps users prepare for job interviews by mimicking real-life interview scenarios. It uses **speech-to-text (STT), text-to-speech (TTS), NLP-based question generation, and facial emotion recognition (FER)** to evaluate responses and provide insightful feedback.

## 🔥 Features
- **Real-time Speech-to-Text (STT):** Uses **Web Speech API** to transcribe user responses.
- **Text-to-Speech (TTS):** Converts AI-generated interviewer questions into natural speech using **ElevenLabs AI voices**.
- **Dynamic Question Generation:** Generates context-aware interview questions using **Gemini AI**.
- **Facial Emotion Recognition (FER):** Analyzes user expressions using **DeepFace / FER+ models**.
- **Real-time Feedback:** Provides **spoken and visual feedback** based on voice tone and facial expressions.
- **Interactive Visualization:** Uses a **custom audio player with waveform visualization** instead of a basic HTML `<audio>` component.
- **Multi-role Support:** Users can select different interview types (e.g., **Data Analyst, Software Engineer, Product Manager**).

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS, Web Speech API
- **Backend:** Node.js, Express.js
- **AI Models:**
  - **Speech Recognition:** Web Speech API
  - **Text-to-Speech:** ElevenLabs AI
  - **Question Generation:** Google Gemini AI
  - **Emotion Detection:** DeepFace / FER+ (Microsoft)
  - **Face Tracking:** OpenCV
- **Database:** MongoDB (Optional for storing history and feedback)

## ⚙️ Installation & Setup
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/ai-interview-coach.git
```

### 2️⃣ Install Dependencies
```bash
# Frontend
cd client
npm run dev

```

### 3️⃣ Set Up API Keys
Create a `.env` file in the `server` directory and add:
```env
ELEVEN_LABS_API_KEY=your-elevenlabs-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4️⃣ Start the Application
```bash
# Start backend
cd server
node index.js

```

## 📌 Usage
1. Click **Start Talking** to begin the interview.
2. The AI will **ask a question using TTS**.
3. User responds, and **speech is transcribed to text**.
4. AI **analyzes the response** and provides feedback on:
   - Clarity
   - Emotion
   - Relevance
5. Repeat for multiple rounds.

## 🎯 Future Improvements
- ✅ **Multi-language support** for global users.
- ✅ **More advanced interviewer personalities** (strict, friendly, technical).
- ✅ **Integration with job portals** to analyze real interview trends.

## 🤝 Contributing
We welcome contributions! Feel free to submit issues or pull requests.

## 📜 License
This project is licensed under the **MIT License**.

---

### ✨ Created by [SUJIT_MISHRA / DEV_PIONEERS] 🚀

