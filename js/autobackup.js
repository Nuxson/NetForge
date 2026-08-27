const AutoBackup = {
    KEY_LAST_BACKUP: 'netforge_last_backup_date',
    KEY_ENABLED: 'netforge_autobackup_enabled',

        async init() {
            await this.checkAndBackup();
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

    async checkAndBackup() {  // ← ДОБАВИЛИ async
        if (!this.shouldBackup()) return false;

        const commands = Storage.load();
        if (commands.length === 0) {
            this.setLastBackupDate(this.getTodayDate());
            return false;
        }

        await this.performBackup(commands);  // ← ДОБАВИЛИ await
        return true;
    },

    async performBackup(commands) {
        const today = this.getTodayDate();
        const dataStr = JSON.stringify(commands, null, 2);
        
        // Пробуем сохранить в выбранную папку через Logger
        if (typeof Logger !== 'undefined' && Logger.dirHandle) {
            const savedToFolder = await Logger.writeBackup(commands);
            if (savedToFolder) {
                this.setLastBackupDate(today);
                console.log(`[AutoBackup] Бэкап сохранён в папку: netforge-backup-${today}.json`);
                UI.showToast(`Бэкап сохранён в "${Logger.dirHandle.name}"`, 'success');
                return true;
            }
        }

        // Fallback: обычное скачивание в папку "Загрузки"
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `netforge-autobackup-${today}.json`;
        
        a.style.display = 'none';
        document.body.appendChild(a);
        
        try {
            a.click();
            this.setLastBackupDate(today);
            console.log(`[AutoBackup] Бэкап скачан: netforge-autobackup-${today}.json`);
            UI.showToast('Бэкап скачан в папку Загрузки', 'success');
            return true;
        } catch (err) {
            console.error('[AutoBackup] Ошибка создания бэкапа:', err);
            UI.showToast('Ошибка создания бэкапа', 'danger');
            return false;
        } finally {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    },

    // Ручной запуск бэкапа
    async manualBackup() {
        const commands = Storage.load();
        if (commands.length === 0) {
            UI.showToast('Нет данных для бэкапа', 'danger');
            return false;
        }

        const success = await this.performBackup(commands);
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