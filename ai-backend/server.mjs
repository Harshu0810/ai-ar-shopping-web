// ai-backend/server.mjs
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { client } from "@gradio/client";
import { createClient } from "@supabase/supabase-js";

const app = express();

// --- CORS Setup ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

// --- Health Check ---
app.get('/', (req, res) => res.send("✅ Server is Online!"));

// --- AI Route ---
app.post('/generate-tryon', async (req, res) => {
  console.log("🚀 Starting Request...");

  try {
    const { personUrl, garmentUrl } = req.body;
    if (!personUrl || !garmentUrl) return res.status(400).json({ error: "Missing URLs" });

    // 1. SETUP SUPABASE
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // 2. CONNECT TO AI (Official Space)
    console.log("Connecting to yisol/IDM-VTON...");
    
    // --- HARDCODE TOKEN HERE FOR TESTING ---
    // Replace the text inside quotes with your actual hf_... token
    const MY_TOKEN = "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"; 
    // ---------------------------------------

    const hf_app = await client("yisol/IDM-VTON", { hf_token: MY_TOKEN });

    console.log("✅ Connected! Predicting...");

    // 3. RUN PREDICTION
    const result = await hf_app.predict("/tryon", [
      { "background": await fetch(personUrl).then(r => r.blob()), "layers": [], "composite": null },
      await fetch(garmentUrl).then(r => r.blob()),
      "", true, false, 30, 42
    ]);

    // 4. SAVE RESULT
    const tempUrl = result.data[0].url;
    const imageRes = await fetch(tempUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const filename = `tryon_${Date.now()}.png`;

    const { error } = await supabase.storage.from('try-on-results').upload(filename, buffer, { contentType: 'image/png' });
    if (error) throw error;

    const { data } = supabase.storage.from('try-on-results').getPublicUrl(filename);
    console.log("✅ Success:", data.publicUrl);
    
    res.json({ success: true, url: data.publicUrl });

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    
    // Handle specific errors
    if (error.message.includes("Space metadata")) {
        return res.status(503).json({ error: "AI Service is busy or sleeping. Please try again in 2 minutes." });
    }
    
    res.status(500).json({ error: "Try-On Failed", details: error.message });
  }
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
