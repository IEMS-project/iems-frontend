import React, { useEffect, useState, useRef } from "react";
import Avatar from "../ui/Avatar";
import {
  FaChevronLeft,
  FaChevronRight,
  FaReply,
  FaSearchPlus,
  FaSearchMinus,
  FaUndoAlt,
  FaRedoAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { chatService } from "../../services/chatService";

export default function MediaPreviewModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  messageId,
  senderId,
  senderName,
  senderImage,
  sentAt,
  onPrev,
  onNext,
  onReplyMessage,
  getUserName,
  getUserImage,
  onViewUser,
}) {
  // Always mount hooks; render conditionally below to avoid hook order issues

  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const current =
    items[currentIndex] || {
      id: messageId,
      content: mediaUrl,
      type: mediaType,
      senderId,
      sentAt,
    };

  // Keyboard events
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, currentIndex, items]);

  // Zoom/rotate state
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const mediaWrapRef = useRef(null);

  // Load 5 before/after
  useEffect(() => {
    let abort = false;
    async function loadAround() {
      try {
        if (!messageId) return;
         const data = await chatService.getMediaAroundByType(
           messageId,
           "MEDIA",
           5,
           5
         );
        if (abort) return;
        const before = (data.beforeMessages || []).map((m) => ({
          id: m.id,
          content: m.content,
          type: m.type,
          senderId: m.senderId,
          sentAt: m.sentAt,
        }));
        const target = {
          id: data.targetMessage?.id || messageId,
          content:
            data.targetMessage?.content || mediaUrl,
          type: data.targetMessage?.type || mediaType,
          senderId: data.targetMessage?.senderId || senderId,
          sentAt: data.targetMessage?.sentAt || sentAt,
        };
        const after = (data.afterMessages || []).map((m) => ({
          id: m.id,
          content: m.content,
          type: m.type,
          senderId: m.senderId,
          sentAt: m.sentAt,
        }));
        setItems([...before, target, ...after]);
        setCurrentIndex(before.length);
      } catch (_) {
        setItems([
          { id: messageId, content: mediaUrl, type: mediaType, senderId, sentAt },
        ]);
        setCurrentIndex(0);
      }
    }
    if (isOpen) loadAround();
    return () => {
      abort = true;
    };
  }, [isOpen, messageId, mediaType, mediaUrl, senderId, sentAt]);

  // Lazy extend
  const extendBefore = async (centerId) => {
    try {
       const data = await chatService.getMediaAroundByType(
         centerId,
         "MEDIA",
         5,
         0
       );
      const more = (data.beforeMessages || []).map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        senderId: m.senderId,
        sentAt: m.sentAt,
      }));
      if (more.length > 0) {
        setItems((prev) => [...more, ...prev]);
        setCurrentIndex((prev) => prev + more.length);
      }
      return more.length;
    } catch {
      return 0;
    }
  };

  const extendAfter = async (centerId) => {
    try {
       const data = await chatService.getMediaAroundByType(
         centerId,
         "MEDIA",
         0,
         5
       );
      const more = (data.afterMessages || []).map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        senderId: m.senderId,
        sentAt: m.sentAt,
      }));
      if (more.length > 0) setItems((prev) => [...prev, ...more]);
      return more.length;
    } catch {
      return 0;
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      return;
    }
    if (items.length > 0) {
      (async () => {
        const added = await extendBefore(items[0].id);
        if (added > 0) setCurrentIndex((i) => Math.max(0, i - 1));
      })();
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      if (currentIndex + 2 >= items.length)
        extendAfter(items[items.length - 1].id);
      return;
    }
    if (items.length > 0) {
      (async () => {
        const added = await extendAfter(items[items.length - 1].id);
        if (added > 0)
          setCurrentIndex((i) => Math.min(items.length - 1 + added, i + 1));
      })();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, [isOpen, mediaUrl, mediaType]);

  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
  const zoom = (delta) =>
    setScale((s) => clamp(Number((s + delta).toFixed(2)), 0.25, 5));
  const zoomIn = () => zoom(0.25);
  const zoomOut = () => zoom(-0.25);
  const rotateLeft = () => setRotation((r) => (r - 90) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);
  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const onWheelZoom = (e) => {
    if (mediaType !== "IMAGE") return;
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const onMouseDown = (e) => {
    if (mediaType !== "IMAGE" || scale <= 1) return;
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };
  const stopDrag = () => {
    draggingRef.current = false;
  };
  const onDoubleClick = () => {
    if (mediaType !== "IMAGE") return;
    setScale((s) => (s > 1 ? 1 : 2));
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      {/* Outside close button */}
      <button
        className="absolute top-4 right-4 z-50 bg-gray-700/70 text-white w-10 h-10 rounded-full hover:bg-gray-600/80 flex items-center justify-center"
        onClick={onClose}
        aria-label="Đóng"
      >
        ×
      </button>
      <div
        className="relative w-[960px] h-[600px] max-w-[95vw] max-h-[90vh] bg-black rounded-2xl p-4 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
         {/* Body: media area + right rail */}
         <div className="flex gap-3 flex-1 w-full overflow-hidden">
          {/* Media display area */}
          <div
            ref={mediaWrapRef}
            className="relative flex items-center justify-center overflow-hidden select-none bg-black w-full h-[calc(100vh-160px)] max-h-[600px] rounded-xl"
            onWheel={onWheelZoom}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onDoubleClick={onDoubleClick}
          >
            {/* Prev */}
            {items.length > 0 && (
              <button
                className="absolute z-20 left-4 top-1/2 -translate-y-1/2 bg-gray-700/50 backdrop-blur-sm text-white w-12 h-12 rounded-full hover:bg-gray-600/70 flex items-center justify-center shadow-md"
                onClick={handlePrev}
                aria-label="Trước"
              >
                <FaChevronLeft size={18} />
              </button>
            )}
            {/* Next */}
            {items.length > 0 && (
              <button
                className="absolute z-20 right-4 top-1/2 -translate-y-1/2 bg-gray-700/50 backdrop-blur-sm text-white w-12 h-12 rounded-full hover:bg-gray-600/70 flex items-center justify-center shadow-md"
                onClick={handleNext}
                aria-label="Sau"
              >
                <FaChevronRight size={18} />
              </button>
            )}

            {/* Media */}
            {(current.type || mediaType) === "IMAGE" ? (
              <img
                src={current.content || mediaUrl}
                alt="preview"
                className="max-w-full max-h-full rounded-lg"
                style={{
                  objectFit: "contain",
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transition: draggingRef.current
                    ? "none"
                    : "transform 120ms ease",
                }}
              />
            ) : (
              <video
                src={current.content || mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg bg-black object-contain"
              />
            )}
          </div>

           {/* Right thumbnails */}
           <div className="w-28 h-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-2">
              {items.map((m, idx) => (
                <button
                  key={m.id || idx}
                  className={`relative overflow-hidden rounded-lg border ${idx === currentIndex
                      ? "border-blue-400"
                      : "border-white/20"
                    } bg-black`}
                  onClick={() => setCurrentIndex(idx)}
                  title={new Date(m.sentAt || Date.now()).toLocaleString(
                    "vi-VN"
                  )}
                >
                  {(m.type || "").toUpperCase() === "IMAGE" ? (
                    <img
                      src={m.content}
                      alt="thumb"
                      loading="lazy"
                      className="w-28 h-20 object-cover"
                    />
                  ) : (
                    <video
                      src={m.content}
                      className="w-28 h-20 object-cover"
                      preload="metadata"
                      muted
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {(senderName || sentAt || onReplyMessage) && (
          <div className="mt-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {(senderName || current.senderId) && (
                <>
                  <div className="w-8 h-8 shrink-0">
                    <Avatar
                      src={
                        getUserImage?.(current.senderId) || senderImage
                      }
                      name={
                        getUserName?.(current.senderId) || senderName
                      }
                      size={8}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-medium truncate">
                      {getUserName?.(current.senderId) || senderName}
                    </span>
                    {(current.sentAt || sentAt) && (
                      <span className="text-gray-300 text-xs">
                        {new Date(current.sentAt || sentAt).toLocaleString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          }
                        )}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2">
              {(current.type || mediaType) === "IMAGE" && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    className="w-9 h-9 rounded-md text-white hover:text-blue-400"
                    title="Thu nhỏ"
                    onClick={zoomOut}
                  >
                    <FaSearchMinus />
                  </button>
                  <button
                    className="w-9 h-9 rounded-md text-white hover:text-blue-400"
                    title="Phóng to"
                    onClick={zoomIn}
                  >
                    <FaSearchPlus />
                  </button>
                  <button
                    className="w-9 h-9 rounded-md text-white hover:text-blue-400"
                    title="Xoay trái"
                    onClick={rotateLeft}
                  >
                    <FaUndoAlt />
                  </button>
                  <button
                    className="w-9 h-9 rounded-md text-white hover:text-blue-400"
                    title="Xoay phải"
                    onClick={rotateRight}
                  >
                    <FaRedoAlt />
                  </button>
                  <button
                    className="w-9 h-9 rounded-md text-white hover:text-blue-400"
                    title="Đặt lại"
                    onClick={resetTransform}
                  >
                    <FaSyncAlt />
                  </button>
                </div>
              )}
              {onReplyMessage && (
                <button
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md text-white hover:text-blue-400"
                  onClick={() =>
                    onReplyMessage({
                      id: current.id,
                      senderId: current.senderId,
                      content: current.content,
                      type: current.type,
                      sentAt: current.sentAt,
                    })
                  }
                  title="Trả lời"
                >
                  <FaReply />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
