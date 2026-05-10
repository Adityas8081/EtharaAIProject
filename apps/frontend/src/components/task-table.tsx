"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, priorityColors, TaskStatus, Priority } from "@/lib/utils";
import { MoreVertical, Pencil, Trash2, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedAt?: string;
  assignedTo?: { id: string; name: string };
  project?: { id: string; name: string };
}

interface TaskTableProps {
  tasks: Task[];
  isAdmin?: boolean;
  onDeleteTask?: (id: string, title: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "TODO",        label: "To Do",       color: "bg-slate-100 text-slate-700" },
  { value: "IN_PROGRESS", label: "In Progress",  color: "bg-blue-100 text-blue-700" },
  { value: "DONE",        label: "Done",         color: "bg-green-100 text-green-700" },
  { value: "OVERDUE",     label: "Overdue",      color: "bg-red-100 text-red-700" },
];

const MEMBER_STATUS_OPTIONS = STATUS_OPTIONS.filter((s) => s.value !== "OVERDUE");

export function TaskTable({ tasks, isAdmin = false, onDeleteTask, onStatusChange }: TaskTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  async function changeStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setUpdatingId(task.id);
    try {
      await api.put(`/api/tasks/${task.id}`, { status });
      toast.success(`Status updated to "${status.replace("_", " ")}"`);
      onStatusChange?.(task.id, status);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!tasks.length) return <p className="text-slate-400 text-sm text-center py-8">No tasks found</p>;

  const statusOptions = isAdmin ? STATUS_OPTIONS : MEMBER_STATUS_OPTIONS;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Project</TableHead>
          {isAdmin && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const isDone = task.status === "DONE";
          const isUpdating = updatingId === task.id;
          const currentOpt = STATUS_OPTIONS.find((s) => s.value === task.status);

          return (
            <TableRow key={task.id} className={`hover:bg-slate-50 transition-colors ${isDone ? "opacity-60" : ""}`}>
              {/* Quick complete toggle */}
              <TableCell>
                <button
                  onClick={() => changeStatus(task, isDone ? "TODO" : "DONE")}
                  disabled={isUpdating}
                  title={isDone ? "Mark as to-do" : "Mark as complete"}
                  className={`transition-colors ${isDone ? "text-green-500" : "text-slate-300 hover:text-green-500"}`}
                >
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <Circle className={`w-5 h-5 ${isUpdating ? "animate-pulse text-green-400" : ""}`} />
                  }
                </button>
              </TableCell>

              <TableCell>
                <Link
                  href={`/tasks/${task.id}`}
                  className={`font-medium hover:underline ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}
                >
                  {task.title}
                </Link>
              </TableCell>

              {/* Inline status dropdown — available to everyone */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={isUpdating}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border border-transparent hover:border-slate-200 transition-all ${currentOpt?.color ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {isUpdating ? "…" : task.status.replace("_", " ")}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-36">
                    {statusOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => changeStatus(task, opt.value)}
                        className={`text-xs font-semibold ${task.status === opt.value ? "opacity-40 pointer-events-none" : ""}`}
                      >
                        <span className={`w-2 h-2 rounded-full mr-2 ${opt.color.split(" ")[0]}`} />
                        {opt.label}
                        {task.status === opt.value && " ✓"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

              <TableCell>
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
              </TableCell>
              <TableCell className="text-slate-600 text-sm">{task.assignedTo?.name ?? "Unassigned"}</TableCell>
              <TableCell className="text-slate-600 text-sm">{formatDate(task.dueDate)}</TableCell>
              <TableCell className="text-slate-600 text-sm">{task.project?.name ?? "—"}</TableCell>

              {isAdmin && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}`)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Task
                      </DropdownMenuItem>
                      {!isDone && (
                        <DropdownMenuItem onClick={() => changeStatus(task, "DONE")}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" /> Mark Complete
                        </DropdownMenuItem>
                      )}
                      {onDeleteTask && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => onDeleteTask(task.id, task.title)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
