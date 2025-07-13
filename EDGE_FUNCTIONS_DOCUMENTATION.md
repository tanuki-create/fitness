 
# Supabase Edge Functions ドキュメンテーション

## 1. 概要

このドキュメントは、このフィットネスアプリケーションで使用されているEdge Functionの詳細な仕様を記述したものです。これらのファンクションは移植可能に設計されており、他のSupabaseプロジェクトにもデプロイできます。

すべてのファンクションは、AIを活用した機能のためにGoogleのGeminiモデルを使用しており、特定の環境変数に依存して動作します。

**主要な依存関係:**
- Supabase
- Google Generative AI (Gemini)

---

## 2. ファンクション: `ocr-body-metrics`

### 2.1. 説明
このファンクションは、日本語のInBody分析シートの画像に対して光学文字認識（OCR）を実行します。主要な健康およびフィットネス指標を抽出し、構造化されたJSONオブジェクトとして返します。

### 2.2. リクエスト

- **メソッド:** `POST`
- **エンドポイント:** `(あなたのSupabaseプロジェクトURL)/functions/v1/ocr-body-metrics`
- **ヘッダー:**
  - `Authorization: Bearer <SUPABASE_ANON_KEY>`
  - `Content-Type: application/json`
- **ボディ:**

| フィールド  | 型     | 必須 | 説明                                        |
|-------------|--------|------|---------------------------------------------|
| `imageUrl`  | string | はい | 処理対象のInBodyシート画像の公開URL。       |

### 2.3. レスポンス

- **成功 (200 OK):**
  - 抽出された指標を含むJSONオブジェクトを返します。
  - **ボディスキーマ:**
    ```json
    {
      "name": "string | null",
      "age": "number | null",
      "height": "number | null",
      "weight": "number | null",
      "bodyFatPercentage": "number | null",
      "skeletalMuscleMass": "number | null",
      "bodyFatMass": "number | null",
      "smi": "number | null",
      "bmr": "number | null",
      "visceralFatLevel": "number | null",
      "inbodyScore": "number | null"
    }
    ```

- **エラー:**
  - `400 Bad Request`: `imageUrl`が提供されない場合。
  - `500 Internal Server Error`: その他の処理エラー。
  - **ボディスキーマ:** `{"error": "エラーメッセージ"}`

### 2.4. 環境変数

| 変数              | 説明                  | 値の例        |
|-------------------|-----------------------|---------------|
| `GEMINI_API_KEY`  | Google AIのAPIキー。   | `AIzaSy...`   |

### 2.5. 実行例 (cURL)

```bash
curl -X POST 'https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/functions/v1/ocr-body-metrics' \
-H 'Authorization: Bearer <YOUR-SUPABASE-ANON-KEY>' \
-H 'Content-Type: application/json' \
-d '{
  "imageUrl": "https://<...>/public/inbody-scans/scan.jpg"
}'
```

---

## 3. ファンクション: `generate-plan-suggestions`

### 3.1. 説明
ユーザーのプロフィールデータとフィットネス目標に基づいて、3つの異なる週間ワークアウトプランの提案を生成します。利用可能な場合は、ユーザーの最新の身体指標を使用して、よりパーソナライズされた推奨事項を作成します。

### 3.2. リクエスト

- **メソッド:** `POST`
- **エンドポイント:** `(あなたのSupabaseプロジェクトURL)/functions/v1/generate-plan-suggestions`
- **ヘッダー:**
  - `Authorization: Bearer <SUPABASE_ANON_KEY>`
  - `Content-Type: application/json`
- **ボディ:**

| フィールド  | 型     | 必須 | 説明                                      |
|-------------|--------|------|-------------------------------------------|
| `userData`  | object | はい | ユーザーの基本プロフィールデータ。        |
| `goalData`  | object | はい | ユーザーのフィットネス目標。              |
| `userId`    | string | いいえ | 最新の身体指標を取得するためのユーザーID。 |

**`userData` オブジェクト:**
| フィールド | 型     | 説明             |
|----------|--------|------------------|
| `age`    | number | ユーザーの年齢。 |
| `gender` | string | ユーザーの性別。 |
| `height` | number | ユーザーの身長(cm)。 |
| `weight` | number | ユーザーの体重(kg)。 |

