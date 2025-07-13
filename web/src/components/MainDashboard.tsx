"use client";

import { useState, useEffect } from "react";
import { TrainingForm, WorkoutData } from "./TrainingForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { logWorkout } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { WorkoutHistory } from "./WorkoutHistory";
import { PlanRoadmap } from "./PlanRoadmap";

// Manually define the type based on the DB schema as types might be out of sync
type WorkoutLog = {
    id: string;
    user_id: string | null;
    exercise: string;
    reps: number;
    sets: number;
    volume: number | null;
    performed_at: string;
    created_at: string;
};

interface Plan {
  title: string;
  frequency: string;
  description: string;
  workouts: { day: string; focus: string }[];
}

// This is a placeholder for the AI advice component
function AiAdviceCard({ advice }: { advice: string }) {
    if (!advice) return null;

    return (
        <Card className="bg-blue-50 border border-blue-200">
            <CardHeader>
                <CardTitle className="text-blue-800">AIコーチからのアドバイス</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-blue-700">{advice}</p>
            </CardContent>
        </Card>
    )
}


export function MainDashboard({ selectedPlan }: { selectedPlan: Plan }) {
  const [latestAdvice, setLatestAdvice] = useState("");
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);

  const fetchHistory = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase
            .from("workout_logs")
            .select("*")
            .eq("user_id", user.id)
            .order("performed_at", { ascending: false })
            .limit(10);
        
        if (error) {
            console.error("Error fetching workout history:", error);
        } else {
            setWorkoutHistory(data);
        }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleWorkoutSubmit = async (data: WorkoutData) => {
    console.log("Workout logged:", data);
    
    // Create a FormData object to send to the server action
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key as keyof WorkoutData]);
    });

    const { error, advice } = await logWorkout(formData);

    if (error) {
      alert(`エラー: ${error}`);
    }
    if (advice) {
      setLatestAdvice(advice);
    }
    // Refresh history after logging a new workout
    await fetchHistory();
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>今日のワークアウトを記録</CardTitle>
                     <CardDescription>
                        セッションを記録してフィードバックを得ましょう。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TrainingForm onSubmit={handleWorkoutSubmit} />
                </CardContent>
            </Card>
            <PlanRoadmap plan={selectedPlan} />
        </div>
        <div className="md:col-span-2 space-y-8">
            {latestAdvice && <AiAdviceCard advice={latestAdvice} />}
            <WorkoutHistory logs={workoutHistory} />
        </div>
    </div>
  );
} 