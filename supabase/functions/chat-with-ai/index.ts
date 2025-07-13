import { serve } from "std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define the shape of a chat message
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Helper to format data sections for the prompt
function formatSection(title: string, data: any): string {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return "";
  }
  return `\n## ${title}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    if (!messages || !userId) {
      return new Response(JSON.stringify({ error: "messages and userId are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // --- Data Fetching ---
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: goal } = await supabase.from('goals').select('*').eq('user_id', userId).eq('is_active', true).single();
    const { data: bodyMetrics } = await supabase.from('body_metrics').select('*').eq('user_id', userId).order('measured_at', { ascending: false }).limit(5);
    const { data: workoutHistory } = await supabase.from('workout_logs').select('exercise,sets,reps,performed_at').eq('user_id', userId).order('performed_at', { ascending: false }).limit(10);
    const { data: plan } = await supabase.from('plans').select('*, plan_workouts(*)').eq('user_id', userId).eq('is_selected', true).single();
    
    // --- Prompt Engineering ---
    let contextPrompt = `あなたは、世界クラスの共感的でデータ駆動型のパーソナルフィットネスコーチAIです。ユーザーはあなたにフィットネスに関するあらゆるデータへのアクセスを許可しています。あなたの仕事は、ユーザーの質問に対して、すべての利用可能なデータを考慮して、協力的で洞察に満ちた応答をすることです。

以下は、ユーザーに関するデータの完全なサマリーです。`;

    contextPrompt += formatSection("ユーザープロフィール", profile);
    contextPrompt += formatSection("現在のアクティブな目標", goal);
    contextPrompt += formatSection("最新の身体測定値（最大5件）", bodyMetrics);
    contextPrompt += formatSection("最近のワークアウト履歴（最大10件）", workoutHistory);
    contextPrompt += formatSection("現在選択中のトレーニングプラン", plan);
    
    contextPrompt += "\n以上の完全なコンテキストに基づき、以下の会話に続いて、簡潔で、役に立ち、励みになる応答を日本語で生成してください。";
    
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construct the history for the model
    const history = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // The last message is the current user prompt
    const userPrompt = history.pop(); 
    if (!userPrompt) {
        throw new Error("No user message found");
    }

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: contextPrompt }] },
        { role: "model", parts: [{ text: "はい、承知いたしました。ユーザーのすべてのデータを考慮して、最適なフィットネスコーチとして応答します。どのようなご用件でしょうか？" }] },
        ...history
      ],
    });

    const result = await chat.sendMessage(userPrompt.parts);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ reply: text }), {
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