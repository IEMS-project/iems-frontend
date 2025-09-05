import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

export default function MyTasks() {
	const data = {
		tasks: [
			{ project: "Ứng dụng Mobile", title: "Tích hợp API", due: "Hạn trong 3 ngày", priority: "Cao" },
			{ project: "Thiết kế lại Website", title: "Sửa lỗi responsive", due: "Hạn hôm nay", priority: "Trung bình" },
			{ project: "Tự động hóa nhân sự", title: "Viết kiểm thử E2E", due: "Hạn trong 5 ngày", priority: "Thấp" },
		],
	};

	const priorityColor = (priority) => {
		switch (priority) {
		case "Cao":
			return "bg-red-100 text-red-700";
		case "Trung bình":
			return "bg-yellow-100 text-yellow-700";
		case "Thấp":
			return "bg-green-100 text-green-700";
		default:
			return "bg-gray-100 text-gray-700";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Nhiệm vụ của tôi</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3">
					{data.tasks.map((t, i) => (
						<li key={i} className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-black dark:border-blue-800 dark:bg-blue-900/20 ">
							<div className="flex justify-between items-center">
								<div className="font-semibold text-base">{t.project}</div>
								<div className={`text-xs ${t.due.includes('hôm nay') ? 'text-red-500' : 'text-red-500'}`}>{t.due}</div>
							</div>
							<div className="mt-1 flex items-center justify-between text-xs text-black">
								<span>Nhiệm vụ: {t.title}</span>
								<span className={`rounded px-2 py-0.5 text-[10px] font-medium ${priorityColor(t.priority)}`}>{t.priority}</span>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}