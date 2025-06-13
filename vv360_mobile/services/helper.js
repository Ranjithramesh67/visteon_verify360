export const getFormattedDateTime = () => {
    const now = new Date();

    const pad = (n) => n.toString().padStart(2, '0');

    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1); // Months are 0-based
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${day}${month}${year}:${hours}${minutes}${seconds}`;
};


export const formatDate = (rawDate) => {
    if (!rawDate || rawDate.length !== 8) return rawDate;
    const day = rawDate.slice(0, 2);
    const month = rawDate.slice(2, 4);
    const year = rawDate.slice(4, 8);
    return `${day}/${month}/${year}`;
};
