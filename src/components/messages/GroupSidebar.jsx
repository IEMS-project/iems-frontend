import React, { useMemo, useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import { api } from "../../lib/api";
import { chatService } from "../../services/chatService";
import { FaTimes, FaCamera, FaEdit, FaBell, FaBellSlash, FaTrash, FaThumbtack, FaChevronDown, FaImage, FaFileAlt, FaLink } from "react-icons/fa";

export default function GroupSidebar({ conversation, currentUserId, getUserName, getUserImage, onConversationUpdated, onClose }) {
  const isOwner = conversation?.createdBy === currentUserId;
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(conversation?.name || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(conversation?.notificationsEnabled !== false);
  const [isPinned, setIsPinned] = useState(!!conversation?.isPinned);
  const [openImages, setOpenImages] = useState(true);
  const [openFiles, setOpenFiles] = useState(true);
  const [openLinks, setOpenLinks] = useState(true);
  const mockImages = Array.from({ length: 8 }).map((_, i) => ({ id: `img-${i}`, url: `https://picsum.photos/seed/${i}/200/200` }));
  const mockFiles = [
    { id: 'f1', name: 'Báo cáo Q3.pdf', size: '106 KB', date: '02/10/2025' },
    { id: 'f2', name: 'Demo.mp4', size: '4.2 MB', date: '30/09/2025' },
    { id: 'f3', name: 'Ghi âm.m4a', size: '315 KB', date: '28/09/2025' }
  ];
  const mockLinks = [
    { id: 'l1', url: 'http://localhost:8080/document-service', label: 'local' },
    { id: 'l2', url: 'https://example.com/spec', label: 'Spec' },
    { id: 'l3', url: 'https://cloud.mongodb.com', label: 'MongoDB Cloud' }
  ];

  const isDirect = useMemo(() => {
    const type = (conversation?.type || '').toUpperCase();
    return type === 'DIRECT' || (((conversation?.members || []).length === 2) && !conversation?.name);
  }, [conversation]);

  const peerId = useMemo(() => {
    const members = conversation?.members || [];
    return members.find(m => m !== currentUserId) || members[0] || '';
  }, [conversation, currentUserId]);

  const handleSaveName = async () => {
    try {
      const updated = await chatService.updateGroupName(conversation.id, name.trim());
      setEditingName(false);
      onConversationUpdated && onConversationUpdated(updated);
    } catch (e) { console.error(e); }
  };

  const handlePickAvatar = () => fileInputRef.current?.click();
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload to DocumentService; it will call Chat-Service via Feign to update avatar
      await api.uploadGroupAvatar(conversation.id, file);
      // Fetch latest group to update UI immediately
      const updated = await chatService.getGroup(conversation.id);
      onConversationUpdated && onConversationUpdated(updated);
    } catch (err) { console.error(err); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const members = conversation?.members || [];

  const handleToggleNotifications = async () => {
    try {
      // Optimistic update
      setNotificationsEnabled(v => !v);
      await chatService.toggleNotificationSettings(conversation.id).catch(() => { });
      onConversationUpdated && onConversationUpdated({ ...conversation, notificationsEnabled: !notificationsEnabled });
    } catch (e) { console.error(e); }
  };

  const handleClearMyMessages = async () => {
    if (!window.confirm('Xóa toàn bộ tin nhắn của cuộc trò chuyện này trên máy bạn?')) return;
    try {
      // Iteratively fetch and delete messages for current user
      let before = null;
      let totalDeleted = 0;
      // Limit safety to avoid infinite loops
      for (let rounds = 0; rounds < 30; rounds++) {
        const page = await chatService.getConversationMessages(conversation.id, 50, before);
        const list = page?.messages || [];
        if (list.length === 0) break;
        // Delete each message for me
        await Promise.allSettled(list.map(m => chatService.deleteForMe(m.id || m._id)));
        totalDeleted += list.length;
        const oldest = list[0];
        before = oldest ? (oldest.sentAt || oldest.timestamp) : null;
        if (!page?.hasMore) break;
      }
      // Notify parent to refresh if needed
      onConversationUpdated && onConversationUpdated(conversation);
      alert(`Đã xóa ${totalDeleted} tin nhắn trên máy bạn`);
    } catch (e) {
      console.error(e);
      alert('Không thể xóa lịch sử ngay lúc này');
    }
  };

  const handleTogglePin = async () => {
    try {
      // Optimistic toggle
      setIsPinned(v => !v);
      if (isPinned) {
        await chatService.unpinConversation(conversation.id).catch(() => { });
      } else {
        await chatService.pinConversation(conversation.id).catch(() => { });
      }
      onConversationUpdated && onConversationUpdated({ ...conversation, isPinned: !isPinned });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 h-full flex flex-col">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="font-semibold truncate">Thông tin cuộc trò chuyện</div>
        <button onClick={onClose} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Đóng">
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar src={isDirect ? getUserImage(peerId) : (conversation?.avatarUrl || "")} name={isDirect ? getUserName(peerId) : (conversation?.name || conversation?.id)} size={16} />
          {!isDirect && isOwner && (
            <button onClick={handlePickAvatar} className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white disabled:opacity-50 shadow" disabled={uploading} title="Đổi ảnh nhóm">
              {uploading ? <span className="text-xs">...</span> : <FaCamera className="w-4 h-4" />}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {isDirect ? (
          <div className="w-full flex items-center justify-center">
            <div className="text-lg font-semibold truncate text-center">{getUserName(peerId)}</div>
          </div>
        ) : (
          editingName ? (
            <div className="w-full flex items-center gap-2">
              <input className="flex-1 px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700" value={name} onChange={(e) => setName(e.target.value)} />
              <button onClick={handleSaveName} className="px-3 py-2 bg-blue-600 text-white rounded" title="Lưu tên">Lưu</button>
              <button onClick={() => { setEditingName(false); setName(conversation?.name || ""); }} className="px-3 py-2 border rounded" title="Hủy">Hủy</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">{conversation?.name || 'Nhóm'}</div>
              {isOwner && (
                <button onClick={() => setEditingName(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" title="Sửa tên nhóm">
                  <FaEdit className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        )}
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <button onClick={handleToggleNotifications} className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
            {notificationsEnabled ? <FaBell className="w-4 h-4" /> : <FaBellSlash className="w-4 h-4" />}
            <span className="text-xs">{notificationsEnabled ? 'Tắt thông báo' : 'Bật thông báo'}</span>
          </button>
          <button onClick={handleTogglePin} className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 ${isPinned ? 'text-blue-600' : ''}`}>
            <FaThumbtack className="w-4 h-4" />
            <span className="text-xs">{isPinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}</span>
          </button>
          <button onClick={handleClearMyMessages} className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600">
            <FaTrash className="w-4 h-4" />
            <span className="text-xs">Xóa tin nhắn</span>
          </button>
        </div>

          {/* Mock sections: Images */}
          <div className="w-full mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button onClick={() => setOpenImages(o=>!o)} className="w-full flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2"><FaImage className="w-4 h-4" />Ảnh/Video</div>
              <FaChevronDown className={`w-3 h-3 transition-transform ${openImages ? 'rotate-180' : ''}`} />
            </button>
            {openImages && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {mockImages.map(im => (
                  <img key={im.id} src={im.url} alt="img" className="w-full aspect-square object-cover rounded" />
                ))}
              </div>
            )}
            <div className="mt-3">
              <button className="w-full text-center py-2 text-sm border rounded">Xem tất cả</button>
            </div>
          </div>

          {/* Mock sections: Files */}
          <div className="w-full mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button onClick={() => setOpenFiles(o=>!o)} className="w-full flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2"><FaFileAlt className="w-4 h-4" />File</div>
              <FaChevronDown className={`w-3 h-3 transition-transform ${openFiles ? 'rotate-180' : ''}`} />
            </button>
            {openFiles && (
              <div className="mt-3 space-y-2">
                {mockFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <FaFileAlt className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="text-sm truncate">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.size} • {f.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <button className="w-full text-center py-2 text-sm border rounded">Xem tất cả</button>
            </div>
          </div>

          {/* Mock sections: Links */}
          <div className="w-full mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button onClick={() => setOpenLinks(o=>!o)} className="w-full flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2"><FaLink className="w-4 h-4" />Link</div>
              <FaChevronDown className={`w-3 h-3 transition-transform ${openLinks ? 'rotate-180' : ''}`} />
            </button>
            {openLinks && (
              <div className="mt-3 space-y-2">
                {mockLinks.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <FaLink className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{l.url}</div>
                      <div className="text-xs text-gray-500">{l.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <div className="mt-3">
              <button className="w-full text-center py-2 text-sm border rounded">Xem tất cả</button>
            </div>
          </div>
      </div>
      {!isDirect && (
        <>
          <div className="px-4 py-2 text-xs text-gray-500">Thành viên ({members.length})</div>
          <div className="flex-1 overflow-auto">
            {members.map(uid => (
              <div key={uid} className="flex items-center gap-3 px-4 py-2 border-b border-gray-50 dark:border-gray-800">
                <Avatar src={getUserImage(uid)} name={getUserName(uid)} size={8} />
                <div className="text-sm font-medium truncate">{getUserName(uid)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


