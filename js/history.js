// js/history.js
const History = {
    MAX_VERSIONS: 10,

    /**
     * Сравнивает старую и новую команду. Если есть изменения, делает снапшот.
     */
    createSnapshot(oldCmd, newCmd) {
        if (!oldCmd) {
            // Для новой команды просто возвращаем её как есть (с пустой историей)
            newCmd.history = newCmd.history || [];
            return newCmd;
        }

        const isChanged = 
            oldCmd.template !== newCmd.template || 
            oldCmd.description !== newCmd.description ||
            oldCmd.title !== newCmd.title ||
            JSON.stringify(oldCmd.tags || []) !== JSON.stringify(newCmd.tags || []);

        if (isChanged) {
            if (!oldCmd.history) oldCmd.history = [];
            
            // Добавляем СТАРОЕ состояние в начало массива
            oldCmd.history.unshift({
                timestamp: Date.now(),
                title: oldCmd.title,
                template: oldCmd.template,
                description: oldCmd.description,
                tags: oldCmd.tags || []
            });

            // Ограничиваем историю
            if (oldCmd.history.length > this.MAX_VERSIONS) {
                oldCmd.history = oldCmd.history.slice(0, this.MAX_VERSIONS);
            }

            newCmd.history = oldCmd.history;
        } else {
            newCmd.history = oldCmd.history || [];
        }

        return newCmd;
    },

    /**
     * Открывает модалку с историей. onRestore - это функция, которую app.js передаст нам.
     */
    openHistoryModal(cmd, onRestore) {
        if (!cmd || !cmd.history || cmd.history.length === 0) {
            UI.showToast('История этой команды пуста', 'info');
            return;
        }

        const modalHtml = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" id="history-modal">
                <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="History.closeHistoryModal()"></div>
                <div class="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                    
                    <div class="p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                        <h2 class="text-lg font-bold text-white">
                            <i class="fa-solid fa-clock-rotate-left text-blue-400 mr-2"></i>
                            История: ${this.escapeHtml(cmd.title)}
                        </h2>
                        <button onclick="History.closeHistoryModal()" class="text-slate-400 hover:text-white">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>

                    <div class="p-6 overflow-y-auto space-y-4">
                        ${cmd.history.map((version, index) => `
                            <div class="border-l-2 border-slate-700 pl-4 py-2 hover:border-blue-500 transition-colors group">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex-1 pr-4">
                                        <div class="text-xs text-slate-500 mb-1">
                                            <i class="fa-regular fa-clock mr-1"></i>
                                            ${this.formatDate(version.timestamp)}
                                        </div>
                                        <div class="text-white font-medium truncate">${this.escapeHtml(version.title)}</div>
                                    </div>
                                    <button data-restore-index="${index}"
                                        class="btn-restore bg-blue-600/80 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 shrink-0">
                                        <i class="fa-solid fa-rotate-left"></i> Восстановить
                                    </button>
                                </div>
                                <pre class="text-xs text-green-400 font-mono bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre-wrap border border-slate-700">${this.escapeHtml(version.template)}</pre>
                                ${version.description ? `<p class="text-xs text-slate-500 mt-2 italic pl-3 border-l-2 border-slate-600">${this.escapeHtml(version.description)}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Навешиваем обработчики на кнопки "Восстановить"
        const modal = document.getElementById('history-modal');
        modal.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', () => {
                const versionIndex = parseInt(btn.dataset.restoreIndex, 10);
                this.restoreVersion(cmd, versionIndex, onRestore);
            });
        });
    },

    closeHistoryModal() {
        document.getElementById('history-modal')?.remove();
    },

    /**
     * Восстанавливает версию и передает обновленный объект команды в app.js через onRestore.
     */
    restoreVersion(cmd, versionIndex, onRestore) {
        const oldVersion = cmd.history[versionIndex];
        
        // Создаем объект с текущим состоянием (без истории), чтобы сохранить его как снапшот
        const currentSnapshot = {
            id: cmd.id,
            vendor: cmd.vendor,
            title: cmd.title,
            template: cmd.template,
            description: cmd.description,
            tags: cmd.tags,
            history: []
        };

        // Создаем объект с восстановленными данными
        const restoredCmd = {
            ...cmd,
            title: oldVersion.title,
            template: oldVersion.template,
            description: oldVersion.description,
            tags: oldVersion.tags
        };

        // Делаем снапшот текущего состояния перед откатом
        const finalCmd = this.createSnapshot(currentSnapshot, restoredCmd);
        
        // Передаем готовую команду в app.js для сохранения
        if (onRestore && typeof onRestore === 'function') {
            onRestore(finalCmd);
        }

        this.closeHistoryModal();
    },

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Сегодня, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Вчера, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (days < 7) {
            return `${days} дн. назад`;
        }
        
        return date.toLocaleDateString('ru-RU', { 
            day: '2-digit', month: 'short', year: 'numeric'
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};