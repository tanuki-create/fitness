import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function WorkoutHistory({ logs }: { logs: WorkoutLog[] }) {
  if (!logs || logs.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>ワークアウト履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <p>まだワークアウトが記録されていません。始めましょう！</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ワークアウト履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>最近のワークアウト一覧です。</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>エクササイズ</TableHead>
              <TableHead className="text-right">セット数</TableHead>
              <TableHead className="text-right">レップ数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.performed_at).toLocaleDateString()}</TableCell>
                <TableCell>{log.exercise}</TableCell>
                <TableCell className="text-right">{log.sets}</TableCell>
                <TableCell className="text-right">{log.reps}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 