# Fitness Coaching AI Web App — MVP 要件定義

## 1. 背景 (Context)

*   自宅トレーニングやジム利用者向けに、AI がリアルタイムでパーソナライズしたアドバイスを提供するサービス需要が高まっている。
*   先行プロトタイプは SwiftUI で検討していたが、**最小実用プロダクト (MVP)** をまず Web で提供し、早期ユーザー検証を行う。

**現在の方針:** 認証機能は複雑性が高くエラーの原因となったため、MVP v1では一時的に認証をスキップし、主要機能（トレーニング記録・AIアドバイス）の開発と検証を最優先します。

## 2. 目的 (Goals)

| #  | ゴール                 | 測定指標 (Metric)              |
| -- | ------------------- | -------------------------- |
| G1 | 早期ユーザー 100 名による利用実績 | ">=100 MAU" within 30 days |
| G2 | AI アドバイス機能の価値検証     | 70% 以上のユーザーが「役立つ」と回答       |
| G3 | 体重/体脂肪入力の UX 検証     | 1 セッション当たり平均入力時間 < 60 秒    |

## 3. 主要ユーザーペルソナ

| ペルソナ          | 特徴                              |
| ------------- | ------------------------------- |
| Rookie Runner | 20 代、ジム初心者、週 1-2 回の運動。体重管理が主目的。 |
| Busy Worker   | 30 代、在宅勤務中心。短時間ワークアウトで筋力維持が目的。  |

## 4. スコープ (In/Out)

### 4.1 In-Scope (MVP 内)

*   **(v2以降)** ユーザー登録 (メール/パスワード)
*   **トレーニング記録** (種目・レップス・セット・ボリューム) & AI リアクション
*   手動ログ入力 (体重・体脂肪)
* 画像アップロード (体重計ディスプレイ / InBody レポート) + VLM による自動数値抽出
* ゴール設定 & プラン提示 (3 案)
* AI アドバイス (Edge Function + GPT-4o-mini 呼び出し)
* シンプルなダッシュボード (週間ログ & アドバイス一覧)
* Supabase Auth / Database / Storage 利用

### 4.2 Out-of-Scope (除外)

*   **(v1 MVPでは除外)** ユーザー登録 (メール/パスワード)
*   スマートデバイス連携 (HealthKit/Garmin 等)
*   コミュニティ機能・SNS シェア

## 5. 機能要件 (Functional Requirements)

| FR ID | 機能 | 詳細 |
| ----- | ---------------- | ------------------------------------------------------------------------------------ |
| FR-01 | **(v2以降)** アカウント登録 & 認証 | Supabase Auth。メール確認必須。 |
| FR-02 | ゴール設定 & プラン提示 | 目標タイプ (減量/維持/増量/減脂)、目標値、期限を入力 → トレ頻度別 3 プランを提案、ユーザーが 1 つ選択。 |
| FR-03 | トレーニング記録         | `exercise`, `reps`, `sets`, `volume`, `performed_at` を入力。                            |
| FR-04 | トレーニング AI リアクション | 記録ごとに Edge Function `react-training` が発火し、ロードマップ差分を解析しアドバイスを返却 (休養提案・補助種目・共感メッセージ等)。 |
| FR-05 | 体重/体脂肪ログ入力       | フォーム入力 or 画像 OCR (Edge Function `ocr-body-metrics`) で自動取得。                           |
| FR-06 | アドバイス閲覧          | ダッシュボードで時系列カード表示。既読/未読管理。                                                            |
| FR-07 | 週間レポートメール        | pg\_cron + Edge Function で毎週月曜 9:00 に送信。                                             |

## 6. 非機能要件 (NFR) (NFR)

| カテゴリ | 要件 |
| -------- | --------------------------------------- |
| 性能 | Edge 呼び出し p95 レイテンシ < 300 ms (JP リージョン) |
| セキュリティ | **(v2以降)** RLS による行レベル制御; JWT 失効チェック |
| スケーラビリティ | 1 万 MAU まで追加コスト < \$100/月 |
| 可用性 | 99.5% / 月 |
| プライバシー | 体重・体脂肪は暗号化転送 (HTTPS) ／画像は 30 日で自動削除     |

## 7. システム構成

```
Browser (React) → Edge Function (Deno) → Postgres (Supabase)
                                 ↓
                              OpenAI GPT‑4o‑mini Vision / Gemini Flash
```

## 8. 技術スタック

