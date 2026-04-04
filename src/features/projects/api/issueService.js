import { fetchWithAuthRefresh, GATEWAY_BASE_URL, request } from "@/lib/api";

const BASE = "/project-service/projects";

export const issueService = {
  // ── Issues CRUD ──────────────────────────────────────────────
  async getIssues(projectId) {
    const data = await request(`${BASE}/${projectId}/issues`);
    return data?.data || data || [];
  },

  async getIssuesPaged(projectId, page = 0, size = 20) {
    const data = await request(`${BASE}/${projectId}/issues/paged?page=${page}&size=${size}`);
    return data?.data || { content: [], page: 0, size, totalElements: 0, totalPages: 0, last: true };
  },

  async createIssue(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/issues`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async getIssueById(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}`);
    return data?.data || data || null;
  },

  async updateIssue(projectId, issueId, payload) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}`, {
      method: "PATCH",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteIssue(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // ── Special Endpoints ────────────────────────────────────────
  async getBacklog(projectId) {
    const data = await request(`${BASE}/${projectId}/issues/backlog`);
    return data?.data || data || [];
  },

  async getMyIssues(projectId) {
    const data = await request(`${BASE}/${projectId}/issues/my-issues`);
    return data?.data || data || [];
  },

  async getChildren(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}/children`);
    return data?.data || data || [];
  },

  async assignIssue(projectId, issueId, assigneeId) {
    const url = assigneeId
      ? `${BASE}/${projectId}/issues/${issueId}/assign?assigneeId=${encodeURIComponent(assigneeId)}`
      : `${BASE}/${projectId}/issues/${issueId}/assign?assigneeId=`;
    const data = await request(url, { method: "PATCH" });
    return data?.data || data;
  },

  async changeStatus(projectId, issueId, statusId) {
    const data = await request(
      `${BASE}/${projectId}/issues/${issueId}/status?statusId=${encodeURIComponent(statusId)}`,
      { method: "PATCH" }
    );
    return data?.data || data;
  },

  async moveToSprint(projectId, issueId, sprintId) {
    const data = await request(
      `${BASE}/${projectId}/issues/${issueId}/sprint?sprintId=${encodeURIComponent(sprintId)}`,
      { method: "PATCH" }
    );
    return data?.data || data;
  },

  async removeFromSprint(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}/sprint`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async importIssuesFromExcel(projectId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const data = await request(`${BASE}/${projectId}/issues/import`, {
      method: "POST",
      body: formData,
    });
    return data?.data || data;
  },

  async downloadIssueImportTemplate(projectId) {
    const response = await fetchWithAuthRefresh(
      `${GATEWAY_BASE_URL}${BASE}/${projectId}/issues/import-template`,
      { method: "GET" }
    );

    if (!response.ok) {
      let message = "Failed to download import template";
      try {
        const data = await response.json();
        message = data?.message || data?.error || message;
      } catch {
        // Keep default error message.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const fileName = match?.[1] || "issue-import-template.xlsx";
    return { blob, fileName };
  },

  async downloadIssuesExport(projectId) {
    const response = await fetchWithAuthRefresh(
      `${GATEWAY_BASE_URL}${BASE}/${projectId}/issues/export`,
      { method: "GET" }
    );

    if (!response.ok) {
      let message = "Failed to export issues";
      try {
        const data = await response.json();
        message = data?.message || data?.error || message;
      } catch {
        // Keep default error message.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const fileName = match?.[1] || "issues-export.xlsx";
    return { blob, fileName };
  },

  // ── Comments ─────────────────────────────────────────────────
  async getComments(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}/comments`);
    return data?.data || data || [];
  },

  async addComment(projectId, issueId, payload) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}/comments`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateComment(projectId, issueId, commentId, payload) {
    const data = await request(
      `${BASE}/${projectId}/issues/${issueId}/comments/${commentId}`,
      { method: "PATCH", body: payload }
    );
    return data?.data || data;
  },

  async deleteComment(projectId, issueId, commentId) {
    const data = await request(
      `${BASE}/${projectId}/issues/${issueId}/comments/${commentId}`,
      { method: "DELETE" }
    );
    return data?.data || data;
  },

  // ── Attachments ──────────────────────────────────────────────
  async getAttachments(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}/attachments`);
    return data?.data || data || [];
  },

  async addAttachment(projectId, issueId, payload) {
    const data = await request(`${BASE}/${projectId}/issues/${issueId}/attachments`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteAttachment(projectId, issueId, attachmentId) {
    const data = await request(
      `${BASE}/${projectId}/issues/${issueId}/attachments/${attachmentId}`,
      { method: "DELETE" }
    );
    return data?.data || data;
  },
  // ── Activity Log ─────────────────────────────────────────────
  async getActivityLogs(projectId, issueId, page = 0, size = 10) {
    const data = await request(`${BASE}/${projectId}/activities/issues/${issueId}?page=${page}&size=${size}`);
    return data?.data || { content: [], page: 0, totalPages: 1, totalElements: 0 };
  },
};
