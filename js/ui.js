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

        // Создаём внутренний контейнер для grid layout
        // Это ключевое исправление - grid отдельно, скролл отдельно
        this.elements.grid.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                ${commands.map(cmd => this.createCard(cmd)).join('')}
            </div>
        `;
        
        this.bindCardEvents(handlers);
    },

    createCard(cmd) {
        const highlightedCode = Utils.highlightSyntax(cmd.template);
        
        return `
            <div class="command-card bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-black/20 flex flex-col animate-fade-in group h-fit">
                <div class="p-4 border-b border-slate-700 flex justify-between items-start bg-slate-800/50">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            ${cmd.vendor ? `<span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 shrink-0">${cmd.vendor}</span>` : ''}
                            <h3 class="font-semibold text-slate-100 leading-tight truncate" title="${cmd.title}">${cmd.title}</h3>
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-1">${cmd.description || ''}</p>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <button data-edit="${cmd.id}" class="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"><i class="fa-solid fa-pen"></i></button>
                        <button data-delete="${cmd.id}" class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                
                <div class="relative bg-slate-950 p-4 font-mono text-sm overflow-x-auto flex-1 group/code min-h-[120px]">
                    <button data-copy="${cmd.id}" class="absolute top-2 right-2 p-2 bg-slate-800 text-slate-400 rounded opacity-0 group-hover/code:opacity-100 hover:text-white hover:bg-slate-700 transition-all z-10" title="Копировать">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <pre class="text-slate-300 whitespace-pre-wrap break-all"><code>${highlightedCode}</code></pre>
                </div>

                ${cmd.tags && cmd.tags.length > 0 ? `
                <div class="px-4 py-2 bg-slate-800/80 border-t border-slate-700 flex gap-2 overflow-x-auto no-scrollbar">
                    ${cmd.tags.map(t => `<span class="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">#${t}</span>`).join('')}
                </div>
                ` : ''}
            </div>
        `;
    },

    bindCardEvents(handlers) {
        const grid = this.elements.grid.querySelector('.grid');
        if (!grid) return;
        
        grid.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => handlers.onEdit(btn.dataset.edit));
        });
        grid.querySelectorAll('button[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => handlers.onDelete(btn.dataset.delete));
        });
        grid.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => handlers.onCopy(btn.dataset.copy));
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