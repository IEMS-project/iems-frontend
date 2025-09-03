import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

export default function ActivityPanel() {
	const data = {
		items: [
			{ title: "Trần B bình luận trong nhiệm vụ \"API integration\"", time: "2 giờ trước" },
			{ title: "Cuộc họp mới: Sprint Planning — Ngày mai 09:00", time: "Hôm nay" },
			{ title: "Nhiệm vụ \"Create repo\" chuyển sang Done", time: "Hôm qua" },
			{ title: "Nguyễn A đính kèm tệp thiết kế vào \"UI Review\"", time: "3 giờ trước" },
			{ title: "Tạo nhánh mới feature/auth-flow", time: "Hôm nay" },
			{ title: "Triển khai staging thành công", time: "2 ngày trước" },
		],
	};
	return (
		<Card className="bg-white">
			<CardHeader>
				<CardTitle>Hoạt động gần đây</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3 text-sm">
					{data.items.map((it, i) => (
						<li key={i} className="rounded-md bg-gray-50 p-3 dark:bg-gray-800/40">
							<div className="flex items-center justify-between">
								<span>{it.title}</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">{it.time}</span>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
