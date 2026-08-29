const ViewModal = {
    elements: {},
    currentCommand: null,
    onEdit: null,

    init(onEditCallback) {
        this.onEdit = onEditCallback;
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.elements = {
            modal: document.getElementById('view-modal'),
            overlay: document.getElementById('view-modal-overlay'),
            closeBtn: document.getElementById('view-modal-close'),
            editBtn: document.getElementById('view-modal-edit'),
            copyBtn: document.getElementById('view-copy-btn'),
            title: document.getElementById('view-title'),
            vendor: document.getElementById('view-vendor'),
            template: document.getElementById('view-template'),
            description: document.getElementById('view-description'),
            tags: document.getElementById('view-tags')
        };
    },

    bindEvents() {
        this.elements.overlay.addEventListener('click', () => this.close());
        this.elements.closeBtn.addEventListener('click', () => this.close());
        this.elements.editBtn.addEventListener('click', () => {
            if (this.currentCommand && this.onEdit) {
                this.onEdit(this.currentCommand);
                this.close();
            }
        });
        this.elements.copyBtn.addEventListener('click', () => {
            if (this.currentCommand) {
                Utils.copyToClipboard(this.currentCommand.template);
            }
        });
    },

    open(command) {
        this.currentCommand = command;
        
        this.elements.title.textContent = command.title || 'Без названия';
        this.elements.vendor.textContent = command.vendor || 'Не указан';
        this.elements.template.textContent = command.template || '';
        this.elements.description.textContent = command.description || 'Описание отсутствует';
        
        // Рендеринг тегов
        if (command.tags && command.tags.length > 0) {
            this.elements.tags.innerHTML = command.tags.map(t => 
                `<span class="text-xs px-2 py-1 rounded border border-slate-700 text-slate-400">#${t}</span>`
            ).join('');
        } else {
            this.elements.tags.innerHTML = '<span class="text-xs text-slate-500">Теги не добавлены</span>';
        }

        this.elements.modal.classList.remove('hidden');
    },

    close() {
        this.elements.modal.classList.add('hidden');
        this.currentCommand = null;
    }
};
