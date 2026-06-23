import { useEffect } from "react";

const APP_NAME = "IEMS";

export function formatDocumentTitle(title) {
    return title ? `${title} | ${APP_NAME}` : APP_NAME;
}

export default function useDocumentTitle(title) {
    useEffect(() => {
        document.title = formatDocumentTitle(title);
    }, [title]);
}