* **フロント**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
* **状態管理**: React Query (サーバー状態) + React Context / ローカル state
* **バックエンド**: Supabase (Auth, Postgres, Storage, Edge Functions, Realtime)
* **AI / VLM**:

  * GPT-4o-mini Vision (OCR & アドバイス)
  * Gemini 2.5 Flash fallback
* **CI/CD**: GitHub Actions + Vercel (Preview Deployment)
* **イベント駆動**: Supabase Realtime → `react-training` Edge Function トリガー（DB 新規行検知）

## 9. API 概要 (Edge Functions)

| 名称               | メソッド              | Path                | ボディ                                             | 戻り値                                    |
| ---------------- | ----------------- | ------------------- | ----------------------------------------------- | -------------------------------------- |
| get-advice       | POST              | `/get-advice`       | `{ goalId }`                                    | `{ advice: string }`                   |
| log-workout      | POST              | `/log-workout`      | `{ exercise, reps, sets, volume, performedAt }` | `{ ok: true }`                         |
| react-training   | POST (DB trigger) | `/react-training`   | `{ workoutId }`                                 | `{ message: string }`                  |
| ocr-body-metrics | POST              | `/ocr-body-metrics` | `{ imageUrl }`                                  | `{ weight: number, bodyFat?: number }` |
| weekly-summary   | POST (cron)       | `/weekly-summary`   | `-`                                             | `-`                                    |

## 10. UX/UI 要件

1. **シングルページ**で完結; トップにログ入力、下部にアドバイスタイムライン
2. 入力は **1 カラム縦並び**。Numeric キーボード自動表示。
3. アドバイスカードは **色分け** (未読=ブルー、既読=グレー)
4. モバイル優先 (min width 375px)

## 11. マイルストーン

| 期日 | マイルストーン |
| --- | -------------------------------- |
| ✅ W+1 | Supabaseプロジェクト作成 & クラウドDBマイグレーション完了 |
| ➡️ W+2 | フロントエンド CRUD (ログ入力) 実装 |
| W+3 | AI & VLM 統合、内部 QA |
| W+4 | クローズド β (10–20 人) |
| W+6 | MVP 公開 & ユーザーヒアリング |

## 12. リスク & 対策

| リスク          | インパクト | 対策                                    |
| ------------ | ----- | ------------------------------------- |
| GPT API コスト増 | 中     | GPT‑4o‑mini, Fail-fast 変換, Token 上限設定 |
| OCR 精度不足     | 高     | VLM + ユーザー確認画面; 評価データを学習に活用           |
| 画像アップロード遅延   | 中     | クライアントでリサイズ (<=1280px) & CDN 直送       |

---

> **次ステップ候補**
>
> 1.  テーブルスキーマ SQL draft (body\_metrics 画像列含む)
> 2.  Edge Function `ocr-body-metrics` のプロンプト & 型定義
> 3.  Next.js 画像アップロード実装 (Supabase Storage 署名 URL)

## 13. テーブルスキーマ — SQL Draft

**注:** MVP v1では認証をスキップするため、`user_id` はNullableとし、RLSは一時的に無効化または全許可ポリシーを適用します。v2で認証を導入する際に`NOT NULL`制約と厳格なRLSを再設定します。

```sql
-- body_metrics
create table public.body_metrics (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade, -- NOT NULLはv2で追加
  measured_at  timestamptz not null default now(),
  weight       numeric(5,2) check (weight > 0),
  body_fat     numeric(5,2) check (body_fat between 1 and 80),
  photo_url    text,                       -- Supabase Storage object URL
  created_at   timestamptz default now()
);
create index on public.body_metrics(user_id, measured_at desc);

alter table public.body_metrics enable row level security;
create policy "Body metrics public for now" on public.body_metrics
  for all using (true); -- v2で (auth.uid() = user_id) に変更

-- workout_logs (AI リアクション対象)
create table public.workout_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade, -- NOT NULLはv2で追加
  exercise     text not null,
  reps         int  not null check (reps > 0),
  sets         int  not null check (sets > 0),
  volume       numeric(8,2),                -- optional kg*reps*sets
  performed_at timestamptz not null default now(),
  created_at   timestamptz default now()
);
create index on public.workout_logs(user_id, performed_at desc);

alter table public.workout_logs enable row level security;
create policy "Workout logs public for now" on public.workout_logs
  for all using (true); -- v2で (auth.uid() = user_id) に変更
```

## 14. Edge Function `ocr-body-metrics`

