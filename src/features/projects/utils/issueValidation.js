export const ISSUE_TITLE_MAX_LENGTH = 255;
export const ISSUE_DESCRIPTION_MAX_LENGTH = 10000;

export function normalizeRichText(value) {
  const text = value || "";
  return text.trim() === "" ? "" : text;
}

export function validateIssueForm(form, { requireIssueType = false } = {}) {
  const errors = {};
  const title = (form.title || "").trim();
  const description = normalizeRichText(form.description);

  if (!title) {
    errors.title = "Please enter issue title";
  } else if (title.length > ISSUE_TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${ISSUE_TITLE_MAX_LENGTH} characters or less`;
  }

  if (description.length > ISSUE_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${ISSUE_DESCRIPTION_MAX_LENGTH} characters or less`;
  }

  if (requireIssueType && !form.issueTypeId) {
    errors.issueTypeId = "Please select issue type";
  }

  return errors;
}

export function firstIssueValidationMessage(errors) {
  return Object.values(errors)[0] || "";
}