**`goalData` オブジェクト:**
| フィールド    | 型     | 説明                               |
|---------------|--------|------------------------------------|
| `goalType`    | string | 例: "lose_weight", "gain_muscle"   |
| `targetValue` | number | 目標のターゲット値。               |
| `targetDate`  | string | 目標日 (`YYYY-MM-DD` 形式)。       |

### 3.3. レスポンス

- **成功 (200 OK):**
  - 3つのプラン提案を含む配列を持つJSONオブジェクトを返します。
  - **ボディスキーマ:**
    ```json
    {
      "plans": [
        {
          "title": "string",
          "frequency": "string", // 例: "3日/週"
          "description": "string",
          "workouts": [
            { "day": "string", "focus": "string" }
          ]
        }
      ]
    }
    ```

- **エラー:**
  - `500 Internal Server Error`: その他の処理エラー。
  - **ボディスキーマ:** `{"error": "エラーメッセージ"}`

### 3.4. 環境変数

| 変数                          | 説明                               | 値の例                    |
|-------------------------------|------------------------------------|---------------------------|
| `GEMINI_API_KEY`              | Google AIのAPIキー。               | `AIzaSy...`               |
| `SUPABASE_URL`                | あなたのSupabaseプロジェクトURL。   | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY`   | あなたのSupabaseサービスロールキー。| `eyJh...`                 |

### 3.5. 実行例 (cURL)

```bash
curl -X POST 'https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/functions/v1/generate-plan-suggestions' \
-H 'Authorization: Bearer <YOUR-SUPABASE-ANON-KEY>' \
-H 'Content-Type: application/json' \
-d '{
  "userData": {
    "age": 30,
    "gender": "男性",
    "height": 175,
    "weight": 70
  },
  "goalData": {
    "goalType": "gain_muscle",
    "targetValue": 5,
    "targetDate": "2024-12-31"
  },
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}'
```

---

## 4. ファンクション: `generate-advice`

### 4.1. 説明
ユーザーがワークアウトを記録した後に、短く、動機付けとなり、洞察に満ちたアドバイスを提供します。アドバイスは、ユーザーの特定のワークアウト、長期的な目標、最近のワークアウト履歴、および最新の身体指標（利用可能な場合）に合わせて調整されます。

### 4.2. リクエスト

- **メソッド:** `POST`
- **エンドポイント:** `(あなたのSupabaseプロジェクトURL)/functions/v1/generate-advice`
- **ヘッダー:**
  - `Authorization: Bearer <SUPABASE_ANON_KEY>`
  - `Content-Type: application/json`
- **ボディ:**

| フィールド       | 型     | 必須 | 説明                                                  |
|------------------|--------|------|-------------------------------------------------------|
| `goal`           | object | はい | ユーザーのアクティブなフィットネス目標。              |
| `workoutLog`     | object | はい | 完了したばかりのワークアウトの詳細。                  |
| `workoutHistory` | array  | はい | 頻度の文脈として使用する最近のワークアウトの配列。    |
| `userId`         | string | いいえ | 最新の身体指標を取得するためのユーザーID。             |

**`goal` オブジェクト:**
| フィールド    | 型     | 説明                         |
|---------------|--------|------------------------------|
| `goalType`    | string | 例: "lose_weight"            |
| `targetValue` | number | 目標のターゲット値。         |
| `targetDate`  | string | 目標日 (`YYYY-MM-DD` 形式)。 |

**`workoutLog` オブジェクト:**
| フィールド | 型     | 説明                 |
|------------|--------|----------------------|
| `exercise` | string | エクササイズ名。     |
| `sets`     | number | セット数。           |
| `reps`     | number | レップ数。           |
| `weight`   | number | 使用重量 (kg)。      |

**`workoutHistory` オブジェクトの配列:**
| フィールド | 型     | 説明                 |
|------------|--------|----------------------|
| `date`     | string | ワークアウトの日付。 |
| `exercise` | string | エクササイズ名。     |

### 4.3. レスポンス

- **成功 (200 OK):**
  - AIが生成したアドバイスの文字列を含むJSONオブジェクトを返します。
  - **ボディスキーマ:**
    ```json
    {
      "advice": "string" // 例: "ベンチプレスお疲れ様でした！..."
    }
    ```

- **エラー:**
  - `500 Internal Server Error`: その他の処理エラー。
  - **ボディスキーマ:** `{"error": "エラーメッセージ"}`

### 4.4. 環境変数

| 変数                          | 説明                               | 値の例                    |
|-------------------------------|------------------------------------|---------------------------|
| `GEMINI_API_KEY`              | Google AIのAPIキー。               | `AIzaSy...`               |
| `SUPABASE_URL`                | あなたのSupabaseプロジェクトURL。   | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY`   | あなたのSupabaseサービスロールキー。| `eyJh...`                 |

