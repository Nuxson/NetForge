const AutoBackup = {
    KEY_LAST_BACKUP: 'netforge_last_backup_date',
    KEY_ENABLED: 'netforge_autobackup_enabled',

    init() {
        this.checkAndBackup();
    },

    isEnabled() {
        const enabled = localStorage.getItem(this.KEY_ENABLED);
        return enabled !== 'false'; // По умолчанию включено
    },

    setEnabled(enabled) {
        localStorage.setItem(this.KEY_ENABLED, enabled ? 'true' : 'false');
    },

    getLastBackupDate() {
        return localStorage.getItem(this.KEY_LAST_BACKUP);
    },

    setLastBackupDate(date) {
        localStorage.setItem(this.KEY_LAST_BACKUP, date);
    },

    getTodayDate() {
        return new Date().toISOString().slice(0, 10);
    },

    shouldBackup() {
        if (!this.isEnabled()) return false;
        
        const lastBackup = this.getLastBackupDate();
        const today = this.getTodayDate();
        
        return lastBackup !== today;
    },

    checkAndBackup() {
        if (!this.shouldBackup()) return false;

        const commands = Storage.load();
        if (commands.length === 0) {
            this.setLastBackupDate(this.getTodayDate());
            return false;
        }

        this.performBackup(commands);
        return true;
    },

    performBackup(commands) {
        const today = this.getTodayDate();
        const dataStr = JSON.stringify(commands, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `netforge_autobackup_${today}.json`;
        
        // Скрытное скачивание
        a.style.display = 'none';
        document.body.appendChild(a);
        
        try {
            a.click();
            this.setLastBackupDate(today);
            console.log(`[AutoBackup] Бэкап создан: netforge_autobackup_${today}.json`);
            return true;
        } catch (err) {
            console.error('[AutoBackup] Ошибка создания бэкапа:', err);
            return false;
        } finally {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    },

    // Ручной запуск бэкапа
    manualBackup() {
        const commands = Storage.load();
        if (commands.length === 0) {
            UI.showToast('Нет данных для бэкапа', 'danger');
            return false;
        }

        const success = this.performBackup(commands);
        if (success) {
            UI.showToast('Бэкап создан и скачан', 'success');
        }
        return success;
    },

    // Сброс даты последнего бэкапа (для тестирования)
    reset() {
        localStorage.removeItem(this.KEY_LAST_BACKUP);
        console.log('[AutoBackup] Дата последнего бэкапа сброшена');
    },

    // Получение статуса для отображения
    getStatus() {
        return {
            enabled: this.isEnabled(),
            lastBackup: this.getLastBackupDate(),
            today: this.getTodayDate(),
            needsBackup: this.shouldBackup()
        };
    }
};