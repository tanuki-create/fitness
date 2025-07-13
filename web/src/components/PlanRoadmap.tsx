import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

interface Plan {
  title: string;
  frequency: string;
  description: string;
  workouts: { day: string; focus: string }[];
}

export function PlanRoadmap({ plan }: { plan: Plan }) {
  if (!plan) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>あなたのプラン: {plan.title}</CardTitle>
        <CardDescription>{plan.frequency} - {plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <h4 className="text-lg font-semibold mb-3">週間スケジュール</h4>
        <ul className="space-y-3">
          {plan.workouts.map((workout, index) => (
            <li key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-semibold text-primary">{workout.day}</span>
              <span className="text-muted-foreground">{workout.focus}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 