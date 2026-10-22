// Hàm thuần cho báo cáo (không truy cập DB).

export const pctOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
