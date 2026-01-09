// index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { client } from "@gradio/client";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

app.post('/generate-tryon', async (req, res) => {
  const { personUrl, garmentUrl } = req.body;

  if (!personUrl || !garmentUrl) {
    return res.status(400).json({ error: "Missing image URLs" });
  }

  console.log(`Processing Request: ${personUrl} + ${garmentUrl}`);

  try {
    // 1. Call Hugging Face
    const hf_app = await client("yisol/IDM-VTON");
    
    // 2. Predict
    const result = await hf_app.predict("/tryon", [
      { "background": await fetch(personUrl).then(r => r.blob()), "layers": [], "composite": null },
      await fetch(garmentUrl).then(r => r.blob()),
      "",     // Description
      true,   // Auto-Masking 
      false,  // Cropping
      30,     // Steps
      42      // Seed
    ]);

    const tempUrl = result.data[0].url;

    // 3. Save to Supabase
    const imageRes = await fetch(tempUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const filename = `tryon_${Date.now()}.png`;

    const { error } = await supabase
      .storage
      .from('try-on-results')
      .upload(filename, buffer, { contentType: 'image/png' });

    if (error) throw error;

    // 4. Get Public Link
    const { data: publicData } = supabase
      .storage
      .from('try-on-results')
      .getPublicUrl(filename);

    res.json({ success: true, url: publicData.publicUrl });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Failed", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
