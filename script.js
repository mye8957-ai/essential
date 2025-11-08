// 卡密数据
let keysData = {
    keys: {},
    settings: {
        version: "2.0",
        created_by: "mye8957-ai",
        last_updated: new Date().toISOString().split('T')[0],
        total_keys: 0
    }
};

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
    
    if (keyAmount < 1 || keyAmount > 50) {
        alert('⚠️ 生成数量请在1-50之间');
        return;
    }
    
    // 显示加载中
    const button = document.querySelector('.generate-btn');
    const originalText = button.textContent;
    button.textContent = '⏳ 生成中...';
    button.disabled = true;
    
    setTimeout(() => {
        const newKeys = [];
        
        // 生成新卡密
        for (let i = 0; i < keyAmount; i++) {
            let key;
            let attempts = 0;
            
            // 确保卡密不重复
            do {
                key = generateRandomKey();
                attempts++;
                if (attempts > 20) {
                    alert('生成唯一卡密失败，请重试');
                    return;
                }
            } while (keysData.keys[key]);
            
            newKeys.push(key);
            
            // 添加到数据中
            keysData.keys[key] = {
                used: false,
                created_at: new Date().toISOString().split('T')[0],
                created_time: new Date().toISOString(),
                type: keyType,
                used_by: null,
                used_at: null
            };
        }
        
        // 更新统计
        keysData.settings.total_keys = Object.keys(keysData.keys).length;
        keysData.settings.last_updated = new Date().toISOString();
        
        // 显示结果
        displayGeneratedKeys(newKeys, keyType);
        
        // 恢复按钮
        button.textContent = originalText;
        button.disabled = false;
        
    }, 500);
}

// 显示生成的卡密
function displayGeneratedKeys(keys, keyType) {
    const keysHtml = keys.map(key => `
        <div class="key-item">
            <span class="key-text">${key}</span>
            <button class="copy-btn" onclick="copySingleKey('${key}')">复制</button>
        </div>
    `).join('');
    
    const typeNames = {
        '1day': '24小时卡密',
        '7day': '7天卡密', 
        '30day': '30天卡密',
        'permanent': '永久卡密'
    };
    
    document.getElementById('generatedKeys').innerHTML = keysHtml;
    document.getElementById('result').style.display = 'block';
    
    // 显示JSON数据
    const jsonOutput = document.getElementById('jsonOutput');
    jsonOutput.textContent = JSON.stringify(keysData, null, 2);
    jsonOutput.style.display = 'block';
    
    // 滚动到结果
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    
    // 显示成功消息
    showNotification(`✅ 成功生成 ${keys.length} 个${typeNames[keyType]}！`);
}

// 复制单个卡密
function copySingleKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        showNotification(`✅ 已复制: ${key}`);
    }).catch(err => {
        // 备用复制方法
        copyTextFallback(key);
        showNotification(`✅ 已复制: ${key}`);
    });
}

// 复制所有卡密
function copyAllKeys() {
    const keyElements = document.querySelectorAll('.key-text');
    const keysText = Array.from(keyElements).map(el => el.textContent).join('\n');
    
    navigator.clipboard.writeText(keysText).then(() => {
        showNotification('✅ 所有卡密已复制到剪贴板！');
    }).catch(err => {
        copyTextFallback(keysText);
        showNotification('✅ 所有卡密已复制到剪贴板！');
    });
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
function showNotification(message) {
    // 移除已存在的通知
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
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
});
