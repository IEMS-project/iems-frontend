import React, { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "../ui/Avatar.jsx";
import { documentService } from "../../services/documentService";
import { chatService } from "../../services/chatService";
import Skeleton from "../ui/Skeleton";
import { X, Camera, Edit, Bell, BellOff, Trash2, Pin, ChevronDown, Image as ImageIcon, FileText, Link as LinkIcon, Search, Loader2 } from "lucide-react";
import MediaPreviewModal from "./MediaPreviewModal";
import { toast } from "sonner";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useTranslation } from "react-i18next";

export default function GroupSidebar({ conversation, currentUserId, getUserName, getUserImage, onConversationUpdated, onClose, onReplyMessage, onReply, onMessageClick, openSearch = false, onSearchOpened }) {
  const { t } = useTranslation();
  const isOwner = conversation?.createdBy === currentUserId;
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(conversation?.name || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(conversation?.notificationsEnabled !== false);
  const [isPinned, setIsPinned] = useState(!!conversation?.isPinned);
  const [openImages, setOpenImages] = useState(true);
  const [openFiles, setOpenFiles] = useState(true);
  const [openLinks, setOpenLinks] = useState(false);
  const [openSearchSection, setOpenSearchSection] = useState(false);
  const searchInputRef = useRef(null);
  const [clearMessagesDialogOpen, setClearMessagesDialogOpen] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
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
      await documentService.uploadGroupAvatar(conversation.id, file);
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

  const handleClearMyMessages = () => {
    setClearMessagesDialogOpen(true);
  };

  const confirmClearMyMessages = async () => {
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
      toast.success(t('messages.sidebar.messagesCleared', { count: totalDeleted }));
      setClearMessagesDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(t('messages.sidebar.clearMessagesError'));
      setClearMessagesDialogOpen(false);
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
      const decoded = decodeURIComponent(nameOrUrl || '');
      const lastSlash = decoded.lastIndexOf('/') + 1;
      const last = decoded.substring(lastSlash);
      const hyphen = last.indexOf('-');
      const leading = hyphen > 0 ? last.substring(0, hyphen) : '';
      if (/^\d{10,17}$/.test(leading)) return last.substring(hyphen + 1) || last;
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
        const t = (m.type || 'TEXT').toUpperCase();
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
      const list = (resp?.messages || []).map(m => ({ id: m.id || m._id, url: m.content, type: (m.type || '').toUpperCase(), sentAt: m.sentAt || m.timestamp, senderId: m.senderId }));
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
      // Reset search when conversation changes
      setSearchQuery("");
      setSearchResults([]);
      setSearchPage(0);
      setSearchHasMore(false);
      setSearchTotal(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  // Auto-open search section when openSearch prop is true
  useEffect(() => {
    if (openSearch && conversation?.id) {
      setOpenSearchSection(true);
      // Focus input after a short delay to ensure it's rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
        onSearchOpened?.();
      }, 100);
    }
  }, [openSearch, conversation?.id, onSearchOpened]);

  // Search handlers
  const handleSearch = async (query, pageNum = 0) => {
    if (!query.trim() || !conversation?.id) return;

    try {
      setSearchLoading(true);
      const result = await chatService.searchMessages(conversation.id, query, pageNum, 10);

      if (pageNum === 0) {
        setSearchResults(result.messages || []);
      } else {
        setSearchResults(prev => [...prev, ...(result.messages || [])]);
      }

      setSearchHasMore(result.hasMore || false);
      setSearchTotal(result.total || 0);
      setSearchPage(pageNum);
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim(), 0);
    }
  };

  const handleLoadMoreSearch = () => {
    if (searchHasMore && !searchLoading) {
      handleSearch(searchQuery, searchPage + 1);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  const highlightKeyword = (text, keyword) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark class="bg-muted text-foreground font-medium">$1</mark>');
  };

  const loadMoreMedia = async () => {
    if (loadingMedia || !mediaHasMore) return;
    try {
      setLoadingMedia(true);
      const resp = await chatService.getLatestByType(conversation.id, 'MEDIA', 8, mediaCursor);
      const more = (resp?.messages || []).map(m => ({ id: m.id || m._id, url: m.content, type: (m.type || '').toUpperCase(), sentAt: m.sentAt || m.timestamp, senderId: m.senderId }));
      setMediaItems(prev => {
        const exist = new Set(prev.map(x => x.id));
        const dedup = more.filter(x => !exist.has(x.id));
        const next = [...prev, ...dedup];
        next.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
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
        next.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        return next;
      });
      setFileCursor(resp?.nextCursor || null);
      setFileHasMore(!!resp?.hasMore && (resp?.messages || []).length > 0);
    } catch (e) { console.error(e); }
    finally { setLoadingFiles(false); }
  };

  return (
    <div className="w-80 border-l border-border h-full flex flex-col overflow-hidden bg-card">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="font-semibold truncate text-foreground">{t('messages.header.conversationInfo')}</div>
        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors" title={t('ui.common.close')}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar src={isDirect ? getUserImage(peerId) : (conversation?.avatarUrl || "")} name={isDirect ? getUserName(peerId) : (conversation?.name || conversation?.id)} size={16} />
            {!isDirect && isOwner && (
              <button onClick={handlePickAvatar} className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 shadow" disabled={uploading} title={t('messages.sidebar.groupAvatar')}>
                {uploading ? <span className="text-xs">...</span> : <Camera className="w-4 h-4" />}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {isDirect ? (
            <div className="w-full flex items-center justify-center">
              <div className="text-lg font-semibold truncate text-center text-foreground">{getUserName(peerId)}</div>
            </div>
          ) : (
            editingName ? (
              <div className="w-full flex items-center gap-2">
                <input className="flex-1 px-3 py-2 border border-input rounded bg-background text-foreground" value={name} onChange={(e) => setName(e.target.value)} />
                <button onClick={handleSaveName} className="px-3 py-2 bg-primary text-primary-foreground rounded" title={t('ui.common.save')}>{t('ui.common.save')}</button>
                <button onClick={() => { setEditingName(false); setName(conversation?.name || ""); }} className="px-3 py-2 border border-border rounded" title={t('ui.common.cancel')}>{t('ui.common.cancel')}</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-foreground">{conversation?.name || t('messages.group.groupName')}</div>
                {isOwner && (
                  <button onClick={() => setEditingName(true)} className="p-2 rounded-full hover:bg-muted text-muted-foreground" title={t('messages.sidebar.editGroupName')}>
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          )}
          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <button onClick={handleToggleNotifications} className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded hover:bg-muted">
              {notificationsEnabled ? <Bell className="w-4 h-4 text-foreground" /> : <BellOff className="w-4 h-4 text-foreground" />}
              <span className="text-xs text-foreground">{notificationsEnabled ? t('messages.conversation.muteNotifications') : t('messages.conversation.unmuteNotifications')}</span>
            </button>
            <button onClick={handleTogglePin} className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded hover:bg-muted ${isPinned ? 'text-foreground' : 'text-foreground'}`}>
              <Pin className="w-4 h-4" />
              <span className="text-xs">{isPinned ? t('messages.conversation.unpin') : t('messages.conversation.pin')}</span>
            </button>
            <button onClick={handleClearMyMessages} className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded hover:bg-muted text-destructive">
              <Trash2 className="w-4 h-4" />
              <span className="text-xs">{t('messages.sidebar.clearMessages')}</span>
            </button>
          </div>

          {/* Search Messages */}
          <div className="w-full mt-3 border-t border-border pt-3">
            <button onClick={() => setOpenSearchSection(o => !o)} className="w-full flex items-center justify-between text-foreground">
              <div className="text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4" />{t('messages.sidebar.searchMessages')}</div>
              <ChevronDown className={`w-3 h-3 transition-transform ${openSearchSection ? 'rotate-180' : ''}`} />
            </button>
            {openSearchSection && (
              <div className="mt-3 space-y-3">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('messages.search.placeholder')}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || searchLoading}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center"
                  >
                    {searchLoading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {t('messages.search.results', { count: searchTotal })}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {searchResults.map((result) => (
                        <div
                          key={result.id || result._id}
                          className="bg-muted rounded-lg p-2 hover:bg-muted/80 transition-colors cursor-pointer"
                          onClick={() => {
                            if (onMessageClick) {
                              onMessageClick(result);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Avatar
                              src={getUserImage?.(result.senderId)}
                              name={getUserName(result.senderId)}
                              size={6}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-medium text-foreground">
                                  {getUserName(result.senderId)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(result.sentAt)}
                                </div>
                              </div>
                              <div
                                className="text-xs text-foreground line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightKeyword(result.snippet || result.content || '', searchQuery)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {searchHasMore && (
                      <button
                        onClick={handleLoadMoreSearch}
                        disabled={searchLoading}
                        className="w-full text-center py-1.5 text-xs border border-border rounded disabled:opacity-50 text-foreground hover:bg-muted"
                      >
                        {searchLoading ? t('ui.common.loading') : t('messages.sidebar.loadMore')}
                      </button>
                    )}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !searchLoading && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    {t('messages.search.noResults')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Images/Videos */}
          <div className="w-full mt-3 border-t border-border pt-3">
            <button onClick={() => setOpenImages(o => !o)} className="w-full flex items-center justify-between text-foreground">
              <div className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4" />{t('messages.sidebar.media')}</div>
              <ChevronDown className={`w-3 h-3 transition-transform ${openImages ? 'rotate-180' : ''}`} />
            </button>
            {openImages && (
              <div className="mt-3 max-h-60 overflow-auto pr-1">
                {loadingMedia ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <Skeleton key={idx} className="aspect-square w-full rounded" />
                    ))}
                  </div>
                ) : (
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
                    {mediaItems.length === 0 && (
                      <div className="col-span-4 text-center text-xs text-muted-foreground">{t('messages.sidebar.noMedia')}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3">
              <button onClick={loadMoreMedia} disabled={!mediaHasMore || loadingMedia} className="w-full text-center py-2 text-sm border border-border rounded disabled:opacity-50 text-foreground">
                {loadingMedia ? t('ui.common.loading') : mediaHasMore ? t('messages.sidebar.loadMore') : t('messages.sidebar.noMore')}
              </button>
            </div>
          </div>

          {/* Files */}
          <div className="w-full mt-3 border-t border-border pt-3">
            <button onClick={() => setOpenFiles(o => !o)} className="w-full flex items-center justify-between text-foreground">
              <div className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />{t('messages.sidebar.files')}</div>
              <ChevronDown className={`w-3 h-3 transition-transform ${openFiles ? 'rotate-180' : ''}`} />
            </button>
            {openFiles && (
              <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                {loadingFiles ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded border border-dashed border-border">
                      <Skeleton className="h-6 w-6 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {fileItems.map(f => (
                      <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                        <FileText className="w-5 h-5 text-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate text-foreground">{f.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{new Date(f.sentAt).toLocaleString('vi-VN')}</div>
                        </div>
                      </a>
                    ))}
                    {fileItems.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground">{t('messages.sidebar.noFiles')}</div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="mt-3">
              <button onClick={loadMoreFiles} disabled={!fileHasMore || loadingFiles} className="w-full text-center py-2 text-sm border border-border rounded disabled:opacity-50 text-foreground">
                {loadingFiles ? t('ui.common.loading') : fileHasMore ? t('messages.sidebar.loadMore') : t('messages.sidebar.noMore')}
              </button>
            </div>
          </div>

          {/* Mock sections: Links */}
          <div className="w-full mt-3 border-t border-border pt-3">
            <button onClick={() => setOpenLinks(o => !o)} className="w-full flex items-center justify-between text-foreground">
              <div className="text-sm font-semibold flex items-center gap-2"><LinkIcon className="w-4 h-4" />{t('messages.sidebar.links')}</div>
              <ChevronDown className={`w-3 h-3 transition-transform ${openLinks ? 'rotate-180' : ''}`} />
            </button>
            {openLinks && (
              <div className="mt-3 space-y-2">
                {mockLinks.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                    <LinkIcon className="w-5 h-5 text-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate text-foreground">{l.url}</div>
                      <div className="text-xs text-muted-foreground">{l.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <div className="mt-3">
              <button className="w-full text-center py-2 text-sm border border-border rounded text-foreground">{t('messages.sidebar.viewAll')}</button>
            </div>
          </div>
        </div>
        {!isDirect && (
          <>
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">{t('messages.sidebar.members', { count: members.length })}</div>
            <div className="pb-4">
              {members.map(uid => (
                <div key={uid} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50">
                  <Avatar src={getUserImage(uid)} name={getUserName(uid)} size={10} />
                  <div className="text-sm font-medium truncate text-foreground">{getUserName(uid)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
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

      {/* Clear Messages Confirmation Dialog */}
      <ConfirmDialog
        open={clearMessagesDialogOpen}
        onOpenChange={setClearMessagesDialogOpen}
        onConfirm={confirmClearMyMessages}
        title={t('messages.sidebar.confirmClearTitle')}
        description={t('messages.sidebar.confirmClearDescription')}
        confirmText={t('ui.common.delete')}
        cancelText={t('ui.common.cancel')}
        variant="destructive"
      />
    </div>
  );
}


