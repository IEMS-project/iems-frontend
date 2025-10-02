import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { userService } from "../../services/userService";
import { useParams } from "react-router-dom";
import { projectService } from "../../services/projectService";

export default function ProjectRoles() {
    const { projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ roleId: "", roleName: "" });
    const [allRoles, setAllRoles] = useState([]);

    const load = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjectRoles(projectId);
            setRoles(Array.isArray(data) ? data : []);
        } catch (_e) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (projectId) load(); }, [projectId]);

    const openAdd = async () => {
        setEditing(null);
        setForm({ roleId: "", roleName: "" });
        try {
            const roles = await userService.getRoles();
            setAllRoles(Array.isArray(roles) ? roles : []);
        } catch { setAllRoles([]); }
        setShowModal(true);
    };
    const openEdit = (r) => {
        setEditing(r);
        setForm({ roleId: r.roleId || "", roleName: r.roleName || "" });
        setShowModal(true);
    };
    const onSubmit = async () => {
        try {
            if (!form.roleId) return;
            await projectService.addProjectRole(projectId, form);
            setShowModal(false);
            await load();
        } catch (_e) {}
    };
    const onDelete = async (r) => {
        if (!window.confirm("Xóa vai trò này?")) return;
        try {
            await projectService.deleteProjectRole(projectId, r.id);
            await load();
        } catch (_e) {}
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Vai trò dự án</CardTitle>
                        <Button size="sm" onClick={openAdd}>+ Thêm vai trò</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-44 overflow-y-auto">
                        {loading ? (
                            <div className="text-center text-gray-500 py-4">Đang tải...</div>
                        ) : roles.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">Chưa có vai trò</div>
                        ) : (
                            <ul className="space-y-2">
                                {roles.map(r => (
                                    <li key={r.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">{r.roleName}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:underline">Sửa</button>
                                            <button onClick={() => onDelete(r)} className="text-xs text-red-600 hover:underline">Xóa</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editing ? "Thêm lại vai trò" : "Thêm vai trò"}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                        <Button onClick={onSubmit}>{editing ? "Cập nhật" : "Thêm"}</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn vai trò từ User-service</label>
                        <Select
                            value={form.roleId}
                            onChange={(e) => {
                                const selected = allRoles.find(r => (r.id === e.target.value || r.id === (e.target.value)));
                                setForm({ roleId: e.target.value, roleName: selected?.name || "" });
                            }}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn vai trò</option>
                            {allRoles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}


