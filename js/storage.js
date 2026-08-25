const Storage = {
    KEY: 'netforge_commands',

    load() {
        try {
            const stored = localStorage.getItem(this.KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return [];
        }
    },

    save(commands) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(commands));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },

    clear() {
        localStorage.removeItem(this.KEY);
    },

    exportToFile(commands) {
        const dataStr = JSON.stringify(commands, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `netforge_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!Array.isArray(data)) {
                        throw new Error('Invalid format: expected array');
                    }
                    const validData = data.filter(item => item.title && item.template);
                    resolve(validData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
};