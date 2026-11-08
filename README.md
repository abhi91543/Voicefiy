# Voicefiy 🎙️✨

> **Developed with ❤️ by Abhishek**

**Voicefiy** is a local AI Text-to-Speech (TTS) and creative story studio. It transforms written stories and custom prompts into hyper-realistic, human-like voiceovers with emotion, pitch nuances, and breathing pauses—running 100% locally on your computer with zero cloud audio processing fees.

---

## 🌟 Key Features

- **Hyper-Realistic Local TTS**: Powered by Kokoro TTS (82M q8 quantized model) running locally on Node.js.
- **Multiple High-Quality Voices**: Expressive female and male voice profiles (Heart, Allison, Bella, Jessica, Sarah, Adam).
- **Gemini Story Generator**: Integrated with Google Gemini to auto-generate creative stories across Romance, Drama, Thriller, Mystery, and Fantasy genres.
- **Long-Form Streaming**: Smart sentence segmentation with natural pauses between thoughts and sentences.
- **Speed & Pitch Controls**: Customize speaking pace and pitch preservation.
- **WAV Audio Export**: Download single stitched audio files with one click.
- **Private & Secure**: Audio synthesis runs entirely on your local machine.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- (Optional) A Google Gemini API key if you want to use the built-in AI Story Generator.

### 2. Installation
Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/Voicefiy.git
cd Voicefiy
```

Install dependencies:
```bash
npm install
```

### 3. Run the Application
Start the Voicefiy server:
```bash
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 💻 Tech Stack
- **Backend**: Node.js, Express, `kokoro-js`, `@huggingface/transformers`
- **Frontend**: Vanilla JavaScript, Glassmorphic CSS, Modern HTML5 Audio API
- **AI / Models**:
  - TTS: Kokoro-82M ONNX model
  - Storytelling: Google Gemini API

---

## 👤 Author & Developer
- **Developer**: Abhishek
- **Project**: Voicefiy

---

## 📄 License
ISC / MIT License
