import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userData, goalData, userId } = await req.json();

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let bodyMetricsPrompt = "ユーザーのInBodyスキャンデータは提供されていません。";

    if (userId) {
        const { data: bodyMetrics, error: metricsError } = await supabase
            .from('body_metrics')
            .select('*')
            .eq('user_id', userId)
            .order('measured_at', { ascending: false })
            .limit(1)
            .single();

        if (metricsError && metricsError.code !== 'PGRST116') { // Ignore 'not found' error
            throw metricsError;
        }
        
        if (bodyMetrics) {
            bodyMetricsPrompt = `
ユーザーの最新のInBodyスキャン結果:
- 体重: ${bodyMetrics.weight || 'N/A'} kg
- 体脂肪率: ${bodyMetrics.body_fat || 'N/A'} %
- 骨格筋量: ${bodyMetrics.skeletal_muscle_mass || 'N/A'} kg
- 体脂肪量: ${bodyMetrics.body_fat_mass || 'N/A'} kg
- SMI (骨格筋指数): ${bodyMetrics.smi || 'N/A'}
- BMR (基礎代謝量): ${bodyMetrics.bmr || 'N/A'} kcal
- 内臓脂肪レベル: ${bodyMetrics.visceral_fat_level || 'N/A'}
- InBody点数: ${bodyMetrics.inbody_score || 'N/A'} / 100
`;
        }
    }


    const prompt = `
      あなたはエキスパートのフィットネスコーチです。以下のユーザーデータと目標に基づき、3つの異なる週間トレーニングプランの提案を作成してください。（イージー、普通、ハード）
      各プランには、タイトル、頻度（週の日数）、短い説明、週間ワークアウトスケジュール（曜日と焦点）が必要です。
      応答を有効なJSONオブジェクトの配列として返してください。JSON配列以外のテキストは含めないでください。
      JSONオブジェクトのすべての文字列（title、description、day、focus）は日本語にしてください。
      InBodyのデータがある場合は、それを最優先で考慮して、特に弱点となっている部分を改善するような、よりパーソナライズされたプランを提案してください。

      ユーザーデータ:
      - 年齢: ${userData.age}
      - 性別: ${userData.gender}
      - 身長: ${userData.height} cm
      - 体重: ${userData.weight} kg

      ${bodyMetricsPrompt}

      ユーザーの目標:
      - 目標タイプ: ${goalData.goalType}
      - 目標値: ${goalData.targetValue}
      - 目標日: ${goalData.targetDate}

      単一プランのJSONフォーマット例:
      {
        "title": "スタータープラン",
        "frequency": "3日/週",
        "description": "初心者に最適です。",
        "workouts": [
          { "day": "月曜日", "focus": "全身の筋力" },
          { "day": "水曜日", "focus": "全身の筋力" },
          { "day": "金曜日", "focus": "全身の筋力" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    // Clean up potential markdown code block fences
    const jsonText = text.replace(/```json\n|```/g, "").trim();

    // The Gemini model should return a JSON array string. We parse it here.
    const plans = JSON.parse(jsonText);

    return new Response(JSON.stringify({ plans }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
