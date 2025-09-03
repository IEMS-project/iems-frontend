import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

const projectDetails = {
    client: "ABC Corp",
    projectManager: "Nguyễn Văn A",
    startDate: "01/09/2024",
    endDate: "31/12/2024",
    description: "Hệ thống quản lý năng lượng thông minh cho doanh nghiệp, bao gồm giám sát, báo cáo, tối ưu hóa tiêu thụ."
};

export default function ProjectDetails() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Thông tin dự án</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <div className="text-xs uppercase text-gray-500">Khách hàng</div>
                        <div className="text-gray-800 dark:text-gray-100">{projectDetails.client}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">Quản lý dự án</div>
                        <div className="text-gray-800 dark:text-gray-100">{projectDetails.projectManager}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">Ngày bắt đầu</div>
                        <div className="text-gray-800 dark:text-gray-100">{projectDetails.startDate}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">Hạn hoàn thành</div>
                        <div className="text-gray-800 dark:text-gray-100">{projectDetails.endDate}</div>
                    </div>
                    <div className="sm:col-span-2">
                        <div className="text-xs uppercase text-gray-500">Mô tả</div>
                        <div className="text-gray-800 dark:text-gray-100">{projectDetails.description}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
