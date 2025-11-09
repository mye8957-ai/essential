// 配置信息
const CONFIG = {
    repoOwner: 'mye8957-ai',
    repoName: 'essential',
    filePath: 'keys.json',
    branch: 'main'
};

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

// 显示Token输入框
function showTokenInput() {
    const token = prompt('请输入GitHub Personal Token（用于自动更新）：\n\n获取方法：\n1. GitHub Settings → Developer settings\n2. Personal access tokens → Tokens (classic)\n3. 勾选 repo 权限');
    if (token) {
        localStorage.setItem('github_token', token);
        checkTokenValid().then(valid => {
            if (valid) {
                showNotification('✅ Token验证成功！', 'success');
                updateTokenStatus();
                loadExistingKeys(); // 重新加载数据
            } else {
                showNotification('❌ Token无效，请重新设置', 'error');
                localStorage.removeItem('github_token');
            }
        });
    }
}

// 检查Token是否有效
async function checkTokenValid() {
    const token = localStorage.getItem('github_token');
    if (!token) return false;

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 更新Token状态显示
function updateTokenStatus() {
    const tokenStatus = document.getElementById('tokenStatus');
    const token = localStorage.getItem('github_token');
    
    if (token) {
        tokenStatus.innerHTML = '🟢 Token已设置';
        tokenStatus.style.color = '#27ae60';
    } else {
        tokenStatus.innerHTML = '🔴 Token未设置';
        tokenStatus.style.color = '#e74c3c';
    }
}

// 获取keys.json文件内容和SHA
async function getKeysFileWithSHA() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        showNotification('❌ 请先设置GitHub Token', 'error');
        return null;
    }

    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
        
        const data = await response.json();
        const content = atob(data.content.replace(/\s/g, ''));
        const jsonData = JSON.parse(content);
        jsonData._sha = data.sha; // 保存SHA用于更新
        return jsonData;
    } catch (error) {
        console.error('获取文件失败:', error);
        showNotification('❌ 获取文件失败，请检查Token和仓库权限', 'error');
        return null;
    }
}

// 自动更新keys.json文件
async function updateKeysToGitHub(operation = '更新数据') {
    const token = localStorage.getItem('github_token');
    if (!token) {
        showNotification('❌ 请先设置GitHub Token', 'error');
        return false;
    }

    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
    
    const content = JSON.stringify(keysData, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));
    
    // 先获取最新的SHA
    const currentFile = await getKeysFileWithSHA();
    if (!currentFile) return false;
    
    const body = {
        message: `${operation} - ${new Date().toLocaleString()}`,
        content: contentBase64,
        branch: CONFIG.branch,
        sha: currentFile._sha
    };
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            showNotification('✅ 数据已自动同步到GitHub！', 'success');
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || '更新失败');
        }
    } catch (error) {
        console.error('更新文件失败:', error);
        showNotification(`❌ 自动更新失败: ${error.message}`, 'error');
        return false;
    }
}

