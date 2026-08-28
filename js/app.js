class NetForgeApp {
    constructor() {
        this.commands = [];
        this.filterVendor = 'All';
        this.filterTag = null;
        this.searchQuery = '';
    }

    async init() {
        this.commands = Storage.load();
        UI.init();
        Modal.init((command) => this.handleSave(command));
        this.bindEvents();
        this.initAutoBackup();
        this.initPWAInstall();       // ← новое
        await Logger.init();         // ← новое
        this.bindLoggerEvents();     
        this.render();
    }

    initPWAInstall() {
    let deferredPrompt = null;
    const installBtn = document.getElementById('btn-install-pwa');

    // Браузер срабатывает это событие, когда сайт готов к установке
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.classList.remove('hidden'); // Показываем кнопку
    });

    // Клик по кнопке
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            UI.showToast('NetForge установлен! 🎉', 'success');
        }
        deferredPrompt = null;
        installBtn.classList.add('hidden');
    });

    // Скрываем кнопку, если приложение уже установлено
    window.addEventListener('appinstalled', () => {
        installBtn.classList.add('hidden');
    });
}

    initAutoBackup() {
        // Обновляем UI статуса
        this.updateBackupUI();
        
        // Проверяем и создаём бэкап если нужно
        const backupCreated = AutoBackup.checkAndBackup();
        if (backupCreated) {
            setTimeout(() => {
                UI.showToast('Автобэкап создан: ' + AutoBackup.getTodayDate(), 'success');
                this.updateBackupUI();
            }, 500);
        }

        // Привязываем кнопки управления
        document.getElementById('btn-backup-now').addEventListener('click', () => {
            const success = AutoBackup.manualBackup();
            if (success) this.updateBackupUI();
        });

        document.getElementById('btn-backup-toggle').addEventListener('click', () => {
            const newState = !AutoBackup.isEnabled();
            AutoBackup.setEnabled(newState);
            this.updateBackupUI();
            UI.showToast(newState ? 'Автобэкап включён' : 'Автобэкап выключен', 'success');
        });
    }

    updateBackupUI() {
    UI.updateBackupStatus(AutoBackup.getStatus());
    
    // Обновляем текст о месте сохранения бэкапов
    const destText = document.getElementById('backup-destination-text');
    if (destText) {
        if (typeof Logger !== 'undefined' && Logger.dirHandle) {
            destText.textContent = `В папку: ${Logger.dirHandle.name}`;
            destText.className = 'text-xs text-green-400';
        } else {
            destText.textContent = 'В загрузки';
            destText.className = 'text-xs text-blue-400';
        }
    }
}

    bindEvents() {
    // Основной поиск (десктоп) с debounce для производительности
        let searchTimeout;
        UI.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value.toLowerCase();
                
                // Синхронизируем с мобильным поиском (в сайдбаре)
                const mobileSearch = document.getElementById('global-search-mobile');
                if (mobileSearch) {
                    mobileSearch.value = e.target.value;
                }
                
                this.renderGrid();
            }, 300); // Debounce 300ms
        });

        // Мобильный поиск (внутри сайдбара, только на мобильных) с debounce
        const mobileSearch = document.getElementById('global-search-mobile');
        if (mobileSearch) {
            mobileSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value.toLowerCase();
                    
                    // Синхронизируем с десктопным поиском (в хедере)
                    UI.elements.searchInput.value = e.target.value;
                    
                    this.renderGrid();
                }, 300); // Debounce 300ms
            });
        }

        // Остальные кнопки
        document.getElementById('btn-new-cmd').addEventListener('click', () => Modal.open());
        document.getElementById('btn-clear-all').addEventListener('click', () => this.clearAll());
        document.getElementById('btn-export').addEventListener('click', () => this.export());
        document.getElementById('import-file').addEventListener('change', (e) => this.import(e.target));
    }
    bindLoggerEvents() {
        const btn = document.getElementById('btn-toggle-logs');
        if (btn) {
            btn.addEventListener('click', async () => {
                if (Logger.dirHandle) {
                    await Logger.disableLogging();
                } else {
                    await Logger.enableLogging();
                }
                this.updateBackupUI(); // ← добавьте эту строку
            });
        }
    }

    getVendors() {
        const vendors = new Set(this.commands.map(c => c.vendor).filter(v => v));
        return ['All', ...Array.from(vendors).sort()];
    }

    getTags() {
        const tags = new Set();
        this.commands.forEach(c => {
            if (c.tags) c.tags.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }

    getFilteredCommands() {
        return this.commands.filter(cmd => {
            const matchesVendor = this.filterVendor === 'All' || cmd.vendor === this.filterVendor;
            const matchesTag = !this.filterTag || (cmd.tags && cmd.tags.includes(this.filterTag));
            const matchesSearch = !this.searchQuery || 
                (cmd.title && cmd.title.toLowerCase().includes(this.searchQuery)) || 
                (cmd.template && cmd.template.toLowerCase().includes(this.searchQuery)) ||
                (cmd.tags && cmd.tags.some(t => t.toLowerCase().includes(this.searchQuery)));
            
            return matchesVendor && matchesTag && matchesSearch;
        });
    }

    render() {
        const vendors = this.getVendors();
        const tags = this.getTags();

        UI.renderVendorFilters(vendors, this.filterVendor, this.commands, (v) => this.setVendorFilter(v));
        UI.renderTagCloud(tags, this.filterTag, (t) => this.setTagFilter(t));
        UI.updateCount(this.commands.length);
        this.renderGrid();
    }

        renderGrid() {
        const filtered = this.getFilteredCommands();
        UI.renderGrid(filtered, {
            onAdd: () => Modal.open(),
            onEdit: (id) => this.editCommand(id),
            onDelete: (id) => this.deleteCommand(id),
            onCopy: (id) => this.copyCommand(id),
            
            // === ДОБАВЬТЕ ЭТО ===
            onHistory: (id) => {
                const cmd = this.commands.find(c => c.id === id);
                if (cmd) {
                    History.openHistoryModal(cmd, (restoredCmd) => {
                        // Этот код выполнится, когда пользователь нажмет "Восстановить"
                        const index = this.commands.findIndex(c => c.id === restoredCmd.id);
                        if (index !== -1) {
                            this.commands[index] = restoredCmd;
                            Storage.save(this.commands);
                            this.render();
                            UI.showToast('Версия восстановлена!', 'success');
                        }
                    });
                }
            }
        });
    }

    setVendorFilter(vendor) {
        this.filterVendor = vendor;
        this.render();
    }

    setTagFilter(tag) {
        this.filterTag = this.filterTag === tag ? null : tag;
        this.render();
    }

    handleSave(command) {
    const index = this.commands.findIndex(c => c.id === command.id);
        
      if (index !== -1) {
            // Редактирование существующей команды — делаем снапшот перед сохранением
         const existingCmd = this.commands[index];
         const finalCommand = History.createSnapshot(existingCmd, command);
            
         this.commands[index] = finalCommand;
         UI.showToast('Команда обновлена', 'success');
        Logger.writeLog('UPDATE_COMMAND', { id: command.id, title: command.title }); // ← лог

    } else {
         // Новая команда — просто сохраняем
        const finalCommand = History.createSnapshot(null, command);
        this.commands.unshift(finalCommand);
        UI.showToast('Команда добавлена', 'success');
        Logger.writeLog('CREATE_COMMAND', { id: command.id, title: command.title }); // ← лог

    }

        Storage.save(this.commands);
        this.render();
    }
    editCommand(id) {
        const command = this.commands.find(c => c.id === id);
        if (command) {
            Modal.open(command);
        }
    }

    deleteCommand(id) {
        if (!confirm('Удалить эту команду?')) return;
        
        this.commands = this.commands.filter(c => c.id !== id);
        Storage.save(this.commands);
        this.render();
        UI.showToast('Команда удалена', 'danger');
    }

    copyCommand(id) {
        const command = this.commands.find(c => c.id === id);
        if (command && command.template) {
            // Используем parseTemplate чтобы получить чистый текст без {}
            const parsed = Utils.parseTemplate(command.template);
            navigator.clipboard.writeText(parsed.plain).then(() => {
                UI.showToast('Команда скопирована в буфер обмена', 'success');
            });
        }
    }

    clearAll() {
        if (this.commands.length === 0) return;
        if (!confirm('ВНИМАНИЕ: Это удалит ВСЕ команды из локального хранилища. Продолжить?')) return;

        this.commands = [];
        Storage.clear();
        this.render();
        UI.showToast('Все данные очищены', 'danger');
    }

    export() {
        Storage.exportToFile(this.commands);
        UI.showToast('База данных экспортирована', 'success');
    }

    async import(input) {
        const file = input.files[0];
        if (!file) return;

        try {
            const data = await Storage.importFromFile(file);
            
            if (this.commands.length > 0) {
                const merge = confirm('Объединить с текущей базой? (OK - объединить, Отмена - заменить)');
                if (merge) {
                    const existingIds = new Set(this.commands.map(c => c.id));
                    const newItems = data.filter(item => !existingIds.has(item.id));
                    this.commands = [...this.commands, ...newItems];
                } else {
                    this.commands = data;
                }
            } else {
                this.commands = data;
            }

            Storage.save(this.commands);
            this.render();
            UI.showToast(`Импортировано ${data.length} команд`, 'success');
        } catch (err) {
            UI.showToast('Ошибка импорта: ' + err.message, 'danger');
        }

        input.value = '';
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const app = new NetForgeApp();
    app.init();
});