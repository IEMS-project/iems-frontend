import React from "react";
import { useTranslation } from "react-i18next";
import { FolderPlus, Star, Trash2 } from "lucide-react";
import { FileUploadDialog } from "./FileUploadDialog";

export default function EmptyState({ search, onUpload, filterMode }) {
  const { t } = useTranslation();

  if (search) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-8 text-center">
        {t('documents.emptyState.noResults', { search })}
      </div>
    );
  }

  // Show empty trash message
  if (filterMode === "trash") {
    return (
      <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <Trash2 className="mx-auto size-14 opacity-50" />
          <h2 className="text-muted-foreground">{t('documents.emptyState.noTrash')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('documents.emptyState.noTrashHint')}
          </p>
        </div>
      </div>
    );
  }

  // Show empty favorites message
  if (filterMode === "favorites") {
    return (
      <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <Star className="mx-auto size-14 opacity-50" />
          <h2 className="text-muted-foreground">{t('documents.emptyState.noFavorites')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('documents.emptyState.noFavoritesHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <FolderPlus className="mx-auto size-14 opacity-50" />
        <h2 className="text-muted-foreground">{t('documents.emptyState.title')}</h2>
        <div>
          <FileUploadDialog onUpload={onUpload} />
        </div>
      </div>
    </div>
  );
}