### Type Definitions (Deno TS)

```ts
type OCRRequest = {
  imageUrl: string; // Supabase Storage の署名付き URL
};

type OCRResponse = {
  weight: number | null;
  bodyFat: number | null;
};
```

### Prompt (GPT‑4o Vision)

```text
<system>
You are a fitness assistant. Extract numeric values from an image of either a weight scale display or an InBody report.
Return ONLY JSON with the following schema:
{
  "weight": <kg or null>,
  "bodyFat": <percentage or null>
}
Typical ranges: weight 20‑250 kg, bodyFat 3‑60 %. Ignore any other text.
</system>
<user>
<Image: {{imageUrl}}>
</user>
```

### Skeleton Implementation (Deno)

```ts
import { serve } from "https://deno.land/std/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.20/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const openai   = new OpenAI();

serve(async (req) => {
  const { imageUrl } = await req.json() as { imageUrl: string };
  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    images: [{ type: "image_url", url: imageUrl }],
    messages: [{ role: "system", content: PROMPT_TEXT }],
    response_format: { type: "json_object" },
    max_tokens: 60,
  });
  const { weight, bodyFat } = JSON.parse(chat.choices[0].message.content);
  // 認証をスキップするため、ユーザー取得はv2で実装
  // const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  // const { data: { user } } = await supabase.auth.getUser(jwt!);
  
  // v1ではuser_idなしでinsertするか、固定のテストユーザーIDを使用
  if (weight || bodyFat) {
    await supabase.from("body_metrics").insert({
      // user_id: user.id, // v2で有効化
      weight,
      body_fat: bodyFat,
      photo_url: imageUrl,
    });
  }
  return new Response(JSON.stringify({ weight, bodyFat }), { status: 200 });
});
```

## 15. Next.js — 画像アップロード & OCR 呼び出し

```tsx
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function uploadAndParse(file: File /*, userId: string */) { // userIdはv2で追加
  const path = `bodies/public/${uuidv4()}.jpg`; // 認証がないためpublicパスに保存
  // 1️⃣ ストレージへアップロード
  const { error: upErr } = await supabase.storage.from('body-images').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  // 2️⃣ 署名付き URL 取得 (60 秒有効)
  const { data: signed, error: signErr } = await supabase.storage
    .from('body-images')
    .createSignedUrl(path, 60);
  if (signErr || !signed) throw signErr;

  // 3️⃣ Edge Function 呼び出し
  const { data: metrics, error } = await supabase.functions.invoke('ocr-body-metrics', {
    body: { imageUrl: signed.signedUrl },
  });
  if (error) throw error;
  return metrics as { weight: number | null; bodyFat: number | null };
}
```

---

16. 実装計画タスクリスト ✅
<details> <summary>🛠️ プロジェクト準備</summary>
 GitHub リポジトリ作成（monorepo）
 
 /web/ ― Next.js 14 プロジェクト
 
 /supabase/ ― SQL マイグレーション & Edge Functions
 
 .env.example に環境変数テンプレート用意
 
 (Optional) DevContainer／VS Code Remote-Containers 設定
 
</details> <details> <summary>🗄️ データベース & RLS</summary>
 001_init.sql — body_metrics, workout_logs, goals, advices など作成
 
 002_rls.sql — 各テーブル Row-Level Security ポリシー定義
 
 supabase db push で Cloud DB にマイグレーションを反映
 
</details> <details> <summary>☁️ Edge Functions (Deno)</summary>
 get-advice — 目標ベース AI アドバイス生成

 react-training — 新規ワークアウトに反応してメッセージ生成

 ocr-body-metrics — 画像→体重/体脂肪 OCR (VLM)

 weekly-summary — 週次メール送信 (Cron)

 各 Function に deno.json & 単体テスト作成

</details> <details> <summary>🖼️ ストレージ & Vault</summary>
 Storage バケット body-images 作成（TTL 30 日）

 Supabase Vault に OPENAI_KEY, SMTP_PASS 登録

</details> <details> <summary>🌐 フロントエンド (Next.js 14)</summary>
 Tailwind/ESLint/Prettier セットアップ

 Supabase クライアント lib/supabase.ts

 ページ構成

 /sign-in / /sign-up

 /dashboard (ログ入力 + アドバイス TL)

 コンポーネント

 TrainingForm

 ImageUploader

 GoalPlanner

 AdviceCard

 Hooks

 useRealtimeWorkout (WS 更新)

 useUploadAndParse (画像→OCR)

