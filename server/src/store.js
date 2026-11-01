const fs = require('fs');
const path = require('path');

// Tiny JSON-file store. Everything the server persists lives in one directory
// (DATA_DIR), so a single mounted volume keeps it across deployments.
// Writes are atomic (temp file + rename), so a crash mid-write can never leave
// a half-written file for the API to choke on.
class Store {
    constructor(dir) {
        this.dir = dir;
        fs.mkdirSync(dir, { recursive: true });
        this.cache = new Map(); // name -> { mtimeMs, data }
    }

    filePath(name) {
        return path.join(this.dir, name);
    }

    read(name, fallback = null) {
        const file = this.filePath(name);
        try {
            const { mtimeMs } = fs.statSync(file);
            const hit = this.cache.get(name);
            if (hit && hit.mtimeMs === mtimeMs) return hit.data;
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            this.cache.set(name, { mtimeMs, data });
            return data;
        } catch {
            return fallback;
        }
    }

    write(name, data) {
        const file = this.filePath(name);
        const temp = `${file}.${process.pid}.tmp`;
        fs.writeFileSync(temp, JSON.stringify(data));
        fs.renameSync(temp, file);
        this.cache.delete(name);
    }
}

module.exports = { Store };
