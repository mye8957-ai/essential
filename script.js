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

// 生成卡密 - 修复版
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
    
    // 使用立即执行函数避免setTimeout问题
    (function generate() {
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
    })(); // 立即执行，不使用setTimeout
}

// 显示生成的卡密
function displayGeneratedKeys(keys, keyType) {
    console.log('生成的卡密数量:', keys.length); // 调试信息
    
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
    
    // 显示实际生成数量
    const resultTitle = document.querySelector('#generateResult h3');
    resultTitle.textContent = `✅ 生成的卡密 (${keys.length}个)`;
    
    showNotification(`✅ 成功生成 ${keys.length} 个${typeNames[keyType]}！`, 'success');
}

// 其他函数保持不变...
// [封禁管理、检查状态、复制等功能保持不变]

// 更新统计信息
function updateStatistics() {
    const totalKeys = Object.keys(keysData.keys).length;
    const bannedKeys = Object.values(keysData.keys).filter(k => k.status === 1).length;
    
    keysData.settings.total_keys = totalKeys;
    keysData.settings.last_updated = new Date().toISOString();
    
    console.log(`统计: 总数${totalKeys}, 封禁${bannedKeys}, 正常${totalKeys - bannedKeys}`);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔑 Essential 卡密系统已加载');
    loadExistingKeys();
    
    // 添加点击事件监听，避免重复绑定
    const generateBtn = document.querySelector('.btn-primary');
    generateBtn.addEventListener('click', generateKeys);
});
