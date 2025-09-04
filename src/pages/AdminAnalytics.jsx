import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import PowerBIEmbed from "../components/analytics/PowerBIEmbed";
import PageHeader from "../components/common/PageHeader";

function Kpi({ label, value, delta }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between">
                    <div className="text-3xl font-semibold">{value}</div>
                    {delta != null && (
                        <div className={`text-sm ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {delta >= 0 ? '+' : ''}{delta}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function SimpleBarChart({ data }) {
    const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    return (
        <div className="flex items-end gap-2 h-40">
            {data.map((d) => (
                <div key={d.label} className="flex-1">
                    <div className="bg-blue-500 rounded-t" style={{ height: `${(d.value / max) * 100}%` }} />
                    <div className="mt-1 text-center text-xs text-gray-500 truncate">{d.label}</div>
                </div>
            ))}
        </div>
    );
}

function SimpleLineChart({ data }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const min = Math.min(...data.map(d => d.value), 0);
    const width = 480;
    const height = 160;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * (width - 16) + 8;
        const y = height - ((d.value - min) / (max - min || 1)) * (height - 16) - 8;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
        </svg>
    );
}

export default function AdminAnalytics() {
    const kpis = [
        { label: 'Tổng số nhân viên', value: 128, delta: 2.3 },
        { label: 'Dự án đang hoạt động', value: 12, delta: -4.1 },
        { label: 'Nhiệm vụ hoàn thành', value: 842, delta: 8.7 },
        { label: 'Chi phí tháng này (triệu)', value: 920, delta: 1.2 },
    ];
    const barData = [
        { label: 'T1', value: 120 },
        { label: 'T2', value: 150 },
        { label: 'T3', value: 90 },
        { label: 'T4', value: 180 },
        { label: 'T5', value: 140 },
        { label: 'T6', value: 200 },
    ];
    const lineData = [
        { label: 'Tuần 1', value: 20 },
        { label: 'Tuần 2', value: 32 },
        { label: 'Tuần 3', value: 28 },
        { label: 'Tuần 4', value: 40 },
        { label: 'Tuần 5', value: 36 },
    ];

    return (
        <div className="space-y-6">

            <PageHeader breadcrumbs={[{ label: "Quản trị - Phân tích", to: "/admin" }]} />
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {kpis.map(k => (
                        <Kpi key={k.label} label={k.label} value={k.value} delta={k.delta} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Khối lượng công việc theo tháng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SimpleBarChart data={barData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hiệu suất theo tuần</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SimpleLineChart data={lineData} />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Báo cáo Power BI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PowerBIEmbed
                            // Thay thế bằng link báo cáo thực tế của bạn
                            embedUrl="https://app.powerbi.com/view?r=YOUR_REPORT_ID"
                            height={520}
                        />
                        <p className="mt-2 text-xs text-gray-500">Lưu ý: Với báo cáo riêng tư, cần cấu hình embed token và domain.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


