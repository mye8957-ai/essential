// 配置信息 - 已针对你的账户配置
const CONFIG = {
    repoOwner: 'mye8957-ai',
    repoName: 'essential',
    filePath: 'keys.json',
    branch: 'main'
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

// 获取keys.json文件内容
async function getKeysFile(githubToken) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
    
    console.log('正在获取文件:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const data = await response.json();
        // Base64解码并解析JSON
        const content = atob(data.content.replace(/\s/g, ''));
        const jsonData = JSON.parse(content);
        jsonData._sha = data.sha; // 保存SHA用于更新
        console.log('获取文件成功，SHA:', data.sha);
        return jsonData;
    } catch (error) {
        console.error('获取文件失败:', error);
        return null;
    }
}

// 更新keys.json文件
async function updateKeysFile(githubToken, newData, sha) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
    
    console.log('正在更新文件:', url);
    
    // 转换为JSON字符串并Base64编码
    const content = JSON.stringify(newData, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));
    
    const body = {
        message: `添加新卡密 - ${new Date().toLocaleString()}`,
        content: contentBase64,
        branch: CONFIG.branch,
        sha: sha
    };
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '更新失败');
        }
        
        console.log('文件更新成功');
        return true;
    } catch (error) {
        console.error('更新文件失败:', error);
        return false;
    }
}