// 加载现有卡密数据
async function loadExistingKeys() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        console.log('Token未设置，使用本地数据');
        return;
    }

    try {
        const latestData = await getKeysFileWithSHA();
        if (latestData) {
            keysData = latestData;
            updateStatistics();
            showNotification('✅ 已从GitHub加载最新数据', 'success');
        }
    } catch (error) {
        console.log('加载远程数据失败，使用本地数据');
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

// 生成卡密并自动上传
async function generateKeys() {
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
    
    try {
        // 先加载最新数据，避免冲突
        const latestData = await getKeysFileWithSHA();
        if (latestData) {
            keysData = latestData;
        }
        
        const newKeys = [];
        
        for (let i = 0; i < keyAmount; i++) {
            let key;
            let attempts = 0;
            
            do {
                key = generateRandomKey();
                attempts++;
                if (attempts > 20) {
                    throw new Error('生成唯一卡密失败，请重试');
                }
            } while (keysData.keys[key]);
            
            newKeys.push(key);
            
            // 添加到数据中
            keysData.keys[key] = {
                used: false,
                type: keyType,
                status: 2,
                ban_reason: "",
                created_at: new Date().toISOString().split('T')[0],
                created_time: new Date().toISOString()
            };
        }
        
        updateStatistics();
        
        // 自动上传到GitHub
        const success = await updateKeysToGitHub(`生成 ${keyAmount} 个${getTypeName(keyType)}卡密`);
        
        if (success) {
            displayGeneratedKeys(newKeys, keyType);
            showNotification(`✅ 成功生成 ${keyAmount} 个卡密并自动保存！`, 'success');
        } else {
            displayGeneratedKeys(newKeys, keyType);
            showNotification(`⚠️ 卡密已生成，但自动上传失败，请手动更新`, 'warning');
        }
        
    } catch (error) {
        showNotification(`❌ 生成失败: ${error.message}`, 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// 封禁卡密并自动上传
async function banKey() {
    const key = document.getElementById('manageKey').value.toUpperCase().trim();
    const reason = document.getElementById('banReason').value.trim() || "违反使用规则";
    
    if (!key || !key.startsWith('KEY-')) {
        alert('请输入有效的卡密号码');
        return;
    }
    
    // 先加载最新数据
    const latestData = await getKeysFileWithSHA();
    if (latestData) {
        keysData = latestData;
    }
    
    if (!keysData.keys[key]) {
        alert('卡密不存在');
        return;
    }
    
    keysData.keys[key].status = 1;
    keysData.keys[key].ban_reason = reason;
    
    updateStatistics();
    
    // 自动上传到GitHub
    const success = await updateKeysToGitHub(`封禁卡密: ${key}`);
    
    if (success) {
        showNotification(`✅ 已封禁卡密: ${key}`, 'error');
    } else {
        showNotification(`⚠️ 卡密已封禁，但自动上传失败`, 'error');
    }
    
    displayKeyInfo(key);
}

// 解封卡密并自动上传
async function unbanKey() {
    const key = document.getElementById('manageKey').value.toUpperCase().trim();
    
    if (!key || !key.startsWith('KEY-')) {
        alert('请输入有效的卡密号码');
        return;
    }
    
    // 先加载最新数据
    const latestData = await getKeysFileWithSHA();
    if (latestData) {
        keysData = latestData;
    }
    
    if (!keysData.keys[key]) {
        alert('卡密不存在');
        return;
    }
    
    keysData.keys[key].status = 2;
    keysData.keys[key].ban_reason = "";
    
    updateStatistics();
    
    // 自动上传到GitHub
    const success = await updateKeysToGitHub(`解封卡密: ${key}`);
    
    if (success) {
        showNotification(`✅ 已解封卡密: ${key}`, 'success');
    } else {
        showNotification(`⚠️ 卡密已解封，但自动上传失败`, 'error');
    }
    
    displayKeyInfo(key);
}

// 检查卡密状态
async function checkKey() {
    const key = document.getElementById('manageKey').value.toUpperCase().trim();
    
    if (!key || !key.startsWith('KEY-')) {
        alert('请输入有效的卡密号码');
        return;
    }
    
    // 加载最新数据
    const latestData = await getKeysFileWithSHA();
    if (latestData) {
        keysData = latestData;
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
                ${keyInfo.used ? `<strong>使用状态:</strong> 已使用` : `<strong>使用状态:</strong> 未使用`}<br>
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
    const usedKeys = Object.values(keysData.keys).filter(k => k.used).length;
    
    keysData.settings.total_keys = totalKeys;
    keysData.settings.last_updated = new Date().toISOString();
    
    console.log(`统计: 总数${totalKeys}, 封禁${bannedKeys}, 已使用${usedKeys}, 可用${totalKeys - usedKeys}`);
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
    
    document.getElementById('generatedKeys').innerHTML = keysHtml;
    document.getElementById('generateResult').style.display = 'block';
    
    // 显示实际生成数量
    const resultTitle = document.querySelector('#generateResult h3');
    resultTitle.textContent = `✅ 生成的卡密 (${keys.length}个)`;
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
        info: '#3498db',
        warning: '#f39c12'
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
        max-width: 400px;
        word-wrap: break-word;
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
    updateTokenStatus();
    checkTokenValid().then(valid => {
        if (valid) {
            loadExistingKeys();
        }
    });
});
