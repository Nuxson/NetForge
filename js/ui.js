const UI = {
    elements: {},

    init() {
        this.cacheElements();
    },

    cacheElements() {
        this.elements = {
            grid: document.getElementById('commands-grid'),
            vendorFilters: document.getElementById('vendor-filters'),
            tagCloud: document.getElementById('tag-cloud'),
            searchInput: document.getElementById('global-search'),
            resultCount: document.getElementById('result-count'),
            dbCount: document.getElementById('db-count'),
            toastContainer: document.getElementById('toast-container'),
            backupStatusIndicator: document.getElementById('backup-status-indicator'),
            backupStatusText: document.getElementById('backup-status-text'),
            backupLastDate: document.getElementById('backup-last-date')
        };
    },

    renderVendorFilters(vendors, currentFilter, commands, onFilter) {
        this.elements.vendorFilters.innerHTML = vendors.map(v => `
            <button data-vendor="${v}" 
                class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center group ${currentFilter === v ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}">
                <span>${v === 'All' ? 'Все вендоры' : v}</span>
                ${v !== 'All' ? `<span class="text-xs opacity-50 group-hover:opacity-100">${commands.filter(c => c.vendor === v).length}</span>` : ''}
            </button>
        `).join('');

        this.elements.vendorFilters.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => onFilter(btn.dataset.vendor));
        });
    },

    renderTagCloud(tags, currentFilter, onFilter) {
        this.elements.tagCloud.innerHTML = tags.map(t => `
            <button data-tag="${t}" 
                class="text-xs px-2 py-1 rounded border transition-all ${currentFilter === t ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}">
                #${t}
            </button>
        `).join('');

        this.elements.tagCloud.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => onFilter(btn.dataset.tag));
        });
    },

    renderGrid(commands, handlers) {
        this.elements.resultCount.innerText = commands.length;

        if (commands.length === 0) {
            this.elements.grid.innerHTML = `
                <div class="empty-state text-slate-500">
                    <i class="fa-solid fa-box-open text-5xl mb-4 opacity-30"></i>
                    <p class="text-lg mb-2">База команд пуста</p>
                    <p class="text-sm mb-4">Добавьте свою первую команду или импортируйте данные</p>
                    <button id="empty-add-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">
                        <i class="fa-solid fa-plus mr-2"></i>Добавить команду
                    </button>
                </div>
            `;
            document.getElementById('empty-add-btn').addEventListener('click', handlers.onAdd);
            return;
        }

        this.elements.grid.innerHTML = commands.map(cmd => this.createCard(cmd)).join('');
        this.bindCardEvents(handlers);
    },

    createCard(cmd) {
        const lines = cmd.template.split('\n');
        const firstLine = lines[0];
        const highlightedCode = Utils.highlightSyntax(firstLine);
        
        const multiLineBadge = lines.length > 1 
            ? `<span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded ml-2 whitespace-nowrap">+${lines.length - 1} строк</span>` 
            : '';
        
        return `
            <div class="command-card bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-500 transition-all hover:shadow-lg hover:shadow-black/20 animate-fade-in group h-fit">
                
                <!-- Заголовок -->
                <div class="card-header border-b border-slate-700/50">
                    <div class="flex items-center gap-2 mb-1">
                        ${cmd.vendor ? `<span class="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-300 shrink-0 uppercase tracking-wider">${cmd.vendor}</span>` : ''}
                        <h3 class="font-semibold text-slate-100 leading-tight truncate flex-1" title="${cmd.title}">${cmd.title}</h3>
                        
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button data-view="${cmd.id}" class="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded transition-colors" title="Просмотр">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                            <button data-edit="${cmd.id}" class="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors" title="Редактировать">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button data-delete="${cmd.id}" class="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors" title="Удалить">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                            <button data-history="${cmd.id}" class="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 rounded transition-colors" title="История изменений">
                                <i class="fa-solid fa-circle-exclamation text-xs"></i>
                            </button>
                        </div>
                    </div>
                    ${cmd.description ? `<p class="description text-slate-500 truncate leading-relaxed">${cmd.description}</p>` : ''}
                </div>
                
                <!-- Код с позиционной подсветкой -->
                <div class="card-code" data-copy="${cmd.id}" title="Кликните чтобы скопировать всю команду">
                    
                    <div class="code-fade"></div>
                    
                    <button type="button" class="copy-btn" data-copy-btn="${cmd.id}" title="">
                        <i class="fa-regular fa-copy"></i>
                        <span>Копировать</span>
                    </button>
                    
                    <code class="font-mono">${highlightedCode}</code>
                    ${multiLineBadge}
                </div>

                <!-- Теги -->
                ${cmd.tags && cmd.tags.length > 0 ? `
                <div class="card-footer border-t border-slate-700/30 flex gap-3 overflow-x-auto no-scrollbar">
                    ${cmd.tags.map(t => `<span class="tag text-slate-500 hover:text-slate-400 cursor-pointer transition-colors whitespace-nowrap">#${t}</span>`).join('')}
                </div>
                ` : ''}
            </div>
        `;
    },

    bindCardEvents(handlers) {
        this.elements.grid.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                handlers.onCopy(btn.dataset.copyBtn);
            });
        });
        
        this.elements.grid.querySelectorAll('.card-code[data-copy]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.copy-btn')) return;
                handlers.onCopy(el.dataset.copy);
            });
        });
        
        this.elements.grid.querySelectorAll('button[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (handlers.onView) {
                    handlers.onView(btn.dataset.view);
                }
            });
        });
        
        this.elements.grid.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handlers.onEdit(btn.dataset.edit);
            });
        });
        this.elements.grid.querySelectorAll('button[data-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handlers.onDelete(btn.dataset.delete);
            });
        });
        this.elements.grid.querySelectorAll('button[data-history]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (handlers.onHistory) {
                    handlers.onHistory(btn.dataset.history);
                }
            });
        });
    },

    updateCount(count) {
        this.elements.dbCount.innerText = count;
    },

    updateBackupStatus(status) {
        if (!this.elements.backupStatusIndicator) return;
        
        if (status.enabled) {
            this.elements.backupStatusIndicator.className = 'w-2 h-2 rounded-full bg-green-500';
            this.elements.backupStatusText.textContent = 'Активен';
        } else {
            this.elements.backupStatusIndicator.className = 'w-2 h-2 rounded-full bg-red-500';
            this.elements.backupStatusText.textContent = 'Выключен';
        }
        
        this.elements.backupLastDate.textContent = status.lastBackup || '-';
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'danger' ? 'border-red-500' : 'border-blue-500'}`;
        
        const icon = type === 'success' 
            ? '<i class="fa-solid fa-check-circle text-green-400"></i>' 
            : '<i class="fa-solid fa-exclamation-circle text-red-400"></i>';
        
        toast.innerHTML = `${icon}<span class="text-sm font-medium text-slate-200">${message}</span>`;
        
        this.elements.toastContainer.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};