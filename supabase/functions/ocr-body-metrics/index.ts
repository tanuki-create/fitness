import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "https://deno.land/x/google_generative_ai@0.3.1/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PROMPT_TEXT = `You are an expert data extraction assistant specializing in fitness and health reports.
Your task is to analyze the provided image of a Japanese InBody analysis sheet (like the InBody 380N) and extract key metrics.
Return ONLY a valid JSON object with the exact schema below. Do not include any other text, explanations, or markdown formatting.
If a value for a key cannot be found, the value for that key should be null.

JSON Schema:
{
  "name": <string | null>, // ID
  "age": <number | null>, // 年齢
  "height": <number | null>, // 身長 (cm)
  "weight": <number | null>, // 体重 (kg)
  "bodyFatPercentage": <number | null>, // 体脂肪率 (%)
  "skeletalMuscleMass": <number | null>, // 筋肉量 (kg) from the ② "筋肉-脂肪" section
  "bodyFatMass": <number | null>, // 体脂肪量 (kg) from the ② "筋肉-脂肪" section
  "smi": <number | null>, // 骨格筋指数 (SMI) (kg/m^2)
  "bmr": <number | null>, // 基礎代謝量 (kcal)
  "visceralFatLevel": <number | null>, // 内臓脂肪レベル
  "inbodyScore": <number | null> // InBody点数
}

Extraction Instructions:
- Find the most recent measurement. On the "体成分履歴" (Body Composition History) chart, this is the right-most column.
- 'name' (ID): Extract the ID, often a name.
- 'age' (年齢): Extract the age.
- 'height' (身長): Extract the height.
- 'weight' (体重): Get the value from the ② "筋肉-脂肪" (Soft Lean-Fat Analysis) section, not the history.
- 'bodyFatPercentage' (体脂肪率): Get the value from the ③ "肥満指標" (Obesity Index Analysis) section.
- 'skeletalMuscleMass' (筋肉量): Use the "筋肉量" (Soft Lean Mass) value from the ② "筋肉-脂肪" section.
- 'bodyFatMass' (体脂肪量): Use the value from the ② "筋肉-脂肪" section.
- 'smi' (骨格筋指数): Found in the ⑩ "研究項目" (Research Parameters) section.
- 'bmr' (基礎代謝量): Found in the ⑩ "研究項目" (Research Parameters) section.
- 'visceralFatLevel' (内臓脂肪レベル): Found in the ⑨ "体重調節" (Weight Control) section.
- 'inbodyScore' (InBody点数): Found in the ⑦ "InBody点数" (InBody Score) section.
`;

// Helper to fetch image data and convert to Base64
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageBase64 = await imageUrlToBase64(imageUrl);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT_TEXT },
            {
              inlineData: {
                mimeType: "image/jpeg", 
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const responseJson = JSON.parse(result.response.text());

    // The function now ONLY returns the extracted data. 
    // The server action will be responsible for saving it to the database.
    return new Response(JSON.stringify(responseJson), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 