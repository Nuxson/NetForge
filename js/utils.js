const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Ключевые слова для специальной подсветки
    KEYWORDS: {
        // Команды show/display
        show: 'syntax-cmd-show',
        display: 'syntax-cmd-show',
        sh: 'syntax-cmd-show',
        di: 'syntax-cmd-show',
        
        // Конфигурация
        configure: 'syntax-cmd-config',
        conf: 'syntax-cmd-config',
        config: 'syntax-cmd-config',
        configuration: 'syntax-cmd-config',
        
        // Интерфейсы
        interface: 'syntax-keyword-iface',
        interfaces: 'syntax-keyword-iface',
        iface: 'syntax-keyword-iface',
        if: 'syntax-keyword-iface',
        
        // IP/сеть
        ip: 'syntax-keyword-ip',
        ipv4: 'syntax-keyword-ip',
        ipv6: 'syntax-keyword-ip',
        icmp: 'syntax-keyword-ip',
        
        // VLAN
        vlan: 'syntax-keyword-vlan',
        vlans: 'syntax-keyword-vlan',
        
        // Маршрутизация
        route: 'syntax-keyword-route',
        routing: 'syntax-keyword-route',
        router: 'syntax-keyword-route',
        bgp: 'syntax-keyword-route',
        ospf: 'syntax-keyword-route',
        eigrp: 'syntax-keyword-route',
        isis: 'syntax-keyword-route',
        rip: 'syntax-keyword-route',
        mpls: 'syntax-keyword-route',
        
        // ACL/безопасность
        access: 'syntax-keyword-acl',
        acl: 'syntax-keyword-acl',
        list: 'syntax-keyword-acl',
        permit: 'syntax-keyword-acl',
        deny: 'syntax-keyword-acl',
        
        // NAT
        nat: 'syntax-keyword-nat',
        inside: 'syntax-keyword-nat',
        outside: 'syntax-keyword-nat',
        
        // DHCP
        dhcp: 'syntax-keyword-dhcp',
        
        // DNS
        dns: 'syntax-keyword-dns',
        
        // NTP
        ntp: 'syntax-keyword-ntp',
        
        // SNMP
        snmp: 'syntax-keyword-snmp',
        
        // SSH/Telnet
        ssh: 'syntax-keyword-ssh',
        telnet: 'syntax-keyword-ssh',
        scp: 'syntax-keyword-ssh',
        sftp: 'syntax-keyword-ssh',
        
        // Пользователи
        username: 'syntax-keyword-user',
        user: 'syntax-keyword-user',
        password: 'syntax-keyword-user',
        secret: 'syntax-keyword-user',
        enable: 'syntax-keyword-user',
        
        // Система
        system: 'syntax-keyword-system',
        reload: 'syntax-keyword-system',
        reboot: 'syntax-keyword-system',
        shutdown: 'syntax-keyword-system',
        restart: 'syntax-keyword-system',
        
        // Файлы
        copy: 'syntax-keyword-file',
        delete: 'syntax-keyword-file',
        erase: 'syntax-keyword-file',
        format: 'syntax-keyword-file',
        mkdir: 'syntax-keyword-file',
        dir: 'syntax-keyword-file',
        
        // Отладка
        debug: 'syntax-keyword-debug',
        undebug: 'syntax-keyword-debug',
        terminal: 'syntax-keyword-debug',
        monitor: 'syntax-keyword-debug',
        logging: 'syntax-keyword-debug',
        
        // Пинг/трассировка
        ping: 'syntax-keyword-ping',
        traceroute: 'syntax-keyword-ping',
        trace: 'syntax-keyword-ping',
        tracert: 'syntax-keyword-ping',
        
        // no
        no: 'syntax-keyword-no',
        
        // default
        default: 'syntax-keyword-default',
        
        // Режимы
        global: 'syntax-keyword-mode',
        privileged: 'syntax-keyword-mode',
        exec: 'syntax-keyword-mode',
        
        // Linux специфичные
        sudo: 'syntax-cmd-linux',
        apt: 'syntax-cmd-linux',
        yum: 'syntax-cmd-linux',
        dnf: 'syntax-cmd-linux',
        systemctl: 'syntax-cmd-linux',
        journalctl: 'syntax-cmd-linux',
        service: 'syntax-cmd-linux',
        grep: 'syntax-cmd-linux',
        awk: 'syntax-cmd-linux',
        sed: 'syntax-cmd-linux',
        cat: 'syntax-cmd-linux',
        ls: 'syntax-cmd-linux',
        cd: 'syntax-cmd-linux',
        pwd: 'syntax-cmd-linux',
        ps: 'syntax-cmd-linux',
        top: 'syntax-cmd-linux',
        netstat: 'syntax-cmd-linux',
        ss: 'syntax-cmd-linux',
        iproute2: 'syntax-cmd-linux',
        iptables: 'syntax-cmd-linux',
        nft: 'syntax-cmd-linux',
        tcpdump: 'syntax-cmd-linux',
        curl: 'syntax-cmd-linux',
        wget: 'syntax-cmd-linux',
        tar: 'syntax-cmd-linux',
        gzip: 'syntax-cmd-linux',
        chmod: 'syntax-cmd-linux',
        chown: 'syntax-cmd-linux',
        df: 'syntax-cmd-linux',
        du: 'syntax-cmd-linux',
        free: 'syntax-cmd-linux',
        uptime: 'syntax-cmd-linux',
        whoami: 'syntax-cmd-linux',
        uname: 'syntax-cmd-linux',
        hostname: 'syntax-cmd-linux',
        ifconfig: 'syntax-cmd-linux',
        iwconfig: 'syntax-cmd-linux',
        iw: 'syntax-cmd-linux',
        nmcli: 'syntax-cmd-linux',
        nmtui: 'syntax-cmd-linux',
        bridge: 'syntax-cmd-linux',
        ovs: 'syntax-cmd-linux',
        docker: 'syntax-cmd-linux',
        kubectl: 'syntax-cmd-linux',
        helm: 'syntax-cmd-linux',
    },

    // Позиционная подсветка: каждое слово по порядку своим цветом
    highlightSyntax(text) {
        if (!text) return '';
        
        const escaped = Utils.escapeHtml(text);
        
        // Разбиваем на слова и пробелы/спецсимволы
        const tokens = escaped.split(/(\s+|[|;,=&])/);
        
        // Цвета для позиций слов (циклически)
        const wordColors = [
            'syntax-pos-1',  // первое слово
            'syntax-pos-2',  // второе слово
            'syntax-pos-3',  // третье
            'syntax-pos-4',  // четвёртое
            'syntax-pos-5',  // пятое
            'syntax-pos-6',  // шестое
        ];
        
        let wordIndex = 0;
        let result = '';
        
        tokens.forEach(token => {
            if (!token) return;
            
            // Пробелы - как есть
            if (/^\s+$/.test(token)) {
                result += token;
            } 
            // Спецсимволы
            else if (/^[|;,=&]$/.test(token)) {
                result += `<span class="syntax-sep">${token}</span>`;
            } 
            // Слова - проверяем ключевые слова, иначе позиционная подсветка
            else {
                const lowerToken = token.toLowerCase();
                const keywordClass = Utils.KEYWORDS[lowerToken];
                
                if (keywordClass) {
                    // Ключевое слово - специальный цвет
                    result += `<span class="${keywordClass}">${token}</span>`;
                } else {
                    // Обычное слово - позиционная подсветка
                    const colorClass = wordColors[wordIndex % wordColors.length];
                    result += `<span class="${colorClass}">${token}</span>`;
                }
                
                wordIndex++;
            }
        });
        
        return result;
    },

    parseTags(tagsString) {
        return tagsString.split(',').map(t => t.trim()).filter(t => t);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }
};