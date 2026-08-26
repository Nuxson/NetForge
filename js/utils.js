const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Парсинг шаблона с {} подсветкой
    parseTemplate(template) {
        if (!template) return { html: '', plain: '' };
        
        // Разбиваем на части: обычный текст и {выделенный текст}
        const parts = [];
        let current = '';
        let inBraces = false;
        let braceContent = '';
        
        for (let i = 0; i < template.length; i++) {
            const char = template[i];
            
            if (char === '{' && !inBraces && template[i + 1] !== '{') {
                // Начало выделения
                if (current) {
                    parts.push({ type: 'normal', text: current });
                    current = '';
                }
                inBraces = true;
                braceContent = '';
            } else if (char === '}' && inBraces) {
                // Конец выделения
                parts.push({ type: 'highlight', text: braceContent });
                inBraces = false;
                current = '';
            } else if (inBraces) {
                braceContent += char;
            } else {
                current += char;
            }
        }
        
        // Остаток
        if (current) {
            parts.push({ type: 'normal', text: current });
        }
        // Незакрытая скобка
        if (inBraces && braceContent) {
            parts.push({ type: 'normal', text: '{' + braceContent });
        }
        
        // Генерируем HTML для отображения
        let html = '';
        let plain = '';
        
        parts.forEach(part => {
            if (part.type === 'highlight') {
                html += `<span class="syntax-highlight">${Utils.escapeHtml(part.text)}</span>`;
                plain += part.text;
            } else {
                const escaped = Utils.escapeHtml(part.text);
                // Дополнительная подсветка для обычного текста
                const highlighted = Utils.highlightBasicSyntax(escaped);
                html += highlighted;
                plain += part.text;
            }
        });
        
        return { html, plain };
    },

    // Базовая подсветка синтаксиса (без {})
    highlightBasicSyntax(text) {
        return text
            .replace(/\b(show|display|ping|traceroute|interface|ip|no|shutdown|system|backup|configure|set|get|add|remove|delete|enable|disable|run|start|stop|restart|status|list|info|help|version|config|save|load|import|export|clear|reset|default|mode|type|name|id|port|vlan|route|bgp|ospf|mpls|vpn|acl|nat|dhcp|dns|ntp|snmp|ssh|telnet|http|https|ftp|tftp|sftp|scp|rsync|curl|wget|tar|gzip|zip|unzip|cat|grep|awk|sed|cut|sort|uniq|head|tail|less|more|find|locate|which|whereis|chmod|chown|chgrp|ln|mkdir|rmdir|rm|cp|mv|touch|echo|printf|read|source|export|alias|unalias|history|jobs|fg|bg|kill|ps|top|htop|vmstat|iostat|netstat|ss|lsof|df|du|free|uptime|who|w|last|dmesg|journalctl|systemctl|service|crontab|at|batch|mkfs|fsck|mount|umount|fdisk|parted|lvcreate|vgcreate|pvcreate|mdadm|cryptsetup|iptables|nftables|firewalld|ufw|fail2ban|tcpdump|wireshark|tshark|nmap|masscan|nikto|sqlmap|metasploit|aircrack|john|hashcat|hydra|medusa|nc|ncat|socat|openssl|gpg|ssh-keygen|ssh-copy-id|scp|rsync|ansible|puppet|chef|salt|terraform|vagrant|docker|podman|kubectl|helm|minikube|kind|k3s|k9s|stern|istioctl|linkerd|consul|vault|nomad|packer|boundary|waypoint|nomad|consul-template|envoy|nginx|apache|httpd|lighttpd|caddy|haproxy|traefik|varnish|squid|memcached|redis|mongodb|mysql|mariadb|postgresql|sqlite|elasticsearch|kibana|logstash|beats|grafana|prometheus|alertmanager|thanos|cortex|loki|tempo|jaeger|zipkin|otel|fluentd|fluent-bit|vector|filebeat|metricbeat|packetbeat|heartbeat|auditbeat|osquery|falco|sysdig|tracee|trivy|snyk|clair|anchore|grype)\b/gi, '<span class="syntax-cmd">$1</span>')
            .replace(/\b(router|switch|firewall|ap|controller|gateway|server|client|peer|neighbor|host|node|cluster|pod|container|image|volume|network|subnet|mask|gateway|dns|domain|hostname|fqdn|url|uri|path|file|dir|folder|link|socket|pipe|fifo|device|block|char|major|minor|inode|uid|gid|pid|ppid|tid|sid|pgid|nice|priority|sched|affinity|cpuset|cgroup|namespace|ipc|uts|net|pid|user|mnt|time|seccomp|apparmor|selinux|smack|tomoyo|ima|evm|tpm|uefi|bios|grub|lilo|initrd|vmlinuz|bzImage|zImage|uImage|fit|dtb|dts|dtsi|yaml|yml|json|xml|toml|ini|cfg|conf|config|properties|env|dotenv|shell|bash|zsh|fish|sh|csh|tcsh|ksh|dash|ash|hush|busybox)\b/gi, '<span class="syntax-keyword">$1</span>')
            .replace(/(\|.*)/g, '<span class="syntax-comment">$1</span>');
    },

    // Устаревший метод для совместимости
    highlightSyntax(template) {
        return Utils.parseTemplate(template).html;
    },

    parseTags(tagsString) {
        return tagsString.split(',').map(t => t.trim()).filter(t => t);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }
};