// 卡密数据
let keysData = {
    keys: {},
    settings: {
        version: "2.1",
        created_by: "mye8957-ai",
        last_updated: new Date().toISOString().split('T')[0],
        total_keys: 0,
        status_codes: {
            "1": "封禁",
            "2": "正常"
        }
    }
};

// 加载现有卡密数据
async function loadExistingKeys() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/mye8957-ai/essential/main/keys.json?t=' + Date.now());
        if (response.ok) {
            const existingData = await response.json();
            keysData = existingData;
            updateStatistics();
            showNotification('✅ 已加载现有卡密数据', 'success');
        }
    } catch (error) {
        console.log('使用新数据文件');
    }
}

// 生成随机卡密
function generateRandomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'KEY-';
    for (let i = 0; i < 8; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// 生成卡密
function generateKeys() {
    const keyType = document.getElementById('keyType').value;
    const keyAmount = parseInt(document.getElementById('keyAmount').value);
    
    if (keyAmount < 1 || keyAmount > 20) {
        alert('⚠️ 生成数量请在1-20之间');
        return;
    }
    
    const button = document.querySelector('.btn-primary');
    const originalText = button.textContent;
    button.textContent = '⏳ 生成中...';
    button.disabled = true;
    
    setTimeout(() => {
        const newKeys = [];
        
        for (let i = 0; i < keyAmount; i++) {
            let key;
            let attempts = 0;
            
            do {
                key = generateRandomKey();
                attempts++;
                if (attempts > 20) {
                    alert('生成唯一卡密失败，请重试');
                    button.textContent = originalText;
                    button.disabled = false;
                    return;
                }
            } while (keysData.keys[key]);
            
            newKeys.push(key);
            
            // 添加到数据中，默认状态为正常(2)
            keysData.keys[key] = {
                used: false,
                type: keyType,
                status: 2,  // 默认正常状态
                ban_reason: "",
                created_at: new Date().toISOString().split('T')[0],
                created_time: new Date().toISOString()
            };
        }
        
        // 更新统计信息
        updateStatistics();
        
        // 显示结果
        displayGeneratedKeys(newKeys, keyType);
        
        // 恢复按钮
        button.textContent = originalText;
        button.disabled = false;
        
    }, 500);
}

// 显示生成的卡密
function displayGeneratedKeys(keys, keyType) {
    const keysHtml = keys.map(key => {
        const keyInfo = keysData.keys[key];
        const statusClass = keyInfo.status === 1 ? 'banned' : '';
        const statusText = keyInfo.status === 1 ? '封禁' : '正常';
        const statusBadge = keyInfo.status === 1 ? 'status-banned' : 'status-normal';
        
        return `
            <div class="key-item ${statusClass}">
                <span class="key-text">${key}</span>
                <span class="key-status ${statusBadge}">${statusText}</span>
            </div>
        `;
    }).join('');
    
    const typeNames = {
        '1day': '24小时卡密',
        '7day': '7天卡密', 
        '30day': '30天卡密',
        'permanent': '永久卡密'
    };
    
    document.getElementById('generatedKeys').innerHTML = keysHtml;
    document.getElementById('generateResult').style.display = 'block';
    
    // 滚动到结果
    document.getElementById('generateResult').scrollIntoView({ behavior: 'smooth' });
    
    showNotification(`✅ 成功生成 ${keys.length} 个${typeNames[keyType]}！`, 'success');
}

// 封禁卡密
function banKey() {
    const key = document.getElementById('manageKey').value.toUpperCase().trim();
    const reason = document.getElementById('banReason').value.trim() || "违反使用规则";
    
    if (!key || !key.startsWith('KEY-')) {
        alert('请输入有效的卡密号码');
        return;
    }
    
    if (!keysData.keys[key]) {
        alert('卡密不存在');
        return;
    }
    
    keysData.keys[key].status = 1;
    keysData.keys[key].ban_reason = reason;
    
    updateStatistics();
    showNotification(`✅ 已封禁卡密: ${key}`, 'error');
    displayKeyInfo(key);
}

// 解封卡密
function unbanKey() {
    const key = document.getElementById('manageKey').value.toUpperCase().trim();
    
    if (!key || !key.startsWith('KEY-')) {
        alert('请输入有效的卡密号码');
        return;
    }
    
    if (!keysData.keys[key]) {
        alert('卡密不存在');
        return;
    }
    
    keysData.keys[key].status = 2;
    keysData.keys[key].ban_reason = "";
    
    updateStatistics();
    showNotification(`✅ 已解封卡密: ${key}`, 'success');
    displayKeyInfo(key);
}

// 检查卡密状态
function checkKey() {
    const key = document.getElementById('manageKey').value.toUpperCase().trim();
    
    if (!key || !key.startsWith('KEY-')) {
        alert('请输入有效的卡密号码');
        return;
    }
    
    if (!keysData.keys[key]) {
        alert('卡密不存在');
        return;
    }
    
    displayKeyInfo(key);
}

// 显示卡密信息
function displayKeyInfo(key) {
    const keyInfo = keysData.keys[key];
    const statusText = keyInfo.status === 1 ? '封禁' : '正常';
    const statusClass = keyInfo.status === 1 ? 'status-banned' : 'status-normal';
    const statusColor = keyInfo.status === 1 ? '#e74c3c' : '#27ae60';
    
    const infoHtml = `
        <div class="key-item" style="border-left-color: ${statusColor}">
            <div>
                <strong>卡密:</strong> ${key}<br>
                <strong>类型:</strong> ${getTypeName(keyInfo.type)}<br>
                <strong>状态:</strong> <span class="key-status ${statusClass}">${statusText}</span><br>
                <strong>创建时间:</strong> ${keyInfo.created_at}<br>
                ${keyInfo.ban_reason ? `<strong>封禁原因:</strong> ${keyInfo.ban_reason}` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('keyInfo').innerHTML = infoHtml;
    document.getElementById('manageResult').style.display = 'block';
}

// 获取类型名称
function getTypeName(type) {
    const typeNames = {
        '1day': '24小时',
        '7day': '7天',
        '30day': '30天',
        'permanent': '永久'
    };
    return typeNames[type] || type;
}

// 更新统计信息
function updateStatistics() {
    const totalKeys = Object.keys(keysData.keys).length;
    const bannedKeys = Object.values(keysData.keys).filter(k => k.status === 1).length;
    
    keysData.settings.total_keys = totalKeys;
    keysData.settings.last_updated = new Date().toISOString();
    
    console.log(`统计: 总数${totalKeys}, 封禁${bannedKeys}, 正常${totalKeys - bannedKeys}`);
}

// 复制所有卡密
function copyAllKeys() {
    const keys = Object.keys(keysData.keys);
    const keysText = keys.join('\n');
    
    navigator.clipboard.writeText(keysText).then(() => {
        showNotification('✅ 所有卡密已复制到剪贴板！', 'success');
    }).catch(err => {
        copyTextFallback(keysText);
        showNotification('✅ 所有卡密已复制到剪贴板！', 'success');
    });
}

// 显示JSON数据
function showJSON() {
    const jsonOutput = document.getElementById('jsonOutput');
    jsonOutput.textContent = JSON.stringify(keysData, null, 2);
    jsonOutput.style.display = 'block';
}

// 备用复制方法
function copyTextFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

// 显示通知
function showNotification(message, type = 'info') {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔑 Essential 卡密系统已加载');
    loadExistingKeys();
});
