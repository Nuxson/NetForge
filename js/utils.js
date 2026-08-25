const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    highlightSyntax(text) {
        if (!text) return '';
        let html = Utils.escapeHtml(text)
            .replace(/(\{\{.*?\}\})/g, '<span class="syntax-arg">$1</span>')
            .replace(/\b(show|display|ping|interface|ip|no|shutdown|system|backup|configure|set|get|add|remove|delete|enable|disable)\b/g, '<span class="syntax-cmd">$1</span>')
            .replace(/(\|.*)/g, '<span class="syntax-comment">$1</span>');
        return html;
    },

    parseTags(tagsString) {
        return tagsString.split(',').map(t => t.trim()).filter(t => t);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }
};