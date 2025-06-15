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
    if (!rawDate) return '';

    const dateObj = new Date(rawDate);
    if (isNaN(dateObj)) return rawDate;

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
};
