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
                    // Валидация импортируемых данных
                    const validData = data.filter(item => {
                        const hasRequired = item.title && item.template;
                        const hasValidId = item.id && typeof item.id === 'string';
                        const hasValidVendor = !item.vendor || typeof item.vendor === 'string';
                        const hasValidTags = !item.tags || Array.isArray(item.tags);
                        return hasRequired && hasValidId && hasValidVendor && hasValidTags;
                    });
                    
                    if (validData.length !== data.length) {
                        console.warn(`Импортировано ${validData.length} из ${data.length} команд (невалидные отфильтрованы)`);
                    }
                    
                    resolve(validData);
                } catch (err) {
                    reject(new Error('Ошибка формата файла: ' + err.message));
                }
            };
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.readAsText(file);
        });
    }
};