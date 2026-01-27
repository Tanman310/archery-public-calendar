// src/calendar.js

export function truthy(val) {
    const s = String(val ?? "").trim().toLowerCase();
    return (
        s === "true" ||
        s === "yes" ||
        s === "1" ||
        s === "y" ||
        s === "t" ||
        s === "checked" ||
        s === "✓" ||
        s === "on" ||
        s === "true"
    );
}

export function parseMMDDYYYY(s) {
    const t = String(s || "").trim();
    if (!t) { return null; }
    const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) { return null; }
    const mm = Number(m[1]),
        dd = Number(m[2]),
        yyyy = Number(m[3]);
    if (!mm || !dd || !yyyy) { return null; }
    return { yyyy, mm, dd };
}

export function parseHHMM24(s) {
    const t = String(s || "").trim();
    if (!t) { return null; }
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) { return null; }
    const hh = Number(m[1]),
        min = Number(m[2]);
    if (Number.isNaN(hh) || Number.isNaN(min)) { return null; }
    if (hh < 0 || hh > 23 || min < 0 || min > 59) { return null; }
    return { hh, min };
}

export function makeLocalDate(dateObj, timeObj) {
    const monthIndex = dateObj.mm - 1;
    if (!timeObj) { return new Date(dateObj.yyyy, monthIndex, dateObj.dd); }
    return new Date(dateObj.yyyy, monthIndex, dateObj.dd, timeObj.hh, timeObj.min, 0, 0);
}

export function isPastEvent(ev) {
    const now = new Date();
    if (ev.allDay) {
        const end = ev.end ? new Date(ev.end) : null;
        const endOfDay = end
            ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
            : new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate(), 23, 59, 59, 999);
        return endOfDay < now;
    }
    const ref = ev.end ? new Date(ev.end) : new Date(ev.start);
    return ref < now;
}

export function toFullCalendarEvent(row) {
    const eventDate = parseMMDDYYYY(row["Event Date"] ?? row["Date"]);
    if (!eventDate) { return null; }

    const startTime = parseHHMM24(row["Start Time"] ?? row["Start"]);
    const endTime = parseHHMM24(row["End Time"] ?? row["End"]);

    const title = String(row["Title"] ?? "").trim() || "Event";
    const location = String(row["Location"] ?? "").trim();
    const category = String(row["Category"] ?? "").trim() || "Other";
    const canceled = truthy(row["Canceled"]);

    const allDay = !startTime;
    const start = makeLocalDate(eventDate, startTime);

    let end = null;
    if (endTime) {
        end = makeLocalDate(eventDate, endTime);
        if (end <= start) {end = null;}
    }

    const ev = {
        title,
        start,
        end: end || undefined,
        allDay,
        extendedProps: {
            location,
            category,
            canceled
        },
        classNames: []
    };

    if (canceled) {ev.classNames.push("is-canceled");}
    if (isPastEvent(ev)) {ev.classNames.push("is-past");}

    return ev;
}