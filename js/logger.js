const Logger = {
    dirHandle: null,

    async init() {
        // Пробуем восстановить доступ к папке из прошлой сессии
        const storedHandle = await this.getStoredHandle();
        if (storedHandle) {
            this.dirHandle = storedHandle;
            this.updateUI(true);
        }
    },

    async enableLogging() {
        if (!('showDirectoryPicker' in window)) {
            UI.showToast('Ваш браузер не поддерживает запись в папки (нужен Chrome/Edge)', 'danger');
            return false;
        }

        try {
            // Запрашиваем у пользователя выбор папки
            const handle = await window.showDirectoryPicker({
                id: 'netforge-logs',
                mode: 'readwrite'
            });

            // Запрашиваем разрешение на запись
            const permission = await handle.requestPermission({ mode: 'readwrite' });
            if (permission !== 'granted') return false;

            this.dirHandle = handle;
            await this.storeHandle(handle);
            this.updateUI(true);
            UI.showToast(`Логи будут записываться в "${handle.name}"`, 'success');
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Ошибка выбора папки:', err);
            }
            return false;
        }
    },

    async disableLogging() {
        this.dirHandle = null;
        await localStorage.removeItem('netforge-log-handle');
        this.updateUI(false);
        UI.showToast('Запись логов выключена', 'info');
    },

    // Сохраняем хэндл папки в IndexedDB (localStorage не может хранить хэндлы)
    async storeHandle(handle) {
        return new Promise((resolve) => {
            const req = indexedDB.open('NetForgeLogs', 1);
            req.onupgradeneeded = (e) => {
                e.target.result.createObjectStore('handles');
            };
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('handles', 'readwrite');
                tx.objectStore('handles').put(handle, 'logDir');
                tx.oncomplete = () => db.close();
                resolve();
            };
        });
    },

    async getStoredHandle() {
        return new Promise((resolve) => {
            const req = indexedDB.open('NetForgeLogs', 1);
            req.onupgradeneeded = (e) => {
                e.target.result.createObjectStore('handles');
            };
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('handles', 'readonly');
                const store = tx.objectStore('handles');
                const getReq = store.get('logDir');
                getReq.onsuccess = () => resolve(getReq.result || null);
                getReq.onerror = () => resolve(null);
            };
            req.onerror = () => resolve(null);
        });
    },

    // Главная функция: запись лога в файл
    async writeLog(action, details = {}) {
        if (!this.dirHandle) return;

        try {
            // Проверяем разрешение (оно может истечь)
            const permission = await this.dirHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const newPerm = await this.dirHandle.requestPermission({ mode: 'readwrite' });
                if (newPerm !== 'granted') return;
            }

            // Имя файла по текущей дате: один файл на день
            const date = new Date();
            const fileName = `netforge-log-${date.toISOString().split('T')[0]}.txt`;

            // Получаем или создаём файл
            const fileHandle = await this.dirHandle.getFileHandle(fileName, { create: true });
            const file = await fileHandle.getFile();
            const existingContent = await file.text();

            // Формируем строку лога
            const time = date.toLocaleTimeString('ru-RU');
            const logLine = `[${time}] ${action} ${JSON.stringify(details)}\n`;

            // Дописываем в конец файла
            const writable = await fileHandle.createWritable();
            await writable.write(existingContent + logLine);
            await writable.close();

            console.log(`[Logger] Записано: ${action}`);
        } catch (err) {
            console.error('[Logger] Ошибка записи лога:', err);
        }
    },

        // Запись бэкапа в выбранную папку
    async writeBackup(commands) {
        if (!this.dirHandle) return false;

        try {
            // Проверяем разрешение
            const permission = await this.dirHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const newPerm = await this.dirHandle.requestPermission({ mode: 'readwrite' });
                if (newPerm !== 'granted') return false;
            }

            // Имя файла: netforge-backup-2026-08-27.json
            const today = new Date().toISOString().split('T')[0];
            const fileName = `netforge-backup-${today}.json`;

            // Создаём или перезаписываем файл
            const fileHandle = await this.dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            
            // Форматируем JSON с отступами
            const dataStr = JSON.stringify(commands, null, 2);
            await writable.write(dataStr);
            await writable.close();

            console.log(`[Logger] Бэкап сохранён: ${fileName}`);
            return true;
        } catch (err) {
            console.error('[Logger] Ошибка записи бэкапа:', err);
            return false;
        }
    },

    updateUI(enabled) {
        const btn = document.getElementById('btn-toggle-logs');
        const status = document.getElementById('log-status-text');
        if (!btn || !status) return;

        if (enabled) {
            status.textContent = 'Активна';
            status.className = 'text-xs text-green-400';
            btn.innerHTML = '<i class="fa-solid fa-folder-open mr-1"></i> Отключить';
        } else {
            status.textContent = 'Выключена';
            status.className = 'text-xs text-slate-400';
            btn.innerHTML = '<i class="fa-solid fa-folder mr-1"></i> Включить';
        }
    }
};