</details> <details> <summary>🔄 CI/CD</summary>
 web.yml ― Lint → Test → Vercel Preview Deploy

 supabase.yml ― Edge Functions 自動デプロイ

</details> <details> <summary>📨 メール & Cron</summary>
 HTML テンプレート summary.html

 pg_cron で月曜 9:00 に weekly-summary 実行

</details> <details> <summary>✅ テスト</summary>
 単体テスト (Vitest)

 E2E テスト (Playwright: 画像アップロード & OCR パス)

</details> <details> <summary>🚀 ベータリリース</summary>
 Vercel Production 環境公開

 クローズド β 招待（10–20 名）

 KPI ダッシュボード（MAU・アドバイス CTR）作成

</details>
進め方 : GitHub Projects に各タスクをカード化し、担当者・期日・優先度を設定して進捗を管理してください。








Sources

Ask ChatGPT
You said:
より詳細に
ファイル名および使う技術を明記


ChatGPT said:
実装計画タスクリスト（詳細版）
― ファイル名・使用技術まで明記 ―

#	セクション	チェック	詳細タスク	主なファイル / ディレクトリ	使用技術
0	Repo 構成	☐	GitHub monorepo 初期化	/<root>	Git, GitHub
☐	package.json（workspace 定義）	package.json	pnpm / npm
☐	(Optional) DevContainer 追加	.devcontainer/	Docker, VS Code
1	DB & RLS	☐	初期マイグレーション作成	supabase/migrations/001_init.sql	PostgreSQL
☐	RLS ポリシー	supabase/migrations/002_rls.sql	Supabase RLS
☐	クラウドDBへ反映	`supabase db push`	Supabase CLI
2	Edge Functions	☐	get-advice	supabase/functions/get-advice/index.ts	Deno, OpenAI SDK
☐	react-training (DB Trigger)	supabase/functions/react-training/index.ts	Supabase Realtime
☐	ocr-body-metrics	supabase/functions/ocr-body-metrics/index.ts	GPT-4o-mini Vision
☐	weekly-summary	supabase/functions/weekly-summary/index.ts	pg_cron, Supabase SMTP
☐	各関数テスト	supabase/functions/**/__tests__/	Deno test
3	ストレージ & Vault	☐	バケット作成	Supabase Studio	—
☐	Policy JSON	supabase/storage/policies/body-images.sql	SQL
☐	Vault 秘匿キー登録	Supabase Vault	—
4	フロント (Next.js 14)	☐	プロジェクト生成	web/	Next.js 14, TypeScript
☐	Tailwind & shadcn/ui 設定	tailwind.config.ts	Tailwind CSS
☐	Supabase クライアント	web/lib/supabase.ts	@supabase/supabase-js v2
☐	認証ページ	web/app/(auth)/sign-in/page.tsx	React Hook Form
☐	ダッシュボード	web/app/dashboard/page.tsx	React Query
☐	TrainingForm	web/components/TrainingForm.tsx	Zod validation
☐	ImageUploader	web/components/ImageUploader.tsx	react-dropzone, Supabase Storage
☐	GoalPlanner	web/components/GoalPlanner.tsx	Radix UI Popover
☐	AdviceCard	web/components/AdviceCard.tsx	Framer Motion
☐	Hooks (useRealtimeWorkout, useUploadAndParse)	web/hooks/	React Query, Supabase Realtime
5	CI/CD	☐	Lint + Test workflow	.github/workflows/web.yml	ESLint, Vitest
☐	Supabase deploy workflow	.github/workflows/supabase.yml	Supabase CLI
☐	Vercel preview ⇒ prod	Vercel Project	Vercel Git integration
6	メール & Cron	☐	HTML テンプレート	supabase/emails/summary.html	MJML
☐	weekly-summary cron登録	supabase/sql/cron.sql	pg_cron
7	テスト	☐	単体テスト（Edge）	supabase/functions/**/__tests__/*.test.ts	Deno test
☐	フロント単体	web/__tests__/*.test.tsx	Vitest, Testing Library
☐	E2E（画像→OCR）	tests/e2e/ocr.spec.ts	Playwright
8	ベータリリース	☐	環境変数確認 & Vercel prod deploy	—	Vercel
☐	クローズド β 招待メール	scripts/sendBetaInvites.ts	Node.js

各タスクを GitHub Projects のカードに貼り付け、担当者・期日・優先度を設定して進行してください。








Sources
