import { CheckCircle2, Plus, ArrowRightLeft, UserCheck, Zap, Minus } from "lucide-react";

export function getStatusStyle(name = "") {
  const n = name.toLowerCase();
  if (/done|complet|close|resolv|finish/.test(n))
    return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
  if (/progress|doing|review|active|open|start/.test(n))
    return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
  if (/block|cancel|reject|hold/.test(n))
    return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
  return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
}

export function getActivityMeta(action) {
  switch (action) {
    case "ISSUE_CREATED": return { icon: Plus, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" };
    case "ISSUE_STATUS_CHANGED": return { icon: ArrowRightLeft, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" };
    case "ISSUE_ASSIGNED": return { icon: UserCheck, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" };
    case "ISSUE_MOVED_TO_SPRINT": return { icon: Zap, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" };
    case "ISSUE_REMOVED_FROM_SPRINT": return { icon: Minus, color: "bg-muted text-muted-foreground" };
    default: return { icon: CheckCircle2, color: "bg-muted text-muted-foreground" };
  }
}
