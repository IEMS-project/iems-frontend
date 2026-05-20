import React from "react";

const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/g;

function unique(values) {
    return [...new Set(values.filter(Boolean).map(String))];
}

function getHighlightTerms(notification) {
    const title = notification?.title || "";
    const body = notification?.body || "";
    const issueKeys = unique(`${title} ${body}`.match(ISSUE_KEY_PATTERN) || []);

    return unique([
        notification?.actorName && notification.actorName !== "null" ? notification.actorName : null,
        notification?.projectName,
        ...issueKeys,
    ]).sort((a, b) => b.length - a.length);
}

function splitByTerms(text, terms) {
    if (!text || terms.length === 0) return [{ text, highlighted: false }];

    const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");

    return text.split(regex).filter(Boolean).map((part) => ({
        text: part,
        highlighted: terms.some((term) => term.toLowerCase() === part.toLowerCase()),
    }));
}

export function HighlightedNotificationText({ text, notification, className = "" }) {
    const terms = getHighlightTerms(notification);
    const parts = splitByTerms(text || "", terms);

    return (
        <span className={className}>
            {parts.map((part, index) => (
                part.highlighted ? (
                    <strong key={`${part.text}-${index}`} className="font-semibold text-foreground">
                        {part.text}
                    </strong>
                ) : (
                    <React.Fragment key={`${part.text}-${index}`}>{part.text}</React.Fragment>
                )
            ))}
        </span>
    );
}