### 4.5. 実行例 (cURL)

```bash
curl -X POST 'https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/functions/v1/generate-advice' \
-H 'Authorization: Bearer <YOUR-SUPABASE-ANON-KEY>' \
-H 'Content-Type: application/json' \
-d '{
  "goal": {
    "goalType": "gain_muscle",
    "targetValue": 5,
    "targetDate": "2024-12-31"
  },
  "workoutLog": {
    "exercise": "ベンチプレス",
    "sets": 3,
    "reps": 10,
    "weight": 60
  },
  "workoutHistory": [
    { "date": "2024-07-15", "exercise": "スクワット" },
    { "date": "2024-07-13", "exercise": "デッドリフト" }
  ],
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}'
```

---

## 5. 新しいSupabaseプロジェクトへのデプロイ

これらのファンクションを新しいプロジェクトで使用するには、以下の手順に従ってください。

### 5.1. データベーススキーマ
まず、ファンクションが依存する以下のテーブルをデータベースに作成してください。

**`profiles` テーブル**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  weight DOUBLE PRECISION,
  height DOUBLE PRECISION,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`goals` テーブル**
```sql
CREATE TABLE goals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_value DOUBLE PRECISION NOT NULL,
  target_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`plans` テーブル**
```sql
CREATE TABLE plans (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  frequency TEXT,
  description TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`plan_workouts` テーブル**
```sql
CREATE TABLE plan_workouts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_of_week TEXT,
  focus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`body_metrics` テーブル**
```sql
CREATE TABLE public.body_metrics (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at  timestamptz NOT NULL DEFAULT now(),
  weight       numeric(5,2) CHECK (weight > 0),
  body_fat     numeric(4,1) CHECK (body_fat BETWEEN 1 AND 80),
  photo_url    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  skeletal_muscle_mass NUMERIC(5, 2),
  body_fat_mass NUMERIC(5, 2),
  smi NUMERIC(4, 1),
  bmr INTEGER,
  visceral_fat_level INTEGER,
  inbody_score INTEGER
);
```

**`workout_logs` テーブル**
```sql
CREATE TABLE public.workout_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise     text NOT NULL,
  reps         int NOT NULL CHECK (reps > 0),
  sets         int NOT NULL CHECK (sets > 0),
  volume       numeric(8,2),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

**`advices` テーブル**
```sql
CREATE TABLE public.advices (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id   uuid REFERENCES public.workout_logs(id) ON DELETE SET NULL,
  body_metric_id   uuid REFERENCES public.body_metrics(id) ON DELETE SET NULL,
  content          text NOT NULL,
  is_read          boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```
*(注: 上記スキーマにはRLSポリシーは含まれていません。必要に応じて適切なポリシーを設定してください。)*


### 5.2. ファイルのコピー
ファンクションディレクトリ（`ocr-body-metrics`、`generate-plan-suggestions`、`generate-advice`、および`_shared`）を新しいプロジェクトの`supabase/functions`ディレクトリにコピーします。

### 5.3. 環境変数の設定
新しいSupabaseプロジェクトのダッシュボードで、`Settings` -> `General`に移動し、必要な環境変数（`GEMINI_API_KEY`など）をシークレットとして追加します。これらの値をハードコーディングしないでください。ローカル開発のためには、`supabase/functions`ディレクトリに`.env`ファイルを作成してローカルで設定できます（`supabase functions serve`）。

### 5.4. デプロイ
Supabase CLIを使用してファンクションをデプロイします：
```bash
supabase functions deploy --project-ref <YOUR-NEW-PROJECT-REF>
```

### 5.5. CORS
`_shared/cors.ts`ファイルがクロスオリジンリソース共有(CORS)を処理します。デフォルトでは寛容な設定になっています。本番環境では、許可するオリジンを制限することをお勧めします。 