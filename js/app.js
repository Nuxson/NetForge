class NetForgeApp {
    constructor() {
        this.commands = [];
        this.filterVendor = 'All';
        this.filterTag = null;
        this.searchQuery = '';
    }

    init() {
        this.commands = Storage.load();
        UI.init();
        Modal.init((command) => this.handleSave(command));
        this.bindEvents();
        this.initAutoBackup();
        this.render();
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
    }

    bindEvents() {
        UI.elements.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderGrid();
        });

        document.getElementById('btn-new-cmd').addEventListener('click', () => Modal.open());
        document.getElementById('btn-clear-all').addEventListener('click', () => this.clearAll());
        document.getElementById('btn-export').addEventListener('click', () => this.export());
        document.getElementById('import-file').addEventListener('change', (e) => this.import(e.target));
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
            onCopy: (id) => this.copyCommand(id)
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
            this.commands[index] = command;
            UI.showToast('Команда обновлена', 'success');
        } else {
            this.commands.unshift(command);
            UI.showToast('Команда добавлена', 'success');
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