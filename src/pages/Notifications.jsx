import React, { useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Card, CardContent } from "../components/ui/Card";

const mockDepartments = [
  { id: "d1", name: "Phát triển" },
  { id: "d2", name: "Marketing" },
  { id: "d3", name: "Thiết kế" },
];

const mockUsers = [
  { id: "u1", name: "Nguyễn Văn A" },
  { id: "u2", name: "Trần Thị B" },
  { id: "u3", name: "Lê Văn C" },
];

const mockProjects = [
  { id: "p1", name: "IEMS Core" },
  { id: "p2", name: "Mobile App" },
  { id: "p3", name: "Website" },
];

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, when: "10:15 01/09/2025", senderName: "Nguyễn Văn A", title: "Họp sprint", message: "Họp sprint lúc 14:00 hôm nay ở phòng họp 2." },
    { id: 2, when: "09:00 01/09/2025", senderName: "Trần Thị B", title: "Deploy staging", message: "Deployment staging 11:00 - kiểm tra regression cases." },
    { id: 3, when: "18:30 31/08/2025", senderName: "Lê Văn C", title: "Nghỉ lễ", message: "Nghỉ lễ Quốc khánh 02/09 - chúc mọi người nghỉ vui." },
  ]);
  const [targetType, setTargetType] = useState("department");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const targetOptions = useMemo(() => {
    if (targetType === "department") return mockDepartments;
    if (targetType === "user") return mockUsers;
    return mockProjects;
  }, [targetType]);

  const canSend = title.trim() && message.trim() && targetId;

  const handleSend = () => {
    if (!canSend) return;
    const option = targetOptions.find(o => o.id === targetId);
    const newItem = {
      id: Date.now(),
      when: new Date().toLocaleString('vi-VN'),
      senderName: "Bạn",
      title: title.trim(),
      message: message.trim(),
    };
    setNotifications(prev => [newItem, ...prev]);
    setTitle("");
    setMessage("");
    setTargetId("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader breadcrumbs={[{ label: "Thông báo" }]} />

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="px-4">Tạo thông báo</Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tạo thông báo"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSend} disabled={!canSend}>Gửi</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Gửi đến"
              value={targetType}
              onChange={e => { setTargetType(e.target.value); setTargetId(""); }}
            >
              <option value="department">Phòng ban</option>
              <option value="user">Cá nhân</option>
              <option value="project">Dự án</option>
            </Select>
            <Select
              label={targetType === 'department' ? 'Chọn phòng ban' : targetType === 'user' ? 'Chọn cá nhân' : 'Chọn dự án'}
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            >
              <option value="">-- Chọn --</option>
              {targetOptions.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Tiêu đề"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo"
          />
          <Textarea
            label="Nội dung"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo"
            rows={5}
          />
        </div>
      </Modal>

      <Card className="mt-2">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Chưa có thông báo nào</div>
            ) : notifications.map(n => (
              <div key={n.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{n.when}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Người gửi: <span className="font-medium text-gray-900 dark:text-gray-100">{n.senderName}</span></div>
                </div>
                <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{n.title}</div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{n.message}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


