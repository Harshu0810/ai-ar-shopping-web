// ai-backend/server.mjs
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { client } from "@gradio/client";
import { createClient } from "@supabase/supabase-js";

const app = express();

// --- FIXED CORS SECTION ---
// 1. Allow all origins (for now) to prevent blocking
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Handle "Preflight" requests (The browser checks this before sending data)
app.options('*', cors());
// ---------------------------

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

app.post('/generate-tryon', async (req, res) => {
  const { personUrl, garmentUrl } = req.body;

  // Manual CORS Header injection (Backup safety)
  res.header("Access-Control-Allow-Origin", "*");

  if (!personUrl || !garmentUrl) {
    return res.status(400).json({ error: "Missing image URLs" });
  }

  console.log(`Processing: ${personUrl} + ${garmentUrl}`);

  try {
    const hf_app = await client("yisol/IDM-VTON");
    
    const result = await hf_app.predict("/tryon", [
      { "background": await fetch(personUrl).then(r => r.blob()), "layers": [], "composite": null },
      await fetch(garmentUrl).then(r => r.blob()),
      "", true, false, 30, 42
    ]);

    const tempUrl = result.data[0].url;
    const imageRes = await fetch(tempUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const filename = `tryon_${Date.now()}.png`;

    const { error } = await supabase.storage.from('try-on-results').upload(filename, buffer, { contentType: 'image/png' });
    if (error) throw error;

    const { data } = supabase.storage.from('try-on-results').getPublicUrl(filename);
    
    res.json({ success: true, url: data.publicUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
