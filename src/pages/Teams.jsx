import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import DepartmentCard from "../components/teams/DepartmentCard";

const initialDepartments = {
    "Phát triển": {
        id: "dev",
        name: "Phát triển",
        description: "Phát triển sản phẩm và tính năng mới",
        memberCount: 8,
        color: "bg-blue-500",
        members: [
            { id: "M001", name: "Nguyễn Văn A", email: "a.nguyen@company.com", role: "Team Lead", avatar: "A" },
            { id: "M002", name: "Trần Thị B", email: "b.tran@company.com", role: "Senior Developer", avatar: "B" },
            { id: "M003", name: "Lê Văn C", email: "c.le@company.com", role: "Developer", avatar: "C" },
            { id: "M004", name: "Phạm Thị D", email: "d.pham@company.com", role: "Developer", avatar: "D" },
            { id: "M005", name: "Hoàng Văn E", email: "e.hoang@company.com", role: "Developer", avatar: "E" },
            { id: "M006", name: "Vũ Thị F", email: "f.vu@company.com", role: "Developer", avatar: "F" },
            { id: "M007", name: "Đặng Văn G", email: "g.dang@company.com", role: "Developer", avatar: "G" },
            { id: "M008", name: "Bùi Thị H", email: "h.bui@company.com", role: "Developer", avatar: "H" }
        ]
    },
    "Thiết kế": {
        id: "design",
        name: "Thiết kế",
        description: "Thiết kế UI/UX và trải nghiệm người dùng",
        memberCount: 4,
        color: "bg-purple-500",
        members: [
            { id: "M009", name: "Ngô Văn I", email: "i.ngo@company.com", role: "Design Lead", avatar: "I" },
            { id: "M010", name: "Đinh Thị K", email: "k.dinh@company.com", role: "UI Designer", avatar: "K" },
            { id: "M011", name: "Lý Văn L", email: "l.ly@company.com", role: "UX Designer", avatar: "L" },
            { id: "M012", name: "Hồ Thị M", email: "m.ho@company.com", role: "Graphic Designer", avatar: "M" }
        ]
    },
    "Marketing": {
        id: "marketing",
        name: "Marketing",
        description: "Quảng cáo và truyền thông sản phẩm",
        memberCount: 6,
        color: "bg-green-500",
        members: [
            { id: "M013", name: "Dương Văn N", email: "n.duong@company.com", role: "Marketing Manager", avatar: "N" },
            { id: "M014", name: "Võ Thị O", email: "o.vo@company.com", role: "Content Creator", avatar: "O" },
            { id: "M015", name: "Tô Văn P", email: "p.to@company.com", role: "SEO Specialist", avatar: "P" },
            { id: "M016", name: "Châu Thị Q", email: "q.chau@company.com", role: "Social Media", avatar: "Q" },
            { id: "M017", name: "Hà Văn R", email: "r.ha@company.com", role: "Analyst", avatar: "R" },
            { id: "M018", name: "Lâm Thị S", email: "s.lam@company.com", role: "Event Coordinator", avatar: "S" }
        ]
    },
    "Hỗ trợ": {
        id: "support",
        name: "Hỗ trợ",
        description: "Hỗ trợ khách hàng và giải đáp thắc mắc",
        memberCount: 5,
        color: "bg-orange-500",
        members: [
            { id: "M019", name: "Thái Văn T", email: "t.thai@company.com", role: "Support Lead", avatar: "T" },
            { id: "M020", name: "Từ Thị U", email: "u.tu@company.com", role: "Customer Success", avatar: "U" },
            { id: "M021", name: "Trịnh Văn V", email: "v.trinh@company.com", role: "Support Agent", avatar: "V" },
            { id: "M022", name: "Đoàn Thị W", email: "w.doan@company.com", role: "Support Agent", avatar: "W" },
            { id: "M023", name: "Mai Văn X", email: "x.mai@company.com", role: "Support Agent", avatar: "X" }
        ]
    }
};

export default function Teams() {
    const [departments] = useState(initialDepartments);

    const totalMembers = Object.values(departments).reduce((sum, dept) => sum + dept.memberCount, 0);
    const totalDepartments = Object.keys(departments).length;

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Đội nhóm</h1>

                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Tổng thành viên</p>
                                    <p className="text-2xl font-semibold text-gray-900">{totalMembers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Phòng ban</p>
                                    <p className="text-2xl font-semibold text-gray-900">{totalDepartments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Department Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Tổng quan phòng ban
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {Object.entries(departments).map(([deptKey, dept]) => (
                                <DepartmentCard key={dept.id} department={dept} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
