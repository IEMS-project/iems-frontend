import { request } from "@/lib/api";

const BASE = "/document-service/api/projects";

export const documentService = {
  // Get all documents for a project
  async getProjectDocuments(projectId) {
    const data = await request(`${BASE}/${projectId}/documents`);
    return data?.data || data || [];
  },

  async getEmbeddableDocuments(projectId) {
    const data = await request(`${BASE}/${projectId}/documents/embeddable`);
    return data?.data || data || [];
  },

  // Upload a document to a project
  async uploadProjectDocument(projectId, file, folderId = null, options = {}) {
    const formData = new FormData();
    formData.append("file", file);

    let url = `${BASE}/${projectId}/documents/upload`;
    if (folderId) {
      url += `?folderId=${folderId}`;
    }

    const data = await request(url, {
      method: "POST",
      body: formData,
      isFormData: true,
      onUploadProgress: options.onUploadProgress,
      signal: options.signal,
    });
    return data?.data || data;
  },

  // Create folder
  async createFolder(projectId, name, parentId = null) {
    const data = await request(`${BASE}/${projectId}/documents/folders`, {
      method: "POST",
      body: { name, parentId },
    });
    return data?.data || data;
  },

  // Rename document/folder
  async renameDocument(projectId, docId, name) {
    const data = await request(`${BASE}/${projectId}/documents/${docId}/rename`, {
      method: "PUT",
      body: { name },
    });
    return data?.data || data;
  },

  // Move document/folder
  async moveDocument(projectId, docId, parentId = null) {
    let url = `${BASE}/${projectId}/documents/${docId}/move`;
    if (parentId) {
      url += `?parentId=${parentId}`;
    }
    const data = await request(url, {
      method: "PUT",
    });
    return data?.data || data;
  },

  // Delete a document
  async deleteProjectDocument(projectId, docId) {
    const data = await request(`${BASE}/${projectId}/documents/${docId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // Get download link
  async getDocumentDownloadLink(projectId, docId) {
    const data = await request(`${BASE}/${projectId}/documents/${docId}/link`);
    return data?.data || data;
  },

  async setAllowEmbedded(projectId, docId, allowEmbedded) {
    const data = await request(
      `${BASE}/${projectId}/documents/${docId}/allow-embedded?allowEmbedded=${allowEmbedded}`,
      {
        method: "PUT",
      }
    );
    return data?.data || data;
  },

  async getItemActivities(projectId, docId, type = "FILE") {
    const data = await request(`${BASE}/${projectId}/documents/${docId}/activities?type=${type}`);
    return data?.data || data || [];
  }
};
