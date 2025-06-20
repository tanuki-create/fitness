export interface User {
  name: string;
  goal: string;
}

export interface Workout {
  date: string;
  type: string;
  duration: number; // in minutes
  calories: number;
}

export interface Report {
  week: string;
  summary: string;
  feedback: string;
}

export const user: User = {
  name: 'Hiro',
  goal: 'Losing 5kg in 2 months',
};

export const workouts: Workout[] = [
  { date: '2024-10-21', type: 'Running', duration: 30, calories: 300 },
  { date: '2024-10-22', type: 'Weight Training', duration: 60, calories: 400 },
  { date: '2024-10-24', type: 'Yoga', duration: 45, calories: 150 },
];

export const weeklyReport: Report = {
  week: 'October 21-27, 2024',
  summary: 'You had a great week! You were active on 3 days and burned a total of 850 calories.',
  feedback: 'Awesome job on mixing up your workouts. Try adding one more cardio session next week to boost your progress towards your goal!',
};

export const characterMessages = [
  { from: 'ai', text: 'Hello Hiro! Ready to crush your goals today?' },
  { from: 'user', text: 'Yes, I am!' },
  { from: 'ai', text: 'Great! What workout are you planning today?' },
]; 