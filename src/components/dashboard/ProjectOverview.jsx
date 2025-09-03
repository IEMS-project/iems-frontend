import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

export default function ProjectOverview() {
	const data = {
		rows: [
			{ name: "Thiết kế lại Website", status: "Đang thực hiện", due: "2025-09-30", progress: 62 },
			{ name: "Ứng dụng Mobile", status: "Đang lên kế hoạch", due: "2025-11-12", progress: 12 },
			{ name: "Tự động hóa nhân sự", status: "Hoàn thành", due: "2025-06-01", progress: 100 },
			{ name: "Kho dữ liệu", status: "Đang đánh giá", due: "2025-10-20", progress: 80 },
			{ name: "Website Marketing", status: "Đang bị chặn", due: "2025-08-15", progress: 35 },
			{ name: "Bảng điều khiển IoT", status: "Đang thực hiện", due: "2025-12-01", progress: 45 },
		],
	};
	return (
		<Card>
			<CardHeader>
				<CardTitle>Tổng quan dự án</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
						<thead>
							<tr className="text-left text-gray-500 dark:text-gray-400">
								<th className="px-4 py-2 font-medium">Dự án</th>
								<th className="px-4 py-2 font-medium">Trạng thái</th>
								<th className="px-4 py-2 font-medium">Hạn chót</th>
								<th className="px-4 py-2 font-medium">Tiến độ</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
							{data.rows.map((r, i) => (
								<tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
									<td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
									<td className="px-4 py-3">{r.status}</td>
									<td className="px-4 py-3">{r.due}</td>
									<td className="px-4 py-3">{r.progress}%</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
