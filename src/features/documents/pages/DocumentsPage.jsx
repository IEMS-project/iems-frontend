"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/features/documents/hooks/useDocuments";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Skeleton from "@/components/ui/skeleton";
import ShareModal from "@/features/documents/components/ShareModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CreateFolderModal from "@/features/documents/components/CreateFolderModal";
import RenameModal from "@/features/documents/components/RenameModal";
import MoveModal from "@/features/documents/components/MoveModal";
import DocumentsToolbar from "@/features/documents/components/DocumentsToolbar";
import DocumentsHeader from "@/features/documents/components/DocumentsHeader";
import DocumentsList from "@/features/documents/components/DocumentsList";
import DocumentsGrid from "@/features/documents/components/DocumentsGrid";
import FileDetailPanel from "@/features/documents/components/FileDetailPanel";
import EmptyState from "@/features/documents/components/EmptyState";
import UploadProgressPanel from "@/features/documents/components/UploadProgressPanel";

export default function Documents() {
  const isMobile = useIsMobile();
  const [batchMoveModalOpen, setBatchMoveModalOpen] = React.useState(false);
  const dragDepthRef = React.useRef(0);
  const {
    // State
    search,
    setSearch,
    isDragging,
    setIsDragging,
    filterMode,
    setFilterMode,
    shareItem,
    setShareItem,
    deleteItem,
    setDeleteItem,
    selectedItem,
    setSelectedItem,
    showMobileDetails,
    setShowMobileDetails,
    sortBy,
    sortDirection,
    typeFilter,
    setTypeFilter,
    ownerFilter,
    setOwnerFilter,
    modifiedFilter,
    setModifiedFilter,
    ownerOptions,
    selectedItems,
    isCreateOpen,
    setIsCreateOpen,
    newFolderName,
    setNewFolderName,
    selectedRecipients,
    setSelectedRecipients,
    loading,
    renameItem,
    setRenameItem,
    moveItem,
    setMoveItem,
    viewMode,
    setViewMode,
    uploadTasks,
    sortedItems,
    currentPath,

    // Handlers
    handleSortChange,
    getSortLabel,
    handleItemClick,
    handleItemDoubleClick,
    openItemDetails,
    toggleSelectAll,
    toggleItemSelection,
    onCreateFolderConfirmed,
    onUploadFiles,
    cancelUpload,
    cancelAllUploads,
    retryUpload,
    retryFailedUploads,
    clearFinishedUploads,
    onDrop,
    toggleFavorite,
    openShare,
    confirmDelete,
    onConfirmDelete,
    handleShare,
    handleRename,
    handleMove,
    handleRenameConfirm,
    handleGeneralAccessUpdate,
    handleMoveCompleted,
    isOwner,
    handleBatchDelete,
    handleBatchMove,
    // Trash handlers
    handleRestore,
    handlePermanentDelete,
    handleEmptyTrash,
  } = useDocuments();

  const hasDraggingFiles = (event) =>
    Array.from(event.dataTransfer?.types || []).includes("Files");

  const handleDragEnter = (event) => {
    if (!hasDraggingFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    if (!hasDraggingFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    if (!hasDraggingFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    dragDepthRef.current = 0;
    onDrop(event);
  };

  return (
    <div
      className="flex rounded-2xl bg-[#f8fafd] p-4"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="border-border min-w-0 flex-1 space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
        {/* Toolbar */}
        <DocumentsToolbar
          onUpload={onUploadFiles}
          onCreateFolder={() => setIsCreateOpen(true)}
          selectedCount={selectedItems.size}
          onBatchDelete={() => {
            if (window.confirm(`Bạn có chắc muốn xóa ${selectedItems.size} mục đã chọn?`)) {
              handleBatchDelete();
            }
          }}
          onBatchMove={() => setBatchMoveModalOpen(true)}
        />

        {/* Header */}
        <DocumentsHeader
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          getSortLabel={getSortLabel}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          modifiedFilter={modifiedFilter}
          setModifiedFilter={setModifiedFilter}
          ownerOptions={ownerOptions}
          onEmptyTrash={handleEmptyTrash}
          hasTrashItems={sortedItems.length > 0}
        />

        {/* File List Container */}
        <div
          className="flex border-t"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
        >
          <div
            className={cn(
              "min-w-0 grow",
              isDragging && "ring-2 ring-blue-400 ring-offset-2"
            )}
          >
            {loading ? (
              viewMode === "list" ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b p-4"
                    >
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="rounded border border-dashed p-3">
                      <Skeleton className="mb-3 h-12 w-16" />
                      <Skeleton className="mb-2 h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              )
            ) : sortedItems.length === 0 ? (
              <EmptyState search={search} onUpload={onUploadFiles} filterMode={filterMode} />
            ) : viewMode === "grid" ? (
              <DocumentsGrid
                sortedItems={sortedItems}
                selectedItems={selectedItems}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onShowDetails={openItemDetails}
                onToggleItemSelection={toggleItemSelection}
                onToggleFavorite={toggleFavorite}
                onRename={handleRename}
                onShare={openShare}
                onMove={handleMove}
                onDelete={confirmDelete}
                isOwner={isOwner}
                filterMode={filterMode}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ) : (
              <DocumentsList
                sortedItems={sortedItems}
                selectedItems={selectedItems}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onShowDetails={openItemDetails}
                onToggleSelectAll={toggleSelectAll}
                onToggleItemSelection={toggleItemSelection}
                onToggleFavorite={toggleFavorite}
                onRename={handleRename}
                onShare={openShare}
                onMove={handleMove}
                onDelete={confirmDelete}
                isOwner={isOwner}
                filterMode={filterMode}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            )}
          </div>

          {/* Desktop Right Panel - Details */}
          {selectedItem && !isMobile && (
            <FileDetailPanel
              selectedItem={selectedItem}
              currentPath={currentPath}
              onClose={() => setSelectedItem(null)}
              onManageAccess={(item) => openShare(item, item.type)}
            />
          )}
        </div>
      </div>

      {/* Mobile Sheet - Details */}
      {selectedItem && isMobile && (
        <Sheet open={showMobileDetails} onOpenChange={setShowMobileDetails}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Chi tiết tệp</SheetTitle>
            </SheetHeader>
            <FileDetailPanel
              selectedItem={selectedItem}
              currentPath={currentPath}
              onClose={() => {
                setShowMobileDetails(false);
                setSelectedItem(null);
              }}
              onManageAccess={(item) => openShare(item, item.type)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Modals */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        shareItem={shareItem}
        selectedRecipients={selectedRecipients}
        setSelectedRecipients={setSelectedRecipients}
        onShare={handleShare}
        onUpdateGeneralAccess={handleGeneralAccessUpdate}
      />

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa"
        description={
          deleteItem
            ? `Bạn có chắc muốn xóa ${deleteItem.type === "folder" ? "thư mục" : "tệp"} "${deleteItem.data.name}"${deleteItem.type === "folder" ? " và tất cả nội dung bên trong" : ""}?`
            : ""
        }
        confirmText="Xóa"
        cancelText="Hủy"
        variant="destructive"
      />

      <CreateFolderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onConfirm={onCreateFolderConfirmed}
      />

      <RenameModal
        isOpen={!!renameItem}
        onClose={() => setRenameItem(null)}
        item={renameItem}
        onConfirm={handleRenameConfirm}
      />

      <MoveModal
        isOpen={!!moveItem}
        onClose={() => setMoveItem(null)}
        moveItem={moveItem}
        onMoveCompleted={handleMoveCompleted}
      />

      <MoveModal
        isOpen={batchMoveModalOpen}
        onClose={() => setBatchMoveModalOpen(false)}
        moveItem={null}
        isBatchMode={true}
        onMoveCompleted={(destinationFolderId) => {
          handleBatchMove(destinationFolderId);
          setBatchMoveModalOpen(false);
        }}
      />

      <UploadProgressPanel
        tasks={uploadTasks}
        onCancel={cancelUpload}
        onCancelAll={cancelAllUploads}
        onRetry={retryUpload}
        onRetryFailed={retryFailedUploads}
        onClearFinished={clearFinishedUploads}
      />
    </div>
  );
}
