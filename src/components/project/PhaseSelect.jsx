import React from "react";
import { useTranslation } from "react-i18next";

export default function PhaseSelect({ phases = [], value, onChange, placeholder }) {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('projects.detail.tasks.form.selectPhase');

    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
        >
            <option value="">{defaultPlaceholder}</option>
            {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                    {phase.name}
                </option>
            ))}
        </select>
    );
}
