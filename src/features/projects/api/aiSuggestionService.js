import { chatbotRequest } from "@/lib/api";

export const aiSuggestionService = {
  async estimateIssue(projectId, payload) {
    return chatbotRequest(`/api/ai/projects/${projectId}/issue-suggestions/estimate`, {
      method: "POST",
      body: payload,
    });
  },

  async suggestSprintAssignments(projectId, sprintId, issueIds = []) {
    return chatbotRequest(`/api/ai/projects/${projectId}/sprint-suggestions/assign`, {
      method: "POST",
      body: { sprintId, issueIds },
    });
  },
};
