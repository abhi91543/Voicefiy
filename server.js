import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { KokoroTTS } from "kokoro-js";
import { RawAudio } from "@huggingface/transformers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let tts = null;

// Pre-load the Kokoro TTS model on startup
async function initTTS() {
  try {
    console.log("Initializing Kokoro TTS model (q8 quantized)...");
    tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: "q8",
      device: "cpu", // Node.js environment runs on CPU
      session_options: {
        intraOpNumThreads: 8,
        interOpNumThreads: 8,
      }
    });
    console.log("Kokoro TTS model loaded successfully and ready!");
  } catch (error) {
    console.error("Failed to load Kokoro TTS model:", error);
    process.exit(1);
  }
}

// Available Voices
const VOICES = {
  // Female Voices
  "af_heart": "Heart - Soft & Seductive (Default)",
  "af_allison": "Allison - Natural & Sexy",
  "af_bella": "Bella - Sweet Seductress",
  "af_jessica": "Jessica - Mature Aunty",
  "af_sarah": "Sarah - Clear & Emotional",
  // Male Voices
  "am_adam": "Adam - Realistic Male"
};

// API Endpoint to convert text to speech
app.post("/api/tts", async (req, res) => {
  const { text, voice } = req.body;

  if (!text || typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "Text is required and must be a string." });
  }

  const selectedVoice = voice && VOICES[voice] ? voice : "af_heart";

  try {
    console.log(`Generating speech for voice [${selectedVoice}]. Text length: ${text.length} chars.`);
    
    // Generate the audio object using the stable generate method (fixes the kokoro-js stream hanging bug)
    const audio = await tts.generate(text, {
      voice: selectedVoice,
    });

    // Convert the RawAudio ArrayBuffer directly into a Node.js Buffer
    const wavBuffer = Buffer.from(audio.toWav());

    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": wavBuffer.length,
    });
    
    res.send(wavBuffer);
    console.log(`Speech generated and sent successfully! Size: ${wavBuffer.length} bytes.`);
  } catch (error) {
    console.error("Error generating text-to-speech:", error);
    res.status(500).json({ error: "Failed to generate speech. Please check backend logs." });
  }
});

// API Endpoint to generate story using Gemini API
app.post("/api/generate-story", async (req, res) => {
  const { prompt, apiKey, genre, length } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(400).json({ error: "Gemini API Key is missing. Please provide it in the UI or set it on the server." });
  }

  try {
    console.log(`Generating story for prompt: "${prompt.substring(0, 45)}...", genre: ${genre}, length: ${length}`);
    
    // Construct instructions based on genre and length
    let wordCount = "400";
    if (length === "short") wordCount = "150";
    if (length === "long") wordCount = "800";
    if (length === "extra_long") wordCount = "2000";
    if (length === "full_story") wordCount = "5000";

    const systemPrompt = `You are a creative writer. Write a highly engaging, emotional, and descriptive story based on the user prompt. 
Use punctuation marks (commas, periods, ellipses) effectively to create natural pauses when read aloud.
Return only the story text itself. Do not include any intro, titles, or outro notes.
Genre: ${genre || "Drama"}
Target Word Count: around ${wordCount} words.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser Prompt: ${prompt}`
              }
            ]
          }
        ],
        safetySettings: [
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response structure
    const storyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!storyText) {
      throw new Error("Invalid response format from Gemini API.");
    }

    res.json({ story: storyText.trim() });
    console.log("Story generated successfully!");
  } catch (error) {
    console.error("Error generating story:", error);
    res.status(500).json({ error: `Failed to generate story: ${error.message}` });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`  Voicefiy AI Server (Developed by Abhishek)`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`===============================================`);
  await initTTS();
});
