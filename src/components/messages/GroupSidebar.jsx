import React, { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import { api } from "../../lib/api";
import { chatService } from "../../services/chatService";
import { FaTimes, FaCamera, FaEdit, FaBell, FaBellSlash, FaTrash, FaThumbtack, FaChevronDown, FaImage, FaFileAlt, FaLink } from "react-icons/fa";
import MediaPreviewModal from "./MediaPreviewModal";

export default function GroupSidebar({ conversation, currentUserId, getUserName, getUserImage, onConversationUpdated, onClose, onReplyMessage, onReply }) {
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
  // Media & files lazy data
  const [mediaItems, setMediaItems] = useState([]); // {id,url,type,sentAt,senderId}
  const [mediaCursor, setMediaCursor] = useState(null);
  const [mediaHasMore, setMediaHasMore] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaAnchorId, setMediaAnchorId] = useState(null);
  const [fileItems, setFileItems] = useState([]); // {id,url,name,sentAt}
  const [fileCursor, setFileCursor] = useState(null);
  const [fileHasMore, setFileHasMore] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [previewMedia, setPreviewMedia] = useState({ isOpen: false });
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

  // Helpers
  const stripTsPrefix = (nameOrUrl) => {
    try {
      const decoded = decodeURIComponent(nameOrUrl||'');
      const lastSlash = decoded.lastIndexOf('/') + 1;
      const last = decoded.substring(lastSlash);
      const hyphen = last.indexOf('-');
      const leading = hyphen>0 ? last.substring(0, hyphen) : '';
      if (/^\d{10,17}$/.test(leading)) return last.substring(hyphen+1) || last;
      return last || decoded;
    } catch { return nameOrUrl || 'Tệp'; }
  };

  const loadMoreForType = async (type, desiredCount = 30) => {
    if (!conversation?.id) return { items: [], nextCursor: null, hasMore: false };
    let before = type === 'media' ? mediaCursor : fileCursor;
    const collected = [];
    let next = null;
    let hasMore = true;
    for (let rounds = 0; rounds < 10 && collected.length < desiredCount && hasMore; rounds++) {
      const page = await chatService.getConversationMessages(conversation.id, 40, before);
      const list = page?.messages || [];
      next = page?.nextCursor || null;
      hasMore = !!page?.hasMore;
      before = next;
      const filtered = list.filter(m => {
        const t = (m.type || 'TEXT').toUpperCase();
        if (type === 'media') return t === 'IMAGE' || t === 'VIDEO';
        return t === 'FILE';
      });
      for (const m of filtered) {
        const t = (m.type||'TEXT').toUpperCase();
        if (type === 'media') {
          collected.push({ id: m.id || m._id, url: m.content, type: t, sentAt: m.sentAt || m.timestamp, senderId: m.senderId });
        } else {
          collected.push({ id: m.id || m._id, url: m.content, name: stripTsPrefix(m.content), sentAt: m.sentAt || m.timestamp });
        }
        if (collected.length >= desiredCount) break;
      }
    }
    // Sort newest first
    collected.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    return { items: collected, nextCursor: next, hasMore };
  };

  // Load newest 8 media via server newest-by-type API
  const loadInitialMediaLatest8 = async () => {
    setLoadingMedia(true);
    try {
      const resp = await chatService.getLatestByType(conversation.id, 'MEDIA', 8, null);
      const list = (resp?.messages || []).map(m => ({ id: m.id || m._id, url: m.content, type: (m.type||'').toUpperCase(), sentAt: m.sentAt || m.timestamp, senderId: m.senderId }));
      setMediaItems(list);
      setMediaHasMore(!!resp?.hasMore);
      setMediaCursor(resp?.nextCursor || null);
    } catch (e) {
      console.error(e);
      setMediaItems([]);
      setMediaHasMore(false);
      setMediaCursor(null);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Files: initial newest and pagination via newest-by-type
  const loadInitialFiles = async () => {
    setLoadingFiles(true);
    try {
      const resp = await chatService.getLatestByType(conversation.id, 'FILE', 6, null);
      const list = (resp?.messages || []).map(m => ({ id: m.id || m._id, url: m.content, name: stripTsPrefix(m.content), sentAt: m.sentAt || m.timestamp }));
      setFileItems(list);
      setFileHasMore(!!resp?.hasMore);
      setFileCursor(resp?.nextCursor || null);
    } catch (e) { console.error(e); setFileItems([]); setFileHasMore(false); setFileCursor(null); }
    finally { setLoadingFiles(false); }
  };

  const loadInitial = async () => {
    try {
      setLoadingMedia(true); setLoadingFiles(true);
      // Media: load 8 latest
      await loadInitialMediaLatest8();
      // Files: load newest via backend
      await loadInitialFiles();
    } catch (e) { console.error(e); }
    finally { setLoadingFiles(false); }
  };

  useEffect(() => {
    // Load when sidebar opens for a conversation
    if (conversation?.id) {
      setMediaItems([]); setMediaCursor(null); setMediaHasMore(true);
      setFileItems([]); setFileCursor(null); setFileHasMore(true);
      loadInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  const loadMoreMedia = async () => {
    if (loadingMedia || !mediaHasMore) return;
    try {
      setLoadingMedia(true);
      const resp = await chatService.getLatestByType(conversation.id, 'MEDIA', 8, mediaCursor);
      const more = (resp?.messages || []).map(m => ({ id: m.id || m._id, url: m.content, type: (m.type||'').toUpperCase(), sentAt: m.sentAt || m.timestamp, senderId: m.senderId }));
      setMediaItems(prev => {
        const exist = new Set(prev.map(x => x.id));
        const dedup = more.filter(x => !exist.has(x.id));
        const next = [...prev, ...dedup];
        next.sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt));
        return next;
      });
      setMediaCursor(resp?.nextCursor || null);
      setMediaHasMore(!!resp?.hasMore && (resp?.messages || []).length > 0);
    } catch (e) { console.error(e); }
    finally { setLoadingMedia(false); }
  };

  const loadMoreFiles = async () => {
    if (loadingFiles || !fileHasMore) return;
    try {
      setLoadingFiles(true);
      const resp = await chatService.getLatestByType(conversation.id, 'FILE', 6, fileCursor);
      const more = (resp?.messages || []).map(m => ({ id: m.id || m._id, url: m.content, name: stripTsPrefix(m.content), sentAt: m.sentAt || m.timestamp }));
      setFileItems(prev => {
        const exist = new Set(prev.map(x => x.id));
        const dedup = more.filter(x => !exist.has(x.id));
        const next = [...prev, ...dedup];
        next.sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt));
        return next;
      });
      setFileCursor(resp?.nextCursor || null);
      setFileHasMore(!!resp?.hasMore && (resp?.messages || []).length > 0);
    } catch (e) { console.error(e); }
    finally { setLoadingFiles(false); }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 h-full flex flex-col overflow-hidden">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="font-semibold truncate">Thông tin cuộc trò chuyện</div>
        <button onClick={onClose} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Đóng">
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex flex-col items-center gap-3 overflow-auto">
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

          {/* Images/Videos */}
          <div className="w-full mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button onClick={() => setOpenImages(o=>!o)} className="w-full flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2"><FaImage className="w-4 h-4" />Ảnh/Video</div>
              <FaChevronDown className={`w-3 h-3 transition-transform ${openImages ? 'rotate-180' : ''}`} />
            </button>
            {openImages && (
              <div className="mt-3 max-h-60 overflow-auto pr-1">
                <div className="grid grid-cols-4 gap-2">
                  {mediaItems.map(im => (
                    im.type === 'VIDEO' ? (
                      <button key={im.id} className="w-full aspect-square overflow-hidden rounded bg-black" onClick={() => setPreviewMedia({ isOpen: true, messageId: im.id, url: im.url, type: 'VIDEO', sentAt: im.sentAt, senderId: im.senderId })} title={new Date(im.sentAt).toLocaleString('vi-VN')}>
                        <video className="w-full h-full object-cover" preload="metadata" muted>
                          <source src={im.url} />
                        </video>
                      </button>
                    ) : (
                      <button key={im.id} className="w-full aspect-square overflow-hidden rounded" onClick={() => setPreviewMedia({ isOpen: true, messageId: im.id, url: im.url, type: 'IMAGE', sentAt: im.sentAt, senderId: im.senderId })} title={new Date(im.sentAt).toLocaleString('vi-VN')}>
                        <img src={im.url} alt="img" loading="lazy" className="w-full h-full object-cover" />
                      </button>
                    )
                  ))}
                  {mediaItems.length === 0 && !loadingMedia && (
                    <div className="col-span-4 text-center text-xs text-gray-500">Chưa có ảnh/video</div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-3">
              <button onClick={loadMoreMedia} disabled={!mediaHasMore || loadingMedia} className="w-full text-center py-2 text-sm border rounded disabled:opacity-50">
                {loadingMedia ? 'Đang tải...' : mediaHasMore ? 'Xem thêm' : 'Hết' }
              </button>
            </div>
          </div>

          {/* Files */}
          <div className="w-full mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button onClick={() => setOpenFiles(o=>!o)} className="w-full flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2"><FaFileAlt className="w-4 h-4" />File</div>
              <FaChevronDown className={`w-3 h-3 transition-transform ${openFiles ? 'rotate-180' : ''}`} />
            </button>
            {openFiles && (
              <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                {fileItems.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <FaFileAlt className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{f.name}</div>
                      <div className="text-xs text-gray-500 truncate">{new Date(f.sentAt).toLocaleString('vi-VN')}</div>
                    </div>
                  </a>
                ))}
                {fileItems.length === 0 && !loadingFiles && (
                  <div className="text-center text-xs text-gray-500">Chưa có tệp</div>
                )}
              </div>
            )}
            <div className="mt-3">
              <button onClick={loadMoreFiles} disabled={!fileHasMore || loadingFiles} className="w-full text-center py-2 text-sm border rounded disabled:opacity-50">
                {loadingFiles ? 'Đang tải...' : fileHasMore ? 'Xem thêm' : 'Hết' }
              </button>
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
      {/* Preview modal */}
      <MediaPreviewModal
        isOpen={!!previewMedia?.isOpen}
        mediaUrl={previewMedia?.url}
        mediaType={previewMedia?.type}
        messageId={previewMedia?.messageId}
        senderId={previewMedia?.senderId}
        senderName={previewMedia?.senderId ? getUserName?.(previewMedia?.senderId) : undefined}
        senderImage={previewMedia?.senderId ? getUserImage?.(previewMedia?.senderId) : undefined}
        sentAt={previewMedia?.sentAt}
        getUserName={getUserName}
        getUserImage={getUserImage}
        onReplyMessage={(msg) => {
          try {
            const handler = onReply || onReplyMessage;
            if (handler) {
              handler({
                id: msg.id,
                senderId: msg.senderId,
                content: msg.content,
                type: msg.type,
                sentAt: msg.sentAt,
              });
            }
          } finally {
            setPreviewMedia({ isOpen: false });
          }
        }}
        onClose={() => setPreviewMedia({ isOpen: false })}
      />
    </div>
  );
}


