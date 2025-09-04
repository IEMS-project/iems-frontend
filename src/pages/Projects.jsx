import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import PageHeader from "../components/common/PageHeader";

const projectsData = [
    { id: "iems-001", name: "IEMS Platform", status: "Đang thực hiện", owner: "Nguyễn Văn A", client: "ABC Corp", startDate: "2024-09-01" },
    { id: "ems-002", name: "EMS Retail", status: "Chờ", owner: "Trần Thị B", client: "XYZ Inc", startDate: "2024-10-01" },
    { id: "smart-003", name: "Smart Grid", status: "Hoàn thành", owner: "Lê Văn C", client: "DEF Ltd", startDate: "2024-06-01" },
];

export default function Projects() {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        id: "",
        client: "",
        owner: "",
        startDate: "",
        endDate: "",
        description: ""
    });

    const handleCreateProject = () => {
        setFormData({
            name: "",
            id: "",
            client: "",
            owner: "",
            startDate: "",
            endDate: "",
            description: ""
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        // Here you would typically save the data
        console.log("Creating project:", formData);
        setShowModal(false);
        setFormData({
            name: "",
            id: "",
            client: "",
            owner: "",
            startDate: "",
            endDate: "",
            description: ""
        });
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({
            name: "",
            id: "",
            client: "",
            owner: "",
            startDate: "",
            endDate: "",
            description: ""
        });
    };

    return (
        <>
            <div className="space-y-6">
                <PageHeader breadcrumbs={[{ label: "Dự án", to: "/projects" }]} />

                <Card>

                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Danh sách dự án</CardTitle>
                        <Button onClick={handleCreateProject}>Tạo dự án</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Mã</TH>
                                    <TH>Tên</TH>
                                    <TH>Trạng thái</TH>
                                    <TH>Chủ sở hữu</TH>
                                    <TH>Khách hàng</TH>
                                    <TH></TH>
                                </TR>
                            </THead>
                            <TBody>
                                {projectsData.map(p => (
                                    <TR key={p.id}>
                                        <TD className="font-medium">{p.id.toUpperCase()}</TD>
                                        <TD>
                                            <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                                        </TD>
                                        <TD>{p.status}</TD>
                                        <TD>{p.owner}</TD>
                                        <TD>{p.client}</TD>

                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Modal
                open={showModal}
                onClose={handleClose}
                title="Tạo dự án mới"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                        <Button onClick={handleSubmit}>Tạo dự án</Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã dự án</label>
                        <Input
                            type="text"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mã dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                        <Input
                            type="text"
                            value={formData.client}
                            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên khách hàng"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quản lý dự án</label>
                        <Input
                            type="text"
                            value={formData.owner}
                            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên quản lý dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mô tả dự án"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
