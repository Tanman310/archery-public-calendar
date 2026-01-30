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

function formatTime12(timeObj) {
    if (!timeObj) { return ""; }
    let hh = timeObj.hh;
    const min = String(timeObj.min).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    if (hh === 0) { hh = 12; }
    return `${hh}:${min} ${ampm}`;
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

    const title = String(row["Title"] ?? "").trim() || "Event";
    const location = String(row["Location"] ?? "").trim();
    const categoryRaw = String(row["Category"] ?? "").trim() || "Other";
    const categoryKey = categoryRaw.toLowerCase().replace(/\s+/g, "-");
    const canceled = truthy(row["Canceled"]);

    // Time inputs (24h HH:MM). Note: For Task, Start is interpreted as "due by" time.
    const startTime = parseHHMM24(row["Start Time"] ?? row["Start"]);
    const endTime = parseHHMM24(row["End Time"] ?? row["End"]);

    const isTask = categoryRaw.toLowerCase() === "task";
    const isTba = !isTask && !startTime && !endTime;
    const isTimed = !isTask && !!startTime && !!endTime;
    const isStartOnly = !isTask && !!startTime && !endTime;

    // Placement + normalization
    let allDay = true;
    let start = makeLocalDate(eventDate, null);
    let end = undefined;

    // Display label (single source of truth for UI)
    let timeLabel = "";

    if (isTba) {
        allDay = true;
        timeLabel = "TBA";
    } else if (isTask) {
        allDay = true;
        // Tasks with a start time use it as a due-by time label; otherwise no time label.
        if (startTime) {
            timeLabel = `Due by ${formatTime12(startTime)}`;
        }
    } else if (isTimed) {
        allDay = false;
        start = makeLocalDate(eventDate, startTime);
        end = makeLocalDate(eventDate, endTime);
        if (end <= start) { end = undefined; } // guard against bad data
        timeLabel = `${formatTime12(startTime)}–${formatTime12(endTime)}`;
    } else if (isStartOnly) {
        allDay = false;
        start = makeLocalDate(eventDate, startTime);
        // Future-proof: treat as running until 11:59 PM same day.
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 0, 0);
        timeLabel = formatTime12(startTime);
    } else {
        // Non-task with some unexpected combination (e.g., end only). Treat as all-day with no time label.
        allDay = true;
    }

    const ev = {
        title,
        start,
        end,
        allDay,
        extendedProps: {
            location,
            category: categoryRaw,
            canceled,
            isTimed,
            isTba,
            isTask,
            isStartOnly,
            timeLabel
        },
        classNames: [
            `cat-${categoryKey}`,
            ...(isTba ? ["is-tba"] : []),
            ...(isTask ? ["is-task"] : []),
            ...(isTimed ? ["is-timed"] : []),
            ...(isStartOnly ? ["is-start-only"] : [])
        ]
    };

    if (canceled) { ev.classNames.push("is-canceled"); }
    if (isPastEvent(ev)) { ev.classNames.push("is-past"); }

    return ev;
}