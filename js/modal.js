const Modal = {
    elements: {},
    onSave: null,

    init(onSaveCallback) {
        this.onSave = onSaveCallback;
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.elements = {
            modal: document.getElementById('modal'),
            overlay: document.getElementById('modal-overlay'),
            closeBtn: document.getElementById('modal-close'),
            cancelBtn: document.getElementById('modal-cancel'),
            saveBtn: document.getElementById('modal-save'),
            title: document.getElementById('modal-title'),
            form: {
                id: document.getElementById('cmd-id'),
                title: document.getElementById('cmd-title'),
                vendor: document.getElementById('cmd-vendor'),
                template: document.getElementById('cmd-template'),
                desc: document.getElementById('cmd-desc'),
                tags: document.getElementById('cmd-tags')
            }
        };
    },

    bindEvents() {
        this.elements.overlay.addEventListener('click', () => this.close());
        this.elements.closeBtn.addEventListener('click', () => this.close());
        this.elements.cancelBtn.addEventListener('click', () => this.close());
        this.elements.saveBtn.addEventListener('click', () => this.save());
    },

    open(command = null) {
        this.elements.modal.classList.remove('hidden');
        
        if (command) {
            this.elements.title.innerText = 'Редактировать команду';
            this.elements.form.id.value = command.id;
            this.elements.form.title.value = command.title || '';
            this.elements.form.vendor.value = command.vendor || '';
            this.elements.form.template.value = command.template || '';
            this.elements.form.desc.value = command.description || '';
            this.elements.form.tags.value = command.tags ? command.tags.join(', ') : '';
        } else {
            this.elements.title.innerText = 'Новая команда';
            this.elements.form.id.value = '';
            this.elements.form.title.value = '';
            this.elements.form.vendor.value = '';
            this.elements.form.template.value = '';
            this.elements.form.desc.value = '';
            this.elements.form.tags.value = '';
        }
    },

    close() {
        this.elements.modal.classList.add('hidden');
    },

    save() {
        const id = this.elements.form.id.value;
        const title = this.elements.form.title.value.trim();
        const vendor = this.elements.form.vendor.value.trim();
        const template = this.elements.form.template.value.trim();
        const description = this.elements.form.desc.value.trim();
        const tags = Utils.parseTags(this.elements.form.tags.value);

        if (!title || !template) {
            UI.showToast('Заполните обязательные поля (Название и Команда)', 'danger');
            return;
        }

        const command = {
            id: id || Utils.generateId(),
            title,
            vendor,
            template,
            description,
            tags
        };

        this.onSave(command);
        this.close();
    },

    getFormData() {
        return {
            id: this.elements.form.id.value,
            title: this.elements.form.title.value.trim(),
            vendor: this.elements.form.vendor.value.trim(),
            template: this.elements.form.template.value.trim(),
            description: this.elements.form.desc.value.trim(),
            tags: Utils.parseTags(this.elements.form.tags.value)
        };
    }
};