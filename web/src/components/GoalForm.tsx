"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

// 仮でshadcnのDatePickerの代わりに通常のinput[type=date]を使用します
// 必要であれば、別途DatePickerコンポーネントをインストール・設定します

export interface GoalData {
  goal_type: string;
  target_value: number | "";
  target_date: string;
}

export function GoalForm({ onNext, onBack }: { onNext: (data: GoalData) => void; onBack: () => void }) {
  const [goalData, setGoalData] = useState<GoalData>({
    goal_type: "",
    target_value: "",
    target_date: "",
  });

  const handleChange = (name: string, value: string | number) => {
    setGoalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Goal data submitted:", goalData);
    onNext(goalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>主な目標は何ですか？</Label>
        <Select
          onValueChange={(value) => handleChange("goal_type", value)}
          defaultValue={goalData.goal_type}
        >
          <SelectTrigger>
            <SelectValue placeholder="目標を選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lose_weight">減量</SelectItem>
            <SelectItem value="maintain_weight">体重維持</SelectItem>
            <SelectItem value="gain_muscle">筋肉増強</SelectItem>
            <SelectItem value="lose_fat">体脂肪を減らす</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetValue">目標値 (kg)</Label>
          <Input
            id="targetValue"
            name="target_value"
            type="number"
            value={goalData.target_value}
            onChange={(e) => handleChange("target_value", e.target.value)}
            placeholder="例: 5 (5kg減の場合)"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetDate">目標達成日</Label>
          <Input
            id="targetDate"
            name="target_date"
            type="date"
            value={goalData.target_date}
            onChange={(e) => handleChange("target_date", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button type="submit">
          プランを生成
        </Button>
      </div>
    </form>
  );
} 