// 验证GitHub Token
async function validateToken(token) {
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

// 主生成函数
async function generateKeys() {
    const keyType = document.getElementById('keyType').value;
    const keyAmount = parseInt(document.getElementById('keyAmount').value);
    const githubToken = document.getElementById('githubToken').value.trim();
    
    if (!githubToken) {
        alert('⚠️ 请输入GitHub Personal Token');
        return;
    }
    
    if (keyAmount < 1 || keyAmount > 20) {
        alert('⚠️ 生成数量请在1-20之间');
        return;
    }
    
    // 显示加载中
    const submitButton = document.querySelector('button');
    const originalText = submitButton.textContent;
    submitButton.textContent = '⏳ 生成中...';
    submitButton.disabled = true;
    
    try {
        // 验证Token
        const isValidToken = await validateToken(githubToken);
        if (!isValidToken) {
            alert('❌ Token无效，请检查是否正确');
            return;
        }
        
        console.log('Token验证通过，开始获取文件...');
        
        // 获取当前文件内容和SHA
        const currentFile = await getKeysFile(githubToken);
        if (!currentFile) {
            alert('❌ 无法获取keys.json文件\n\n可能原因：\n• Token权限不足(需要repo权限)\n• 仓库 mye8957-ai/essential 不存在\n• keys.json文件不存在\n• 网络连接问题');
            return;
        }
        
        // 初始化keys对象如果不存在
        if (!currentFile.keys) {
            currentFile.keys = {};
        }
        
        console.log('开始生成卡密，数量:', keyAmount);
        
        // 生成新卡密
        const newKeys = [];
        for (let i = 0; i < keyAmount; i++) {
            let key;
            let attempts = 0;
            
            // 确保卡密不重复
            do {
                key = generateRandomKey();
                attempts++;
                if (attempts > 10) {
                    throw new Error('生成唯一卡密失败，请重试');
                }
            } while (currentFile.keys[key]);
            
            newKeys.push(key);
            
            // 添加到数据中
            currentFile.keys[key] = {
                used: false,
                created_at: new Date().toISOString().split('T')[0],
                type: keyType,
                used_by: null,
                used_at: null,
                created_time: new Date().toISOString()
            };
            
            console.log('生成卡密:', key);
        }
        
        // 更新文件
        console.log('开始更新文件...');
        const success = await updateKeysFile(githubToken, currentFile, currentFile._sha);
        
        if (success) {
            displayGeneratedKeys(newKeys, keyType);
            // 清空Token输入框
            document.getElementById('githubToken').value = '';
            console.log('卡密生成完成');
        } else {
            alert('❌ 生成卡密失败\n\n可能原因：\n• Token没有写入权限\n• 网络连接问题\n• 仓库访问限制');
        }
    } catch (error) {
        console.error('生成过程错误:', error);
        alert(`❌ 生成失败: ${error.message}`);
    } finally {
        // 恢复按钮状态
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// 显示生成的卡密
function displayGeneratedKeys(keys, keyType) {
    const keysHtml = keys.map(key => 
        `<div class="key-display" onclick="copySingleKey('${key}')" title="点击复制">
            <span class="key-text">${key}</span>
            <span class="copy-hint">📋</span>
        </div>`
    ).join('');
    
    const typeNames = {
        '1day': '1天卡密',
        '7day': '7天卡密', 
        '30day': '30天卡密',
        'permanent': '永久卡密'
    };
    
    document.getElementById('generatedKeys').innerHTML = `
        <div class="result-info">
            <p><strong>🎯 类型:</strong> ${typeNames[keyType] || keyType}</p>
            <p><strong>📊 数量:</strong> ${keys.length} 个</p>
            <p><strong>⏰ 生成时间:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="keys-list">${keysHtml}</div>
    `;
    document.getElementById('result').style.display = 'block';
    
    // 滚动到结果区域
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// 复制单个卡密
function copySingleKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        showTempMessage(`✅ 已复制: ${key}`);
    }).catch(err => {
        // 备用复制方法
        const textArea = document.createElement('textarea');
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showTempMessage(`✅ 已复制: ${key}`);
    });
}

// 复制所有卡密
function copyAllKeys() {
    const keyElements = document.querySelectorAll('.key-text');
    const keysText = Array.from(keyElements).map(el => el.textContent).join('\n');
    
    navigator.clipboard.writeText(keysText).then(() => {
        showTempMessage('✅ 所有卡密已复制到剪贴板！');
    }).catch(err => {
        // 备用复制方法
        const textArea = document.createElement('textarea');
        textArea.value = keysText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showTempMessage('✅ 所有卡密已复制到剪贴板！');
    });
}

// 显示临时消息
function showTempMessage(message) {
    // 移除已存在的消息
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.className = 'temp-message';
    tempDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: fadeIn 0.3s ease-in;
    `;
    tempDiv.textContent = message;
    document.body.appendChild(tempDiv);
    
    setTimeout(() => {
        if (tempDiv.parentNode) {
            tempDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (tempDiv.parentNode) {
                    tempDiv.remove();
                }
            }, 300);
        }
    }, 2000);
}

// 显示Token帮助信息
function showTokenHelp() {
    alert(`🔑 如何获取GitHub Personal Token：

1. 登录GitHub网站
2. 点击右上角头像 → Settings
3. 左侧菜单 → Developer settings
4. 选择 "Personal access tokens" → "Tokens (classic)"
5. 点击 "Generate new token"
6. 设置备注名称 (如: "卡密系统")
7. 过期时间选择 "No expiration"
8. 勾选 "repo" 权限（最重要！）
9. 点击 "Generate token"
10. 复制生成的Token到此输入框

⚠️ 重要提示：
• 妥善保管Token，不要泄露！
• Token只显示一次，请立即复制
• 需要完整的 repo 权限`);
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('卡密生成器已加载');
    console.log('配置信息:', CONFIG);
    
    // 添加Token帮助链接
    const tokenInput = document.getElementById('githubToken');
    const helpLink = document.createElement('a');
    helpLink.href = '#';
    helpLink.onclick = showTokenHelp;
    helpLink.textContent = '如何获取Token？';
    helpLink.style.cssText = `
        font-size: 12px; 
        color: #007cba; 
        text-decoration: none;
        margin-top: 5px;
        display: inline-block;
    `;
    
    tokenInput.parentNode.appendChild(document.createElement('br'));
    tokenInput.parentNode.appendChild(helpLink);
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        .key-display {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .key-display:hover {
            background-color: #f0f8ff;
            transform: translateX(5px);
        }
        .copy-hint {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .key-display:hover .copy-hint {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
});

// 导出函数供HTML调用
window.generateKeys = generateKeys;
window.copyAllKeys = copyAllKeys;
window.copySingleKey = copySingleKey;
window.showTokenHelp = showTokenHelp;
