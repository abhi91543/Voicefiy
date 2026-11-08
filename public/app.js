document.addEventListener("DOMContentLoaded", () => {
  // Elements for AI Story Generator
  const promptInput = document.getElementById("prompt-input");
  const genreSelect = document.getElementById("genre-select");
  const lengthSelect = document.getElementById("length-select");
  const apiKeyInput = document.getElementById("api-key-input");
  const toggleKeyBtn = document.getElementById("toggle-key-btn");
  const generateStoryBtn = document.getElementById("generate-story-btn");

  // Elements for Voiceover Generation
  const textInput = document.getElementById("text-input");
  const charCount = document.getElementById("char-count");
  const wordCount = document.getElementById("word-count");
  const estimatedDuration = document.getElementById("estimated-duration");
  const voiceSelect = document.getElementById("voice-select");
  const speedSlider = document.getElementById("speed-slider");
  const speedVal = document.getElementById("speed-val");
  const pitchToggle = document.getElementById("pitch-toggle");
  const generateBtn = document.getElementById("generate-btn");
  
  // Elements for Progress Bar
  const progressContainer = document.getElementById("progress-container");
  const progressPercentage = document.getElementById("progress-percentage");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressSentenceCount = document.getElementById("progress-sentence-count");
  const progressTimeRemaining = document.getElementById("progress-time-remaining");

  // Elements for Results
  const resultContainer = document.getElementById("result-container");
  const visualizer = document.querySelector(".visualizer-container");
  const audioPlayer = document.getElementById("audio-player");
  const exactDuration = document.getElementById("exact-duration");
  const downloadBtn = document.getElementById("download-btn");

  let currentAudioUrl = null;

  // Load Saved API Key on Load
  const savedKey = localStorage.getItem("gemini_api_key");
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  // Toggle API Key Show/Hide Password
  toggleKeyBtn.addEventListener("click", () => {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      toggleKeyBtn.textContent = "Hide";
    } else {
      apiKeyInput.type = "password";
      toggleKeyBtn.textContent = "Show";
    }
  });

  // Calculate live word count and speaking time estimates
  function updateTextStats() {
    const text = textInput.value;
    charCount.textContent = text.length;

    // Word count calculation
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(w => w.length > 0).length;
    wordCount.textContent = words;

    // Speaking duration estimation (Average speech rate: ~140 Words Per Minute)
    const speed = parseFloat(speedSlider.value);
    const wpm = 140 * speed;
    const estimatedSeconds = words > 0 ? Math.ceil((words / wpm) * 60) : 0;

    const mins = Math.floor(estimatedSeconds / 60);
    const secs = estimatedSeconds % 60;
    estimatedDuration.textContent = estimatedSeconds > 0 ? `${mins > 0 ? mins + "m " : ""}${secs}s` : "0s";
  }

  // Handle AI Story Generation
  generateStoryBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const genre = genreSelect.value;
    const length = lengthSelect.value;

    if (!prompt) {
      alert("Please enter a story topic or prompt.");
      return;
    }

    if (!apiKey) {
      alert("Please enter your Gemini API Key first. You can get a free one from Google AI Studio.");
      return;
    }

    // Save API key locally
    localStorage.setItem("gemini_api_key", apiKey);

    // Toggle loading state
    generateStoryBtn.classList.add("loading-story");

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, apiKey, genre, length }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate story.");
      }

      const data = await response.json();
      
      // Load generated story into main textarea
      textInput.value = data.story;
      
      // Trigger live updates for stats
      updateTextStats();

      // Scroll smoothly down to the textarea so the user can read it
      textInput.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
      console.error(error);
      alert(`Error generating story: ${error.message}`);
    } finally {
      generateStoryBtn.classList.remove("loading-story");
    }
  });

  // Event Listeners for Live Character & Word Statistics
  textInput.addEventListener("input", updateTextStats);

  // Speed Slider Label Update & Live Estimate Update
  speedSlider.addEventListener("input", () => {
    const val = parseFloat(speedSlider.value).toFixed(2);
    speedVal.textContent = `${val}x`;
    
    // Update live speaking time estimate
    updateTextStats();

    // Update active player rate if already loaded
    if (audioPlayer.src) {
      applyPlaybackSettings();
    }
  });

  // Pitch Toggle Update
  pitchToggle.addEventListener("change", () => {
    if (audioPlayer.src) {
      applyPlaybackSettings();
    }
  });

  // Function to apply custom speed & pitch preservation
  function applyPlaybackSettings() {
    try {
      const rate = parseFloat(speedSlider.value);
      audioPlayer.playbackRate = rate;
      
      // preservesPitch determines if the browser stretches the audio without changing pitch.
      // Setting it to false lets the pitch drop naturally as it slows down.
      audioPlayer.preservesPitch = pitchToggle.checked;
    } catch (e) {
      console.warn("Playback settings adjustment not fully supported in this browser:", e);
    }
  }

  // Visualizer Animation Hooks
  audioPlayer.addEventListener("play", () => {
    visualizer.classList.add("playing");
    applyPlaybackSettings(); // Ensure rate is applied when playing starts
  });

  audioPlayer.addEventListener("pause", () => {
    visualizer.classList.remove("playing");
  });

  audioPlayer.addEventListener("ended", () => {
    visualizer.classList.remove("playing");
  });

  // Re-apply rate settings on playing/rate changes
  audioPlayer.addEventListener("ratechange", () => {
    const expectedRate = parseFloat(speedSlider.value);
    if (audioPlayer.playbackRate !== expectedRate) {
      audioPlayer.playbackRate = expectedRate;
    }
  });

  // Get and display the exact duration when audio file metadata loads
  audioPlayer.addEventListener("loadedmetadata", () => {
    const durationSeconds = Math.ceil(audioPlayer.duration);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    exactDuration.textContent = `${mins > 0 ? mins + "m " : ""}${secs}s`;
  });

  // Sentence Splitter Utility
  function splitIntoSentences(text) {
    // Split text by punctuation marks (. ! ? etc.) and line breaks (\n)
    // while keeping the punctuation mark attached to the sentence.
    return text
      .split(/([.!?]+|\n)/g)
      .reduce((acc, current, index) => {
        if (index % 2 === 0) {
          if (current.trim() !== "") {
            acc.push(current.trim());
          }
        } else {
          if (acc.length > 0 && current !== "\n") {
            acc[acc.length - 1] += current;
          }
        }
        return acc;
      }, []);
  }

  // Concatenate multiple IEEE Float32 WAV files into a single master WAV Blob
  function mergeWavBlobs(blobs) {
    if (blobs.length === 0) return null;
    if (blobs.length === 1) return blobs[0];

    return Promise.all(blobs.map(blob => blob.arrayBuffer())).then(buffers => {
      // Each WAV file has a 44-byte header.
      // Total PCM data byte size is the sum of the byte size of each file minus its header.
      let totalSamplesByteLength = 0;
      for (const buf of buffers) {
        totalSamplesByteLength += (buf.byteLength - 44);
      }

      // Create combined ArrayBuffer (44 bytes header + combined PCM data bytes)
      const combinedBuffer = new ArrayBuffer(44 + totalSamplesByteLength);
      const combinedView = new DataView(combinedBuffer);

      // Copy the 44-byte WAV header of the first segment
      const firstHeader = new Uint8Array(buffers[0], 0, 44);
      new Uint8Array(combinedBuffer).set(firstHeader, 0);

      // Update RIFF chunk length (at byte offset 4: 36 + total data size)
      combinedView.setUint32(4, 36 + totalSamplesByteLength, true);

      // Update data chunk length (at byte offset 40: total data size)
      combinedView.setUint32(40, totalSamplesByteLength, true);

      // Copy PCM raw samples sequentially
      let writeOffset = 44;
      for (const buf of buffers) {
        const pcmData = new Uint8Array(buf, 44);
        new Uint8Array(combinedBuffer).set(pcmData, writeOffset);
        writeOffset += pcmData.byteLength;
      }

      return new Blob([combinedBuffer], { type: "audio/wav" });
    });
  }

  // Generate Audio Action
  generateBtn.addEventListener("click", async () => {
    const rawText = textInput.value.trim();
    const voice = voiceSelect.value;

    if (!rawText) {
      alert("Please enter some text to generate speech.");
      return;
    }

    // Split text into individual sentence chunks
    const sentences = splitIntoSentences(rawText);
    if (sentences.length === 0) {
      alert("No valid sentences found to convert.");
      return;
    }

    // Set UI States (Show progress bar, hide player)
    generateBtn.classList.add("loading");
    resultContainer.classList.add("hide");
    visualizer.classList.remove("playing");
    
    progressPercentage.textContent = "0%";
    progressBarFill.style.width = "0%";
    progressSentenceCount.textContent = `0 / ${sentences.length}`;
    progressTimeRemaining.textContent = "Calculating...";
    progressContainer.classList.remove("hide");

    const voiceChunks = [];
    const generationStartTime = Date.now();

    try {
      // Sequentially generate speech for each sentence chunk
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        
        // Update stats on progress bar
        progressSentenceCount.textContent = `${i + 1} / ${sentences.length}`;

        // Call backend API for this single sentence chunk
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: sentence, voice }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed at sentence ${i + 1}`);
        }

        const audioBlob = await response.blob();
        voiceChunks.push(audioBlob);

        // Update progress bar measurements
        const completedCount = i + 1;
        const percent = Math.round((completedCount / sentences.length) * 100);
        progressPercentage.textContent = `${percent}%`;
        progressBarFill.style.width = `${percent}%`;

        // Calculate running average time per sentence to estimate remaining time
        const elapsedSoFar = Date.now() - generationStartTime;
        const avgTimePerSentence = elapsedSoFar / completedCount;
        const remainingSentences = sentences.length - completedCount;
        const estSecondsLeft = Math.ceil((avgTimePerSentence * remainingSentences) / 1000);

        if (remainingSentences > 0) {
          const remMins = Math.floor(estSecondsLeft / 60);
          const remSecs = estSecondsLeft % 60;
          progressTimeRemaining.textContent = `${remMins > 0 ? remMins + "m " : ""}${remSecs}s`;
        } else {
          progressTimeRemaining.textContent = "Stitching audio...";
        }
      }

      // Merge all generated WAV segments into a single WAV audio file
      const masterBlob = await mergeWavBlobs(voiceChunks);
      
      // Clean up previous URL if it exists
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }

      // Create local URL for player and download action
      currentAudioUrl = URL.createObjectURL(masterBlob);
      audioPlayer.src = currentAudioUrl;

      // Configure initial rate and pitch settings
      applyPlaybackSettings();

      // Hook up download link
      downloadBtn.href = currentAudioUrl;
      
      // Format file name based on voice & prompt snippet
      const cleanSnippet = rawText.slice(0, 15).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      downloadBtn.download = `voicefiy_${voice}_${cleanSnippet}.wav`;

      // Hide progress container and show audio player
      progressContainer.classList.add("hide");
      resultContainer.classList.remove("hide");

      // Auto play generated audio
      audioPlayer.play().catch(e => console.log("Auto-play blocked by browser. Click play to listen."));

    } catch (error) {
      console.error(error);
      alert(`Error during voice generation: ${error.message}`);
      progressContainer.classList.add("hide");
    } finally {
      generateBtn.classList.remove("loading");
    }
  });
});
