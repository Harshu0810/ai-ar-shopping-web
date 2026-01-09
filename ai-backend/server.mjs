// ai-backend/server.mjs
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { client } from "@gradio/client";
import { createClient } from "@supabase/supabase-js";

const app = express();

// --- 1. MANUAL CORS OVERRIDE ( The Nuclear Fix ) ---
// This forces every response to include the permission headers
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request from ${req.headers.origin}`);
  
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // If the browser is just "asking" for permission (OPTIONS), say YES immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});
// ---------------------------------------------------

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

app.post('/generate-tryon', async (req, res) => {
  try {
    const { personUrl, garmentUrl } = req.body;

    if (!personUrl || !garmentUrl) {
      return res.status(400).json({ error: "Missing image URLs" });
    }

    console.log(`Processing: ${personUrl} + ${garmentUrl}`);

    // 1. Call Hugging Face
    const hf_app = await client("yisol/IDM-VTON");
    
    // 2. Predict
    const result = await hf_app.predict("/tryon", [
      { "background": await fetch(personUrl).then(r => r.blob()), "layers": [], "composite": null },
      await fetch(garmentUrl).then(r => r.blob()),
      "", true, false, 30, 42
    ]);

    // 3. Save Result
    const tempUrl = result.data[0].url;
    const imageRes = await fetch(tempUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const filename = `tryon_${Date.now()}.png`;

    const { error } = await supabase.storage.from('try-on-results').upload(filename, buffer, { contentType: 'image/png' });
    if (error) throw error;

    const { data } = supabase.storage.from('try-on-results').getPublicUrl(filename);
    
    console.log("Success! Returning URL:", data.publicUrl);
    res.json({ success: true, url: data.publicUrl });

  } catch (error) {
    console.error("Server Error:", error);
    // Important: Send a 500 JSON response so the frontend knows it failed nicely
    res.status(500).json({ error: "Try-On Failed", details: error.message });
  }
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
