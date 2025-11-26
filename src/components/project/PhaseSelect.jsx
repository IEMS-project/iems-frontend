import React from "react";

export default function PhaseSelect({ phases = [], value, onChange, placeholder = "Chọn giai đoạn" }) {
    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
            <option value="">{placeholder}</option>
            {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                    {phase.name}
                </option>
            ))}
        </select>
    );
}
