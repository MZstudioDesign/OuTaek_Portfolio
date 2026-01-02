export const DebugLogger = {
    logs: [],

    log(event, details = {}) {
        const timestamp = performance.now();
        const logEntry = {
            event,
            timestamp,
            details,
            timeString: new Date().toISOString().split('T')[1]
        };
        this.logs.push(logEntry);
        console.log(`[DebugLogger] ${event} @ ${Math.round(timestamp)}ms`, details);
    },

    getLogs() {
        return this.logs;
    },

    clear() {
        this.logs = [];
    }
};

window.DebugLogger = DebugLogger;
