'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logWorkout } from '@/app/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TrainingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || !sets || !reps || !weight) {
      // Basic validation
      alert("すべての項目を入力してください。");
      return;
    }
    const formData = { exercise, sets, reps, weight };
    console.log(formData);
    onSubmit(formData); // Pass data to the parent component
    // Reset form
    setExercise("");
    setSets("");
    setReps("");
    setWeight("");
    setOpen(false); // Close dialog on submit
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>ワークアウトを記録</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>今日のワークアウトを記録</DialogTitle>
          <DialogDescription>
            トレーニングセッションの詳細を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="exercise" className="text-right">
                エクササイズ
              </Label>
              <Input
                id="exercise"
                name="exercise"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                placeholder="例: ベンチプレス"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reps" className="text-right">
                レップ数
              </Label>
              <Input
                id="reps"
                name="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="例: 10"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sets" className="text-right">
                セット数
              </Label>
              <Input
                id="sets"
                name="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="例: 3"
                className="col-span-3"
                required
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                重量 (kg)
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例: 60"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">記録を保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 