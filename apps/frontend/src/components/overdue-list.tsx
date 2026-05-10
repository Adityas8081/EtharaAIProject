import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  project?: { id: string; name: string };
}

export function OverdueList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <p className="text-slate-400 text-sm">No overdue tasks</p>;
  return (
    <ul className="space-y-3">
      {tasks.slice(0, 5).map((task) => (
        <li key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
          <div>
            <Link href={`/tasks/${task.id}`} className="font-medium text-sm text-slate-900 hover:underline">{task.title}</Link>
            {task.project && <p className="text-xs text-slate-500">{task.project.name}</p>}
          </div>
          <div className="text-right">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge>
            <p className="text-xs text-slate-400 mt-1">Due {formatDate(task.dueDate)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
