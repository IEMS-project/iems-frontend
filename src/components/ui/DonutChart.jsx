import { useState } from "react";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export function buildDonutSlices(items) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);
    let offset = 0;

    return items.map((item) => {
        const ratio = Math.max(0, item.value) / total;
        const length = ratio * circumference;
        const slice = {
            ...item,
            percent: clampPercent(ratio * 100),
            radius,
            circumference,
            dashArray: `${length} ${circumference - length}`,
            dashOffset: -offset,
        };
        offset += length;
        return slice;
    });
}

export default function DonutChart({
    title,
    meta,
    centerValue,
    centerLabel,
    slices,
    className = "",
    compact = false,
}) {
    const [activeKey, setActiveKey] = useState(null);
    const activeSlice = slices.find((slice) => slice.key === activeKey);

    return (
        <div className={cn("flex h-full min-h-64 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm", compact && "min-h-0 p-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                    {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
                </div>
                <PieChart className="h-5 w-5 shrink-0 text-primary" />
            </div>

            <div className={cn("mt-5 grid flex-1 place-items-center", compact && "mt-3")}>
                <div className={cn("relative grid h-36 w-36 place-items-center", compact && "h-32 w-32")}>
                    <svg viewBox="0 0 120 120" className="-rotate-90 overflow-visible" aria-hidden="true">
                        <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
                        {slices.map((slice) => {
                            const isActive = slice.key === activeKey;
                            const isDimmed = activeKey && !isActive;

                            return (
                                <circle
                                    key={slice.key}
                                    cx="60"
                                    cy="60"
                                    r={slice.radius}
                                    fill="none"
                                    stroke={slice.color}
                                    strokeWidth={isActive ? 18 : 14}
                                    strokeLinecap="butt"
                                    strokeDasharray={slice.dashArray}
                                    strokeDashoffset={slice.dashOffset}
                                    className={cn("cursor-pointer transition-all duration-200 ease-out", isDimmed ? "opacity-25" : "opacity-100")}
                                    style={{
                                        transformBox: "fill-box",
                                        transformOrigin: "center",
                                        transform: isActive ? "scale(1.06)" : "scale(1)",
                                        filter: isActive ? "drop-shadow(0 0 10px rgb(37 99 235 / 0.35))" : undefined,
                                    }}
                                    onMouseEnter={() => setActiveKey(slice.key)}
                                    onMouseLeave={() => setActiveKey(null)}
                                    onFocus={() => setActiveKey(slice.key)}
                                    onBlur={() => setActiveKey(null)}
                                    tabIndex={0}
                                />
                            );
                        })}
                    </svg>
                    <div className="pointer-events-none absolute grid h-24 w-24 place-items-center rounded-full border border-border bg-card text-center">
                        <div>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {activeSlice ? activeSlice.value : centerValue}
                            </div>
                            <div className="max-w-16 truncate text-xs text-muted-foreground">
                                {activeSlice ? activeSlice.label : centerLabel}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn("mt-5 grid gap-2", compact && "mt-3 gap-1")}>
                {slices.map((slice) => (
                    <button
                        key={slice.key}
                        type="button"
                        onMouseEnter={() => setActiveKey(slice.key)}
                        onMouseLeave={() => setActiveKey(null)}
                        onFocus={() => setActiveKey(slice.key)}
                        onBlur={() => setActiveKey(null)}
                        className="flex items-center justify-between rounded-xl px-2 py-1.5 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                            <span className="truncate">{slice.label}</span>
                        </span>
                        <span className="font-semibold text-foreground">{slice.percent}%</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
