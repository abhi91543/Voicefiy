import { KokoroTTS } from "kokoro-js";

try {
  console.log("Loading KokoroTTS model on CPU with multi-threading...");
  
  // We specify session_options to set the number of threads for ONNX Runtime CPU execution
  const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "q8",
    device: "cpu",
    session_options: {
      intraOpNumThreads: 8, // Use 8 threads for operations
      interOpNumThreads: 8, // Use 8 threads for nodes
    }
  });
  console.log("Model loaded successfully!");

  console.log("Generating audio for test sentence...");
  const startTime = Date.now();
  const audio = await tts.generate("Hello, this is a test of Seductive Whispers text to speech.", {
    voice: "af_heart",
  });
  const duration = Date.now() - startTime;
  console.log(`Audio generated successfully in ${duration}ms!`);
  
  await audio.save("test-output-cpu.wav");
  console.log("Saved test-output-cpu.wav successfully!");
} catch (error) {
  console.error("An error occurred during testing:", error);
}
