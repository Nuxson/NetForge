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
        // Берём только первую строку команды для предпросмотра
        const firstLine = cmd.template.split('\n')[0];
        const highlightedCode = Utils.highlightSyntax(firstLine);
        
        // Показываем индикатор если строк больше одной
        const multiLineIndicator = cmd.template.includes('\n') 
            ? `<span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-slate-900/80 px-1.5 py-0.5 rounded">+${cmd.template.split('\n').length - 1} строк</span>` 
            : '';
        
        return `
            <div class="command-card bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-black/20 animate-fade-in group h-fit">
                <!-- Заголовок -->
                <div class="card-header border-b border-slate-700/50 flex justify-between items-start">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-0.5">
                            ${cmd.vendor ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 shrink-0 uppercase tracking-wider">${cmd.vendor}</span>` : ''}
                            <h3 class="font-semibold text-slate-100 text-sm leading-tight truncate" title="${cmd.title}">${cmd.title}</h3>
                        </div>
                        ${cmd.description ? `<p class="text-[11px] text-slate-500 truncate">${cmd.description}</p>` : ''}
                    </div>
                    <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 -mr-2 -mt-2">
                        <button data-edit="${cmd.id}" class="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"><i class="fa-solid fa-pen text-[10px]"></i></button>
                        <button data-delete="${cmd.id}" class="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><i class="fa-solid fa-trash text-[10px]"></i></button>
                    </div>
                </div>
                
                <!-- Код - одна строка с горизонтальным скроллом -->
                <div class="card-code code-scrollbar group/code cursor-pointer" data-copy="${cmd.id}" title="Кликните чтобы скопировать">
                    <button class="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                        <i class="fa-regular fa-copy text-[10px]"></i>
                    </button>
                    <pre class="pl-6"><code>${highlightedCode}</code></pre>
                    ${multiLineIndicator}
                </div>

                <!-- Теги -->
                ${cmd.tags && cmd.tags.length > 0 ? `
                <div class="card-footer border-t border-slate-700/50 flex gap-1.5 overflow-x-auto no-scrollbar">
                    ${cmd.tags.slice(0, 3).map(t => `<span class="text-[10px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap">#${t}</span>`).join('')}
                    ${cmd.tags.length > 3 ? `<span class="text-[10px] text-slate-600 px-1 py-0.5">+${cmd.tags.length - 3}</span>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    },

    bindCardEvents(handlers) {
        // Клик по коду для копирования
        this.elements.grid.querySelectorAll('.card-code[data-copy]').forEach(el => {
            el.addEventListener('click', () => handlers.onCopy(el.dataset.copy));
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