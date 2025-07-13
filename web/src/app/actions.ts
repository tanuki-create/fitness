'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/supabase/database.types';

type ProfilesInsert = Database['public']['Tables']['profiles']['Insert'];
type GoalsInsert = Database['public']['Tables']['goals']['Insert'];

export async function logWorkout(formData: FormData) {
  const supabase = createClient()

  // 1. Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error('User not authenticated to log workout')
    return { error: 'User not authenticated' }
  }

  // 2. Prepare workout data
  const rawWeight = formData.get('weight')
  const workoutData = {
    user_id: user.id,
    exercise: formData.get('exercise') as string,
    sets: Number(formData.get('sets')),
    reps: Number(formData.get('reps')),
    // 'weight' is not a column in workout_logs, but we need it for the function
  }
  const weight = Number(rawWeight)

  // 3. Insert into workout_logs
  // Note: 'weight' is intentionally not included in the insert data
  const { data: insertedLog, error } = await supabase
    .from('workout_logs')
    .insert(workoutData)
    .select()
    .single()

  if (error) {
    console.error('Error logging workout:', error)
    return { error: error.message }
  }

  revalidatePath('/')

  try {
    // 4. Get the user's most recent active goal
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('goal_type, target_value, target_date')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (goalError) throw goalError
    if (!goalData) throw new Error('No active goal found for user.')

    // Map DB columns to function properties
    const goal = {
      goalType: goalData.goal_type,
      targetValue: goalData.target_value,
      targetDate: goalData.target_date,
    }

    // 5. Get recent workout history
    const { data: workoutHistory, error: historyError } = await supabase
      .from('workout_logs')
      .select('performed_at, exercise')
      .eq('user_id', user.id)
      .order('performed_at', { ascending: false })
      .limit(5)

    if (historyError) throw historyError

    const historyForPrompt =
      workoutHistory?.map((h) => ({
        date: new Date(h.performed_at).toLocaleDateString(),
        exercise: h.exercise,
      })) ?? []

    // 6. Invoke the 'generate-advice' function
    const { data: adviceData, error: adviceError } =
      await supabase.functions.invoke('generate-advice', {
        body: {
          goal: goal,
          workoutLog: {
            exercise: workoutData.exercise,
            sets: workoutData.sets,
            reps: workoutData.reps,
            weight: weight, // Pass weight to the function
          },
          workoutHistory: historyForPrompt,
        },
      })

    if (adviceError) {
      throw adviceError
    }
    
    // 7. Optionally, save the advice to the 'advices' table
    if (adviceData.advice) {
        await supabase.from('advices').insert({
            user_id: user.id,
            workout_log_id: insertedLog.id,
            content: adviceData.advice,
        });
    }

    return { error: null, advice: adviceData.advice }
  } catch (e) {
    let message = 'Unknown error';
    if (e instanceof Error) message = e.message;
    console.error('Error invoking generate-advice function:', e)
    return { error: `Error getting advice: ${message}`, advice: null }
  }
}

export async function processInBodyImage(formData: FormData) {
  const imageFile = formData.get("file") as File;
  if (!imageFile) {
    return { success: false, message: "No image file found." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  // 1. Upload image to Supabase Storage
  const fileExtension = imageFile.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `public/inbody-scans/${user.id}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, imageFile);

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    return { success: false, message: "Failed to upload image." };
  }

  // 2. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  if (!publicUrl) {
    return { success: false, message: "Failed to get image public URL." };
  }

  try {
    // 3. Invoke OCR function
    const { data: extractedData, error: functionError } = await supabase.functions.invoke(
      "ocr-body-metrics",
      { body: { imageUrl: publicUrl } }
    );

    if (functionError) {
      throw functionError;
    }

    // 4. Save extracted data to profiles and body_metrics tables
    const { name, age, height, ...metrics } = extractedData;

    // Update profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name, age, height, weight: metrics.weight, updated_at: new Date().toISOString() });
    
    if (profileError) throw profileError;

    // Insert into body_metrics table
    const { error: metricsError } = await supabase.from("body_metrics").insert({
        user_id: user.id,
        photo_url: publicUrl,
        weight: metrics.weight,
        body_fat: metrics.bodyFatPercentage,
        skeletal_muscle_mass: metrics.skeletalMuscleMass,
        body_fat_mass: metrics.bodyFatMass,
        smi: metrics.smi,
        bmr: metrics.bmr,
        visceral_fat_level: metrics.visceralFatLevel,
        inbody_score: metrics.inbodyScore,
    });

    if (metricsError) throw metricsError;
    
    return { success: true, data: extractedData };
    
  } catch (e) {
    let message = 'Unknown error';
    if (e instanceof Error) message = e.message;
    console.error("Error processing InBody image:", e);
    return { success: false, message: `Error processing image: ${message}` };
  }
}

interface PlanForOnboarding {
  title: string;
  frequency: string;
  description: string;
  workouts: { day: string; focus: string }[];
}

export async function saveOnboardingData({
  userData,
  goalData,
  selectedPlan,
}: {
  userData: Omit<ProfilesInsert, 'id' | 'created_at' | 'updated_at'>;
  goalData: Omit<GoalsInsert, 'user_id' | 'created_at' | 'is_active' | 'id'>;
  selectedPlan: PlanForOnboarding;
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // 1. Save user profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    ...userData,
    updated_at: new Date().toISOString(),
  });
  if (profileError) {
    console.error("Error saving profile:", profileError);
    return { error: profileError.message };
  }

  // 2. Save goal
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      ...goalData,
    })
    .select()
    .single();
  if (goalError) {
    console.error("Error saving goal:", goalError);
    return { error: goalError.message };
  }

  // 3. Save the AI-selected plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      goal_id: goal.id,
      title: selectedPlan.title,
      frequency: selectedPlan.frequency,
      description: selectedPlan.description,
      is_selected: true,
    })
    .select()
    .single();

  if (planError) {
    console.error("Error saving plan:", planError);
    return { error: planError.message };
  }
  
  // 4. Save the workouts for that plan
   const workoutInserts = selectedPlan.workouts.map(w => ({
      plan_id: plan.id,
      day_of_week: w.day,
      focus: w.focus,
    }));

  const { error: workoutError } = await supabase
    .from("plan_workouts")
    .insert(workoutInserts);
  
  if (workoutError) {
    console.error("Error saving plan workouts:", workoutError);
    return { error: workoutError.message };
  }


  revalidatePath("/");
  return { error: null };
} 