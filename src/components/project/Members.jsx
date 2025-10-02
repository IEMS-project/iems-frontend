import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import UserSelect from "./UserSelect";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../../services/projectService";

const membersData = [];

export default function Members() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        userId: "",
        roleId: "",
        status: "Hoạt động"
    });
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [projectRoles, setProjectRoles] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await projectService.getProjectMembers(projectId);
                
                // Check if response indicates permission error
                if (data && data.status === "error" && 
                    (data.message?.includes("Permission denied") || 
                     data.message?.includes("PERMISSION_DENIED"))) {
                    console.log("Permission error in Members response data, redirecting...");
                    navigate("/permission-denied");
                    return;
                }
                
                setMembers(Array.isArray(data) ? data : []);
                // Load assignable users and project roles in parallel
                const [users, roles] = await Promise.all([
                    (async () => {
                        try { return await import("../../lib/api").then(m => m.api.getAssignableUsers()); } catch { return []; }
                    })(),
                    (async () => {
                        try { return await projectService.getProjectRoles(projectId); } catch { return []; }
                    })()
                ]);
                setAssignableUsers(Array.isArray(users) ? users : []);
                setProjectRoles(Array.isArray(roles) ? roles : []);
            } catch (e) {
                console.log("Members Error:", e);
                console.log("Error status:", e.status);
                console.log("Error message:", e.message);
                console.log("Error data:", e.data);
                
                // Check if it's a permission error
                if (e.status === 403 || 
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    console.log("Permission error detected in Members, redirecting...");
                    // Redirect immediately to permission denied page
                    navigate("/permission-denied");
                    return;
                } else {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId, navigate]);

    const handleEditMember = (member) => {
        setEditingMember(member);
        setFormData({
            userId: member.userId || "",
            roleId: member.roleId || "",
            status: member.status
        });
        setShowModal(true);
    };

    const handleAddMember = () => {
        setEditingMember(null);
        setFormData({
            userId: "",
            roleId: "",
            status: "Hoạt động"
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            // If editingMember exists, update flow would go here (not implemented yet)
            if (!formData.userId) {
                alert("Vui lòng chọn người dùng");
                return;
            }
            
            if (!formData.roleId) {
                alert("Vui lòng chọn vai trò");
                return;
            }

            const memberPayload = {
                userId: formData.userId,
                roleId: formData.roleId, // Required field
            };

            await projectService.addProjectMember(projectId, memberPayload);

            // Refresh members list
            const updated = await projectService.getProjectMembers(projectId);
            setMembers(Array.isArray(updated) ? updated : []);

            setShowModal(false);
            setFormData({ name: "", role: "", status: "Hoạt động" });
        } catch (e) {
            console.error("Error adding project member:", e);
            alert(e?.message || "Có lỗi khi thêm thành viên dự án");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({ name: "", role: "", status: "Hoạt động" });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Thành viên</CardTitle>
                        <Button size="sm" onClick={handleAddMember}>+ Thêm</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-44 overflow-y-auto">
                        <ul className="space-y-3">
                            {loading ? (
                                <li className="text-center text-gray-500 py-4">Đang tải...</li>
                            ) : members.length === 0 ? (
                                <li className="text-center text-gray-500 py-4">Chưa có thành viên</li>
                            ) : (
                                members.map(m => (
                                    <li key={m.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={m.userName || m.userEmail} size={9} />
                                            <div>
                                                <div className="text-sm font-medium">{m.userName || m.userEmail}</div>
                                                <div className="text-xs text-gray-500">{m.roleName || m.role || "N/A"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="gray">Hoạt động</Badge>
                                            <button
                                                onClick={() => handleEditMember(m)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Sửa
                                            </button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                        <Button onClick={handleSubmit}>
                            {editingMember ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                        {/* Custom searchable dropdown to show avatar + name (top) and email (bottom) */}
                        <UserSelect
                            assignableUsers={assignableUsers}
                            value={formData.userId}
                            onChange={(id) => setFormData({ ...formData, userId: id })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                        <Select
                            value={formData.roleId}
                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn vai trò</option>
                            {projectRoles.map(r => (
                                <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Không hoạt động">Không hoạt động</option>
                            <option value="Tạm nghỉ">Tạm nghỉ</option>
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}
