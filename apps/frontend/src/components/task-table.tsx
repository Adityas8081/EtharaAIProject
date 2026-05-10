"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, statusColors, priorityColors, TaskStatus, Priority } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedTo?: { id: string; name: string };
  project?: { id: string; name: string };
}

export function TaskTable({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <p className="text-slate-400 text-sm text-center py-8">No tasks found</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Project</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} className="hover:bg-slate-50">
            <TableCell>
              <Link href={`/tasks/${task.id}`} className="font-medium text-slate-900 hover:underline">{task.title}</Link>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            </TableCell>
            <TableCell className="text-slate-600 text-sm">{task.assignedTo?.name ?? "Unassigned"}</TableCell>
            <TableCell className="text-slate-600 text-sm">{formatDate(task.dueDate)}</TableCell>
            <TableCell className="text-slate-600 text-sm">{task.project?.name ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
