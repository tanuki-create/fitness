"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";

export interface Plan {
  id: number;
  title: string;
  frequency: string;
  description: string;
  workouts: { day: string; focus: string }[];
}

export function AiPlanDisplay({ plans, onSelectPlan }: { plans: Plan[], onSelectPlan: (plan: Plan) => void; }) {
  return (
    <div className="space-y-6">
        <h3 className="text-xl font-semibold">あなたの目標に基づいた3つのプランです。1つ選んでください。</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription>{plan.frequency}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm mb-4">{plan.description}</p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            {plan.workouts.map(w => <li key={w.day}><strong>{w.day}:</strong> {w.focus}</li>)}
                        </ul>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button className="w-full" onClick={() => onSelectPlan(plan)}>このプランを選択</Button>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );
} 