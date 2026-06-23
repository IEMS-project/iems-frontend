import React from "react";

export default function PowerBIEmbed({ embedUrl, height = 600 }) {
    if (!embedUrl) {
        return (
            <div className="rounded border border-dashed p-6 text-sm text-gray-500">
                Chưa cấu hình đường dẫn Power BI. Truyền prop embedUrl để hiển thị.
            </div>
        );
    }
    return (
        <div className="w-full overflow-hidden rounded border">
            <iframe
                title="PowerBI Report"
                src={embedUrl}
                frameBorder="0"
                allowFullScreen={true}
                style={{ width: '100%', height }}
            />
        </div>
    );
}


