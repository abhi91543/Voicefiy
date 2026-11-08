import { KokoroTTS } from "kokoro-js";
import { RawAudio } from "@huggingface/transformers";

const longStory = `
Once upon a time, in a quiet coastal town, there stood an old lighthouse. It had been abandoned for decades, its light long extinguished. The townsfolk whispered stories about the lighthouse, claiming it was haunted by the ghost of its last keeper, Arthur. They said Arthur still watched over the sea, waiting for a ship that never returned.
One stormy evening, a curious young woman named Clara decided to investigate. She had always been drawn to the mystery of the lighthouse. With a flashlight in hand and determination in her heart, she climbed the winding stone steps. The wind howled outside, shaking the ancient wooden frames of the windows.
When she reached the top, the room was empty, save for dust and cobwebs. But as she turned to leave, she noticed a faint warmth coming from the old lens assembly. Suddenly, a soft, warm light began to glow from the center of the tower. Clara gasped, stepping back.
In the center of the room, a gentle figure appeared. It was Arthur. He smiled warmly, not with malice, but with a sense of relief. Clara, conquering her fear, took a step forward.
"Who are you waiting for?" Clara whispered softly, her voice barely audible over the thunder.
Arthur looked out to the sea. "My daughter's ship," he replied, his voice sounding like the rustle of dry leaves. "She was lost in a storm like this, fifty years ago. I cannot rest until I know she is safe."
Clara pulled out her phone. She had researched the town's history and knew the records. "Arthur," she said gently, "her ship did not sink. It was redirected to a port further south. She lived a long, happy life and had a family of her own. She passed away peacefully, knowing you were watching over this coast."
Arthur's eyes filled with soft light. A tear seemed to roll down his spectral cheek. "She survived..." he murmured, a smile spreading across his face.
As the truth settled, the ghostly figure began to fade into the light. "Thank you, Clara," he whispered, and with a soft sigh, the lighthouse went dark once more, and the air grew still. Clara knew the keeper could finally rest.
`;

try {
  console.log("Loading KokoroTTS model on CPU with multi-threading...");
  const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "q8",
    device: "cpu",
    session_options: {
      intraOpNumThreads: 8,
      interOpNumThreads: 8,
    }
  });
  console.log("Model loaded successfully!");

  console.log("Starting generation for long story (1900+ characters)...");
  const startTime = Date.now();

  const silenceSamples = 24000 * 0.3;
  const silence = new Float32Array(silenceSamples);
  const voiceChunks = [];
  
  let sentenceCount = 0;
  for await (const chunk of tts.stream(longStory, { voice: "af_heart" })) {
    sentenceCount++;
    console.log(`- Generated sentence ${sentenceCount}...`);
    if (chunk.audio && chunk.audio.audio) {
      if (voiceChunks.length > 0) {
        voiceChunks.push(silence);
      }
      voiceChunks.push(chunk.audio.audio);
    }
  }

  console.log(`All sentences generated. Stitching ${voiceChunks.length} audio chunks...`);
  
  let totalLength = 0;
  for (const floatArr of voiceChunks) {
    totalLength += floatArr.length;
  }

  const combinedWaveform = new Float32Array(totalLength);
  let offset = 0;
  for (const floatArr of voiceChunks) {
    combinedWaveform.set(floatArr, offset);
    offset += floatArr.length;
  }

  const combinedAudio = new RawAudio(combinedWaveform, 24000);
  await combinedAudio.save("test-long-story.wav");
  
  const duration = Date.now() - startTime;
  console.log(`SUCCESS! Full story generated and saved in ${(duration / 1000).toFixed(2)}s.`);
  console.log(`Audio track length: ${(totalLength / 24000).toFixed(2)}s.`);

} catch (error) {
  console.error("Error during test:", error);
}
