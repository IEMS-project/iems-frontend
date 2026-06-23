function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export function buildDonutSlices(items) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);
    let offset = 0;

    return items.map((item) => {
        const ratio = Math.max(0, item.value) / total;
        const length = ratio * circumference;
        const slice = {
            ...item,
            percent: clampPercent(ratio * 100),
            radius,
            circumference,
            dashArray: `${length} ${circumference - length}`,
            dashOffset: -offset,
        };
        offset += length;
        return slice;
    });
}
