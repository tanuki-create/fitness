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
    const { goal, workoutLog, workoutHistory, userId } = await req.json();

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
ユーザーの最新のInBodyスキャン結果（アドバイスの参考にしてください）:
- 体重: ${bodyMetrics.weight || 'N/A'} kg
- 体脂肪率: ${bodyMetrics.body_fat || 'N/A'} %
- 骨格筋量: ${bodyMetrics.skeletal_muscle_mass || 'N/A'} kg
- InBody点数: ${bodyMetrics.inbody_score || 'N/A'} / 100
`;
        }
    }

    const prompt = `
      あなたは、世界クラスの共感的でやる気を起こさせるフィットネスコーチAIです。
      ユーザーがワークアウトを完了しました。あなたのタスクは、短く、励みになり、洞察に満ちたアドバイスを提供することです。

      あなたの応答は、必ず次の要件を満たしてください:
      1.  ユーザーが記録した特定のワークアウトに対する努力を認める。
      2.  そのワークアウトを長期的な目標に結びつけ、今日の努力がそれにどのように貢献するかを示す。
      3.  InBodyデータがある場合は、そのデータと今日のワークアウトを結びつけて、具体的なアドバイスをする。（例：「骨格筋量が目標に近づいていますね！今日のスクワットが効いています」）
      4.  次のセッションのための具体的で実行可能な提案を提供する。これは、新しい補助エクササイズ、重量/反復回数の増加の提案、またはフォームに関するヒントなどが考えられる。
      5.  ユーザーが非常に頻繁に（履歴に基づき連続した日数など）トレーニングしている場合は、休息の重要性を優しく示唆する。
      6.  フレンドリーで、ポジティブで、少し感情的なトーンを使う。ユーザーが理解され、サポートされていると感じられるようにする。
      7.  応答全体を2〜4文にまとめる。
      8.  日本語で応答する。

      ユーザーの目標:
      - タイプ: ${goal.goalType}
      - 目標値: ${goal.targetValue} を ${goal.targetDate}までに
      
      ${bodyMetricsPrompt}

      本日記録されたワークアウト:
      - エクササイズ: ${workoutLog.exercise}
      - セット数: ${workoutLog.sets}
      - レップ数: ${workoutLog.reps}
      - 重量: ${workoutLog.weight} kg

      最近のワークアウト履歴（頻度の文脈として）:
      - ${workoutHistory.length > 0 ? workoutHistory.map(h => `${h.date}: ${h.exercise}`).join('\\n- ') : '最近の履歴はありません。'}

      挨拶や結びの言葉は含めず、アドバイスのテキストのみを提供してください。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const advice = await response.text();

    return new Response(JSON.stringify({ advice }), {
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
