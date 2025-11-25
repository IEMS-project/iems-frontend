"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Skeleton from "../components/ui/Skeleton";
import ShareModal from "../components/documents/ShareModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import CreateFolderModal from "../components/documents/CreateFolderModal";
import RenameModal from "../components/documents/RenameModal";
import PermissionModal from "../components/documents/PermissionModal";
import SharedUsersModal from "../components/documents/SharedUsersModal";
import MoveModal from "../components/documents/MoveModal";
import DocumentsToolbar from "../components/documents/DocumentsToolbar";
import DocumentsHeader from "../components/documents/DocumentsHeader";
import DocumentsList from "../components/documents/DocumentsList";
import DocumentsGrid from "../components/documents/DocumentsGrid";
import FileDetailPanel from "../components/documents/FileDetailPanel";
import EmptyState from "../components/documents/EmptyState";

export default function Documents() {
  const isMobile = useIsMobile();
  const {
    // State
    search,
    setSearch,
    isDragging,
    setIsDragging,
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
    permissionItem,
    setPermissionItem,
    sharedItem,
    setSharedItem,
    moveItem,
    setMoveItem,
    viewMode,
    setViewMode,
    sortedItems,
    currentPath,

    // Handlers
    handleSortChange,
    getSortLabel,
    handleItemClick,
    handleItemDoubleClick,
    toggleSelectAll,
    toggleItemSelection,
    onCreateFolderConfirmed,
    onUploadFiles,
    onDrop,
    toggleFavorite,
    openShare,
    confirmDelete,
    onConfirmDelete,
    handleShare,
    handleRename,
    handlePermission,
    handleSharedUsers,
    handleMove,
    handleRenameConfirm,
    handlePermissionConfirm,
    handleMoveCompleted,
    isOwner,
  } = useDocuments();

  return (
    <div className="flex p-4">
      <div className="border-border min-w-0 flex-1 space-y-4">
        {/* Toolbar */}
        <DocumentsToolbar
          onUpload={onUploadFiles}
          onCreateFolder={() => setIsCreateOpen(true)}
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
        />

        {/* File List Container */}
        <div
          className="flex border-t"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
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
              <EmptyState search={search} onUpload={onUploadFiles} />
            ) : viewMode === "grid" ? (
              <DocumentsGrid
                sortedItems={sortedItems}
                selectedItems={selectedItems}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onToggleItemSelection={toggleItemSelection}
                onToggleFavorite={toggleFavorite}
                onRename={handleRename}
                onPermission={handlePermission}
                onShare={openShare}
                onSharedUsers={handleSharedUsers}
                onMove={handleMove}
                onDelete={confirmDelete}
                isOwner={isOwner}
              />
            ) : (
              <DocumentsList
                sortedItems={sortedItems}
                selectedItems={selectedItems}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onToggleSelectAll={toggleSelectAll}
                onToggleItemSelection={toggleItemSelection}
                onToggleFavorite={toggleFavorite}
                onRename={handleRename}
                onPermission={handlePermission}
                onShare={openShare}
                onSharedUsers={handleSharedUsers}
                onMove={handleMove}
                onDelete={confirmDelete}
                isOwner={isOwner}
              />
            )}
          </div>

          {/* Desktop Right Panel - Details */}
          {selectedItem && !isMobile && (
            <FileDetailPanel
              selectedItem={selectedItem}
              currentPath={currentPath}
              onClose={() => setSelectedItem(null)}
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

      <PermissionModal
        isOpen={!!permissionItem}
        onClose={() => setPermissionItem(null)}
        item={permissionItem}
        onConfirm={handlePermissionConfirm}
      />

      <SharedUsersModal
        isOpen={!!sharedItem}
        onClose={() => setSharedItem(null)}
        item={sharedItem}
      />

      <MoveModal
        isOpen={!!moveItem}
        onClose={() => setMoveItem(null)}
        moveItem={moveItem}
        onMoveCompleted={handleMoveCompleted}
      />
    </div>
  );
}
