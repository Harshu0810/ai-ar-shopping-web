// ai-backend/server.mjs
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { client } from "@gradio/client";
import { createClient } from "@supabase/supabase-js";

const app = express();

// --- 1. ROBUST CORS SETUP ---
// This handles the "Preflight" check that your browser is failing on
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow Vercel
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // If browser asks "Can I connect?", we immediately say "YES" (200 OK)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// --- 2. HEALTH CHECK (To prove it works) ---
app.get('/', (req, res) => {
  res.status(200).send("✅ API is Live and Listening!");
});

// --- 3. AI GENERATION ROUTE ---
app.post('/generate-tryon', async (req, res) => {
  console.log("Processing Request...");
  
  try {
    const { personUrl, garmentUrl } = req.body;
    if (!personUrl || !garmentUrl) return res.status(400).json({ error: "Missing URLs" });

    // Initialize Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Call AI
    const hf_app = await client("yisol/IDM-VTON");
    const result = await hf_app.predict("/tryon", [
      { "background": await fetch(personUrl).then(r => r.blob()), "layers": [], "composite": null },
      await fetch(garmentUrl).then(r => r.blob()),
      "", true, false, 30, 42
    ]);

    // Save Result
    const tempUrl = result.data[0].url;
    const imageRes = await fetch(tempUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const filename = `tryon_${Date.now()}.png`;

    const { error } = await supabase.storage.from('try-on-results').upload(filename, buffer, { contentType: 'image/png' });
    if (error) throw error;

    const { data } = supabase.storage.from('try-on-results').getPublicUrl(filename);
    
    res.json({ success: true, url: data.publicUrl });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate" });
  }
});

// --- PORT CONFIGURATION ---
const PORT = 8000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
