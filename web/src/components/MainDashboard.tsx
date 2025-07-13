"use client";

import { useState, useEffect } from "react";
import { TrainingForm, WorkoutData } from "./TrainingForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "./ui/dialog";
import { logWorkout, chatWithAi } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { WorkoutHistory } from "./WorkoutHistory";
import { PlanRoadmap } from "./PlanRoadmap";
import { AiChat, ChatMessage } from "./AiChat";
import { toast } from "sonner";

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    setChatMessages([
      { role: 'assistant', content: 'こんにちは！フィットネスに関するご質問や相談があれば、何でも聞いてください。' }
    ]);
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
      toast.error("エラーが発生しました。", { description: error });
    }
    if (advice) {
      setLatestAdvice(advice);
      toast.success("AIコーチから新しいアドバイスが届きました！");
    }
    // Refresh history after logging a new workout
    await fetchHistory();
  };

  const handleSendMessage = async (message: string) => {
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: message }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const { reply, error } = await chatWithAi(newMessages);

      if (error) {
        throw new Error(error);
      }

      setChatMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "不明なエラーが発生しました。";
      toast.error("チャットでエラーが発生しました。", { description: errorMessage });
      setChatMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <>
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

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogTrigger asChild>
           <Button
            className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg hover:scale-110 transition-transform"
          >
            AIチャット
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>AIアシスタント</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            <AiChat 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
            />
          </div>
          <DialogFooter className="mt-auto">
             <DialogClose asChild>
              <Button type="button" variant="secondary">
                閉じる
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 