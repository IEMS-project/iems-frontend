import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import MemberCard from "../components/teams/MemberCard";
import MemberForm from "../components/teams/MemberForm";

const initialDepartments = {
    "dev": {
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
    "design": {
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
    "marketing": {
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
    "support": {
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

export default function DepartmentDetail() {
    const { departmentId } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: ""
    });

    useEffect(() => {
        const dept = initialDepartments[departmentId];
        if (dept) {
            setDepartment(dept);
        } else {
            navigate("/teams");
        }
    }, [departmentId, navigate]);

    const handleAddMember = () => {
        setFormData({ name: "", email: "", role: "" });
        setShowAddModal(true);
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            role: member.role
        });
        setShowEditModal(true);
    };

    const handleDeleteMember = (memberId) => {
        if (department && window.confirm("Bạn có chắc muốn xóa thành viên này?")) {
            const updatedMembers = department.members.filter(m => m.id !== memberId);
            const updatedDepartment = {
                ...department,
                members: updatedMembers,
                memberCount: updatedMembers.length
            };
            setDepartment(updatedDepartment);
        }
    };

    const handleSubmitAddMember = () => {
        if (formData.name && formData.email && formData.role) {
            const newMember = {
                id: `M${String(Date.now()).slice(-6)}`,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                avatar: formData.name.charAt(0)
            };

            const updatedMembers = [...department.members, newMember];
            const updatedDepartment = {
                ...department,
                members: updatedMembers,
                memberCount: updatedMembers.length
            };

            setDepartment(updatedDepartment);
            setShowAddModal(false);
            setFormData({ name: "", email: "", role: "" });
        }
    };

    const handleSubmitEditMember = () => {
        if (formData.name && formData.email && formData.role && editingMember) {
            const updatedMembers = department.members.map(m => 
                m.id === editingMember.id 
                    ? { ...m, name: formData.name, email: formData.email, role: formData.role, avatar: formData.name.charAt(0) }
                    : m
            );

            const updatedDepartment = {
                ...department,
                members: updatedMembers
            };

            setDepartment(updatedDepartment);
            setShowEditModal(false);
            setEditingMember(null);
            setFormData({ name: "", email: "", role: "" });
        }
    };

    if (!department) {
        return null;
    }

    return (
        <>
            <MainLayout>
                <div className="space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/teams")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
                                <p className="text-gray-600 mt-1">{department.description}</p>
                            </div>
                        </div>
                        <Button onClick={handleAddMember} className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm thành viên
                        </Button>
                    </div>

                    {/* Department Stats */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className={`p-3 ${department.color} rounded-lg`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Tổng thành viên</p>
                                        <p className="text-2xl font-semibold text-gray-900">{department.memberCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                                        <p className="text-2xl font-semibold text-gray-900">{department.memberCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Cập nhật gần nhất</p>
                                        <p className="text-2xl font-semibold text-gray-900">Hôm nay</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Members List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Danh sách thành viên
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                {department.members.map((member) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        onEdit={handleEditMember}
                                        onDelete={handleDeleteMember}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>

            {/* Add Member Modal */}
            <Modal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Thêm thành viên mới"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Hủy</Button>
                        <Button onClick={handleSubmitAddMember}>Thêm thành viên</Button>
                    </div>
                }
            >
                <MemberForm formData={formData} setFormData={setFormData} />
            </Modal>

            {/* Edit Member Modal */}
            <Modal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa thành viên"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Hủy</Button>
                        <Button onClick={handleSubmitEditMember}>Cập nhật</Button>
                    </div>
                }
            >
                <MemberForm formData={formData} setFormData={setFormData} isEdit={true} />
            </Modal>
        </>
    );
}
