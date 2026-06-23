import React from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, PauseCircle, RotateCcw, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

const statusConfig = {
  queued: {
    label: "Đang chờ",
    icon: PauseCircle,
    className: "text-muted-foreground",
  },
  uploading: {
    label: "Đang gửi",
    icon: Loader2,
    className: "text-blue-600",
  },
  processing: {
    label: "Đang lưu trên server",
    icon: Loader2,
    className: "text-amber-600",
  },
  completed: {
    label: "Hoàn tất",
    icon: CheckCircle2,
    className: "text-emerald-600",
  },
  failed: {
    label: "Lỗi",
    icon: XCircle,
    className: "text-red-600",
  },
  canceled: {
    label: "Đã hủy",
    icon: XCircle,
    className: "text-muted-foreground",
  },
};

function getSummary(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const failed = tasks.filter((task) => task.status === "failed").length;
  const active = tasks.filter((task) => task.status === "uploading" || task.status === "queued").length;

  if (failed > 0) return `${completed}/${total} hoàn tất, ${failed} lỗi`;
  if (active > 0) return `${completed}/${total} hoàn tất`;
  return `${completed}/${total} hoàn tất`;
}

export default function UploadProgressPanel({
  tasks = [],
  onCancel,
  onCancelAll,
  onRetry,
  onRetryFailed,
  onClearFinished,
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (!tasks.length) return null;

  const hasActive = tasks.some((task) => task.status === "uploading" || task.status === "queued");
  const hasFailed = tasks.some((task) => task.status === "failed");
  const hasFinished = tasks.some((task) => ["completed", "failed", "canceled"].includes(task.status));
  const totalProgress = Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-lg border border-border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Tải tài liệu lên</p>
          <p className="text-xs text-muted-foreground">{getSummary(tasks)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasFailed && (
            <Button variant="ghost" size="sm" onClick={onRetryFailed}>
              <RotateCcw className="h-4 w-4" />
              Thử lại lỗi
            </Button>
          )}
          {hasActive && (
            <Button variant="ghost" size="icon" onClick={onCancelAll} title="Hủy tất cả">
              <X className="h-4 w-4" />
            </Button>
          )}
          {hasFinished && !hasActive && (
            <Button variant="ghost" size="icon" onClick={onClearFinished} title="Ẩn danh sách">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((value) => !value)} title={collapsed ? "Mở rộng" : "Thu gọn"}>
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="h-1 bg-muted">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${totalProgress}%` }} />
      </div>

      {!collapsed && (
        <div className="max-h-80 overflow-y-auto">
          {tasks.map((task) => {
            const config = statusConfig[task.status] || statusConfig.queued;
            const StatusIcon = config.icon;
            const canCancel = task.status === "uploading" || task.status === "processing" || task.status === "queued";
            const canRetry = task.status === "failed" || task.status === "canceled";

            return (
              <div key={task.id} className="border-b px-4 py-3 last:border-b-0">
                <div className="flex items-start gap-3">
                  <StatusIcon className={cn("mt-0.5 h-4 w-4 shrink-0", config.className, task.status === "uploading" && "animate-spin")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium" title={task.name}>{task.name}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{task.progress || 0}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full transition-all", task.status === "failed" ? "bg-red-500" : task.status === "completed" ? "bg-emerald-500" : "bg-blue-600")}
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate">
                        {config.label}
                        {task.error ? `: ${task.error}` : ""}
                      </span>
                      <span className="shrink-0">{formatBytes(task.size || 0)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {canRetry && (
                      <Button variant="ghost" size="icon" onClick={() => onRetry?.(task.id)} title="Tiếp tục tải lại từ file lỗi">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {canCancel && (
                      <Button variant="ghost" size="icon" onClick={() => onCancel?.(task.id)} title="Hủy upload">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
