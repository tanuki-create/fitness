"use client";

import { useState, useEffect } from "react";
import { UserDataForm } from "@/components/UserDataForm";
import { GoalForm } from "@/components/GoalForm";
import { AiPlanDisplay, Plan } from "@/components/AiPlanDisplay";
import { Button } from "@/components/ui/button";
import { MainDashboard } from "@/components/MainDashboard";
import { saveOnboardingData } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";


// Placeholder components for each step
function UserDataStep({ onNext }: { onNext: (data: any) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ステップ1：あなたの情報を入力</h2>
      <UserDataForm onNext={onNext} />
    </div>
  );
}

function GoalStep({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ステップ2：目標を設定</h2>
      <GoalForm onNext={onNext} onBack={onBack} />
    </div>
  );
}

function PlanStep({
  onNext,
  onBack,
  userData,
  goalData,
}: {
  onNext: (plan: Plan) => void;
  onBack: () => void;
  userData: any;
  goalData: any;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePlans = async () => {
      try {
        const supabase = createClient();
        const { data, error: funcError } = await supabase.functions.invoke(
          "generate-plan-suggestions",
          {
            body: { userData, goalData },
          }
        );
        if (funcError) {
          throw new Error(funcError.message);
        }
        setPlans(data.plans);
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred');
        console.error("Error generating plans:", e);
      } finally {
        setIsLoading(false);
      }
    };
    generatePlans();
  }, [userData, goalData]);

  const handleSelectPlan = (plan: Plan) => {
    onNext(plan);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ステップ3：AIが生成したプラン</h2>
      {isLoading ? (
        <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-4 w-4 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div>
            <span className="text-muted-foreground">あなたに合わせたプランを生成中...</span>
        </div>
      ) : error ? (
        <p className="text-red-500">エラー: {error}</p>
      ) : (
        <AiPlanDisplay plans={plans} onSelectPlan={handleSelectPlan} />
      )}
       <Button variant="outline" onClick={onBack} className="mt-6">
          目標設定に戻る
        </Button>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>({});
  const [goalData, setGoalData] = useState<any>({});
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // This useEffect in layout.tsx now handles anonymous sign-in globally.
  // We can remove the local one to avoid redundancy.
  /*
  useEffect(() => {
    const supabase = createClient();
    const signIn = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) {
                console.error('Error signing in anonymously:', error)
            }
        }
    };
    signIn();
  }, []);
  */

  const handleNextFromStep1 = (data: any) => {
    setUserData(data);
    setStep(2);
  };

  const handleNextFromStep2 = (data: any) => {
    setGoalData(data);
    setStep(3);
  };

  const handlePlanSelected = async (plan: Plan) => {
    setSelectedPlan(plan);
    // Save all data to the database
    const { error } = await saveOnboardingData({ userData, goalData, selectedPlan: plan });
    if (error) {
      alert(`データの保存中にエラーが発生しました: ${error}`);
      // Don't proceed if saving fails
      return;
    }
    setIsOnboardingComplete(true);
  }

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };
  
  const handleStartOver = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        alert('サインアウト中にエラーが発生しました。');
    } else {
        // Force a reload to clear all state and get a new anonymous session
        window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">Fitness AI</h1>
        {/* Always show the start over button so user can reset anytime */}
        <Button variant="outline" onClick={handleStartOver}>
          新しいユーザーでやり直す
        </Button>
      </header>
      <main className="container mx-auto p-4 md:p-8 flex justify-center items-start">
        <div className="w-full max-w-4xl">
            {!isOnboardingComplete ? (
              <>
                {step === 1 && <UserDataStep onNext={handleNextFromStep1} />}
                {step === 2 && <GoalStep onNext={handleNextFromStep2} onBack={handleBack} />}
                {step === 3 && userData && goalData && (
                  <PlanStep
                    onNext={handlePlanSelected}
                    onBack={handleBack}
                    userData={userData}
                    goalData={goalData}
                  />
                )}
              </>
            ) : (
              selectedPlan && <MainDashboard selectedPlan={selectedPlan} />
            )}
        </div>
      </main>
    </div>
  );
}
