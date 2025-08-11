// 聊天系统相关功能
// 聊天功能实现
// 聊天系统相关变量

// 初始化语音控制开关
function initVoiceToggle() {
  // 检查是否已有语音开关
  if (document.getElementById('voiceToggle')) return;

  // 创建语音开关按钮
  const voiceToggle = document.createElement('button');
  voiceToggle.id = 'voiceToggle';
  voiceToggle.className = 'voice-btn';
  voiceToggle.innerHTML = '<i class="fas fa-volume-up"></i> 语音回复';
  voiceToggle.title = '开启/关闭语音回复';
  voiceToggle.dataset.enabled = 'true'; // 默认开启

  // 添加点击事件
  voiceToggle.addEventListener('click', function() {
    const isEnabled = this.dataset.enabled === 'true';
    if (isEnabled) {
      this.dataset.enabled = 'false';
      this.innerHTML = '<i class="fas fa-volume-mute"></i> 关闭语音';
      window.speechSynthesis.cancel(); // 立即停止当前播放
    } else {
      this.dataset.enabled = 'true';
      this.innerHTML = '<i class="fas fa-volume-up"></i> 语音回复';
    }
  });

  // 修改：确保.voice-controls元素存在，如果不存在则创建
  let voiceControls = document.querySelector('.voice-controls');
  if (!voiceControls) {
    // 如果不存在，创建一个新的容器
    voiceControls = document.createElement('div');
    voiceControls.className = 'voice-controls';
    // 添加到input-container
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) {
      inputContainer.appendChild(voiceControls);
    } else {
      console.error('未找到.input-container，无法添加语音开关');
      return;
    }
  }
  voiceControls.appendChild(voiceToggle);
}

// ====== 语音播报核心函数 ======
function speak(text, lang = 'zh-CN', rate = 1, pitch = 1) {
  // 检查语音开关状态
  const voiceToggle = document.getElementById('voiceToggle');
  if (voiceToggle && voiceToggle.dataset.enabled === 'false') {
    return;
  }

  if ('speechSynthesis' in window) {
    // 停止当前播放（避免多个重叠）
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; // 语言，例如 'zh-CN' 中文，'en-US' 英文
    utterance.rate = rate; // 语速 0.1 ~ 10
    utterance.pitch = pitch; // 音调 0 ~ 2

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('当前浏览器不支持语音合成');
  }
}

// 在所有Supabase调用前添加检查
async function handleLogin() {
  // 确保Supabase已加载
  if (!window.supabase) {
    console.error("Supabase not initialized");
    return;
  }

// 保存文档分析到本地数据库
async function saveDocumentAnalysis(docData) {
  return new Promise((resolve, reject) => {
    // 打开数据库，使用最新版本
    const request = window.indexedDB.open('DocumentAnalysisDB');

    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // 版本验证与自动升级逻辑
      if (db.version < 3) {
        console.warn(`数据库版本过低 (当前v${db.version}，需要v3或更高)`);
        db.close(); // 先关闭当前连接
        
        // 尝试升级数据库
        const upgradeRequest = window.indexedDB.open('DocumentAnalysisDB', 3);
        
        upgradeRequest.onupgradeneeded = function(e) {
          console.log(`数据库升级中: v${e.oldVersion} -> v${e.newVersion}`);
          const upgradedDb = e.target.result;
          
          // 确保对象存储和索引存在
          if (!upgradedDb.objectStoreNames.contains('documents')) {
            const store = upgradedDb.createObjectStore('documents', {
              keyPath: 'id',
              autoIncrement: true
            });
            store.createIndex('fileName', 'fileName', { unique: false });
            store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            store.createIndex('analysis', 'analysis.summary', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };
        
        upgradeRequest.onsuccess = function(e) {
          e.target.result.close();
          console.log('数据库升级完成，重新尝试保存');
          // 重新调用保存函数
          saveDocumentAnalysis(docData).then(resolve).catch(reject);
        };
        
        upgradeRequest.onerror = function(e) {
          reject(new Error(`数据库升级失败: ${e.target.error}`));
        };
        
        return;
      }

      try {
        // 创建读写事务
        const transaction = db.transaction('documents', 'readwrite');
        
        // 监听事务事件
        transaction.oncomplete = function() {
          console.log('事务处理完成');
        };
        
        transaction.onerror = function(e) {
          console.error('事务错误:', e.target.error);
          reject(new Error(`事务执行失败: ${e.target.error}`));
        };

        const store = transaction.objectStore('documents');
        
        // 添加时间戳和元数据
        const documentToSave = {
          ...docData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // 保存文档
        const putRequest = store.put(documentToSave);
        
        putRequest.onsuccess = () => {
          console.log(`文档 [${documentToSave.fileName}] 保存成功，ID: ${putRequest.result}`);
          resolve(putRequest.result); // 返回文档ID
        };

        putRequest.onerror = (e) => {
          console.error(`保存文档失败:`, e.target.error);
          reject(new Error(`保存文档失败: ${e.target.error}`));
        };
      } catch (err) {
        console.error('保存文档过程中发生异常:', err);
        reject(err);
      } finally {
        // 操作完成后关闭数据库
        setTimeout(() => {
          if (db && db.close) {
            db.close();
            console.log('数据库连接已关闭');
          }
        }, 0);
      }
    };

    request.onerror = function(event) {
      console.error('打开数据库失败:', event.target.error);
      reject(new Error(`打开数据库失败: ${event.target.error}`));
    };

    request.onblocked = function() {
      console.warn('数据库操作被阻止，可能有其他标签页打开了相同的数据库');
      reject(new Error('数据库操作被阻止，请关闭其他相关标签页后重试'));
    };
  });
}
  
  
}

// 从数据库加载用户头像
async function updateUserAvatarFromDB() {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      console.warn("未登录，无法加载头像");
      return;
    }

    const userId = authData.user.id;
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("获取用户头像失败:", userError);
      return;
    }

    // 没有上传头像时使用默认
    window.CHAT_CONFIG.USER_AVATAR =
      userInfo?.avatar_url ||
      'https://your-project-ref.supabase.co/storage/v1/object/public/avatars/Default%20avatar.jpg';

    console.log("已更新聊天头像:", window.CHAT_CONFIG.USER_AVATAR);

  } catch (err) {
    console.error("加载头像时出错:", err);
  }
}

// 增强版数据库初始化
function initDocumentDatabase() {
  const DB_NAME = 'DocumentAnalysisDB';
  const DB_VERSION = 3; // 版本号升级到3

  if (!window.indexedDB) {
    console.error('IndexedDB不可用，部分功能受限');
    appendMessage('bot', '⚠️ 当前浏览器不支持本地数据库功能');
    return;
  }

  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    const oldVersion = event.oldVersion;

    // 版本迁移逻辑
    if (oldVersion < 1) {
      // 初始版本创建
      const store = db.createObjectStore('documents', {
        keyPath: 'id',
        autoIncrement: true
      });
      store.createIndex('fileName', 'fileName', { unique: false });
    }

    if (oldVersion < 2) {
      // 版本2新增标签索引
      const store = event.target.transaction.objectStore('documents');
      store.createIndex('tags', 'tags', {
        unique: false,
        multiEntry: true
      });
    }

    if (oldVersion < 3) {
      // 版本3新增分析摘要索引
      const store = event.target.transaction.objectStore('documents');
      store.createIndex('analysis', 'analysis.summary', { unique: false });
      store.createIndex('createdAt', 'createdAt', { unique: false });
    }
  };

  request.onsuccess = function(event) {
    console.log(`数据库${DB_NAME} v${DB_VERSION} 就绪`);
    // 初始化后自动清理30天前的旧数据
    autoCleanupOldData(event.target.result);
  };

  request.onerror = function(event) {
    console.error('数据库初始化失败:', event.target.error);
    appendMessage('bot', '❌ 本地数据库初始化失败，请检查浏览器存储权限');
  };
}

// 自动清理旧数据
function autoCleanupOldData(db) {
  const transaction = db.transaction('documents', 'readwrite');
  const store = transaction.objectStore('documents');
  const threshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30天前

  const request = store.index('createdAt')
    .openCursor(IDBKeyRange.upperBound(threshold));

  request.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      console.log('清理过期文档:', cursor.value.fileName);
      cursor.delete();
      cursor.continue();
    }
  };
}

// 在应用启动时初始化
if (typeof initDocumentDatabase === 'function') {
  initDocumentDatabase();
} else {
  console.warn('数据库初始化函数未定义');
}

window.chatElements = {
  chat: null,
  input: null,
  sendBtn: null,
  historyBtn: null,
  historyModal: null,
  closeBtn: null,
  historyList: null,
  loader: null,
  pauseBtn: null,
  userInfoBtn: null,
  userInfoModal: null,
  closeUserInfoBtn: null,
  newPageBtn: null,
  newPageBtn2: null,
  newPageBtn3: null,
  newPageBtn4: null
};

// 聊天相关配置
window.CHAT_CONFIG = {
  USER_AVATAR: "https://your-project-ref.supabase.co/storage/v1/object/public/avatars/Default%20avatar.jpg",
  BOT_AVATAR: "https://i.ibb.co/sdFXFR26/favicon-2.jpg",
  API_KEY: "sk-22c0d14edbc44bb387114294798dfb63",
  API_URL: "https://api.deepseek.com/v1/chat/completions"
};

// 状态变量
// 全局聊天状态
window.chatState = {
  chatHistory: [],
  isLoading: false,
  pauseResponse: false,
  lastUserMessage: '',
  contextHistory: [], // 新增上下文存储
  lastFileContext: '' // 保存最近的文件分析结果
};

// 打字机效果函数
function typeWriterEffect(text, elementId, speed = 50) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`元素 ${elementId} 不存在`);
    return;
  }

  el.innerHTML = '';
  let i = 0;

  const timer = setInterval(() => {
    try {
      if (i < text.length) {
        el.innerHTML += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        window.chatElements.chat.scrollTop = window.chatElements.chat.scrollHeight;
      }
    } catch (error) {
      console.error('打字机效果出错:', error);
      clearInterval(timer);
      el.textContent = text;
    }
  }, speed);
}

// 辅助：安全转义 HTML（避免 innerHTML 的 XSS 问题） 
function escapeHtml(str) { 
  return str 
    .replace(/&/g, "&amp;") 
    .replace(/</g, "&lt;") 
    .replace(/>/g, "&gt;") 
    .replace(/"/g, "&quot;") 
    .replace(/'/g, "&#39;"); 
} 

// 添加消息
function appendMessage(sender, text) {
  // 创建消息容器
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender === 'user' ? 'user' : 'bot');
  msgDiv.style.position = 'relative';

  // 创建头像
  const avatarImg = document.createElement('img');
  avatarImg.classList.add('avatar');
  
  // 使用最新的用户头像
  const userAvatarUrl = window.userData?.avatar_url || window.CHAT_CONFIG.USER_AVATAR;
  
  avatarImg.src = sender === 'user'  
    ? userAvatarUrl 
    : window.CHAT_CONFIG.BOT_AVATAR;
    
  avatarImg.alt = sender === 'user' ? '你的头像' : '机器人头像';

  // 创建消息内容
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');
  contentDiv.id = 'message-' + Date.now();
  
  // 规范换行符（兼容 Windows / Mac / Linux）
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (sender === 'user') {
    // 只有确实包含换行符时，才把换行显式转换为 <br>
    if (normalized.includes('\n')) {
      const rawLines = normalized.split('\n');
      // 合并连续空行（若你想保留多个空行可以调整）
      const lines = [];
      let prevBlank = false;
      for (let line of rawLines) {
        const isBlank = line.trim().length === 0;
        if (isBlank) {
          if (!prevBlank) { // 只保留一个空行
            lines.push('');
            prevBlank = true;
          }
        } else {
          lines.push(line);
          prevBlank = false;
        }
      }
      // 转义每行并用 <br> 连接
      contentDiv.innerHTML = lines.map(l => escapeHtml(l)).join('<br>');
    } else {
      // 单行短文本 —— 使用 textContent，避免被当作 HTML，同时不会插入不必要的换行
      contentDiv.textContent = normalized;
    }
  } else {
    // 机器人消息：保留原始文本（若需要打字机效果可另处理）
    contentDiv.textContent = text;
  }

  // 组装消息元素
  msgDiv.appendChild(avatarImg);
  msgDiv.appendChild(contentDiv);

  // 撤回按钮只对用户消息开放
  if (sender === 'user') {
    // 创建一个容器来放置消息内容和撤回按钮
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('user-message-container');
    
    // 重新组织DOM结构
    msgDiv.removeChild(contentDiv);
    messageContainer.appendChild(contentDiv);
    msgDiv.appendChild(messageContainer);
    
    // 创建撤回按钮
    const recallBtn = document.createElement('button');
    recallBtn.className = 'recall-btn';
    recallBtn.textContent = '撤回';
    
    recallBtn.addEventListener('click', () => {
      // 获取下一条消息
      const nextMsg = msgDiv.nextElementSibling;
      
      // 如果下一条是机器人的回复，一并删除
      if (nextMsg && nextMsg.classList.contains('bot')) {
        window.chatElements.chat.removeChild(nextMsg);
        
        // 同时从聊天历史中删除机器人回复
        if (window.chatState.chatHistory.length > 0) {
          const lastItem = window.chatState.chatHistory[window.chatState.chatHistory.length - 1];
          if (lastItem && lastItem.answer) {
            lastItem.answer = '';
          }
        }
      }
      
      // 删除当前用户消息
      window.chatElements.chat.removeChild(msgDiv);
      
      // 从聊天历史中删除
      if (window.chatState.chatHistory.length > 0) {
        const lastItem = window.chatState.chatHistory[window.chatState.chatHistory.length - 1];
        if (lastItem && lastItem.answer === '') {
          window.chatState.chatHistory.pop();
          updateHistoryList();
        }
      }
    });
    
    messageContainer.appendChild(recallBtn);
  }

  // 添加到聊天区域
  window.chatElements.chat.appendChild(msgDiv);
  window.chatElements.chat.scrollTop = window.chatElements.chat.scrollHeight;

  // 处理机器人消息的打字机效果和语音播报
  if (sender === 'bot') {
    typeWriterEffect(text, contentDiv.id, 50);
    speak(text);
  }

  // 更新聊天历史
  if (sender === 'user') {
    const currentTime = new Date().toLocaleString();
    window.chatState.chatHistory.push({
      time: currentTime,
      question: text,
      answer: ''
    });
  } else if (sender === 'bot' && window.chatState.chatHistory.length > 0) {
    const currentText = text;
    setTimeout(() => {
      const lastItem = window.chatState.chatHistory[window.chatState.chatHistory.length - 1];
      if (lastItem) {
        lastItem.answer = currentText;
        updateHistoryList();
      }
    }, text.length * 50);
  }
}

// 保存对话记录到Supabase
async function saveChatRecord(userMessage, botMessage) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // 增强错误处理
    if (userError || !userData || !userData.user) {
      console.error('保存失败: 用户未登录或会话无效');
      return;
    }
    
    const { data, error } = await supabase
      .from('conversations') // 确保表名正确
      .insert([{
        user_id: userData.user.id,
        user_message: userMessage,
        assistant_message: botMessage,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('保存对话记录失败:', error);
    } else {
      console.log('对话记录已保存到数据库');
    }
  } catch (error) {
    console.error('保存对话记录时出错:', error);
  }
}

// 发送消息
async function sendMessage() {
  const text = window.chatElements.input.value.trim();
  if (!text) return;

  let context = '';

  // 如果有临时文件上下文 
  if (window.chatState.lastFileContext) {
    context += `\n\n【最近上传文件内容】\n${window.chatState.lastFileContext}`;
  }

  const fullUserContent = `${context}\n\n用户问题：${text}`;
  
  // 添加用户消息到上下文
  window.chatState.contextHistory.push({ role: "user", content: fullUserContent });
  
  // 添加系统提示
  window.chatState.contextHistory.push({ 
    role: "system", 
    content: "你是一个乐于助人的AI助手，使用中文回答用户问题" 
  });
  
  window.chatState.lastUserMessage = text;
  appendMessage('user', text);
  
  window.chatElements.input.value = '';
  window.chatElements.sendBtn.disabled = true;
  window.chatElements.pauseBtn.disabled = false;
  
  window.chatElements.loader.style.display = 'flex';
  window.chatState.isLoading = true;
  window.chatState.pauseResponse = false;
  window.chatElements.pauseBtn.style.backgroundColor = '#6c757d';
  window.chatElements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  
  try {
    const response = await fetch(window.CHAT_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.CHAT_CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: window.chatState.contextHistory, // 发送完整上下文
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`请求失败: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '无回复内容';
    
    // 添加助手回复到上下文
    window.chatState.contextHistory.push({ role: "assistant", content: reply });
    
    // 控制上下文长度（保留最近5轮对话）
    if (window.chatState.contextHistory.length > 10) {
      window.chatState.contextHistory.splice(0, 2);
    }
    
    appendMessage('bot', reply);
    await saveChatRecord(window.chatState.lastUserMessage, reply);
  } catch (error) {
    appendMessage('bot', `API请求错误: ${error.message}`);
    console.error('API请求错误:', error);
    await saveChatRecord(window.chatState.lastUserMessage, `API请求错误: ${error.message}`);
  } finally {
    window.chatElements.loader.style.display = 'none';
    window.chatElements.sendBtn.disabled = false;
    window.chatElements.input.focus();
    window.chatState.isLoading = false;
  }
}

// 更新历史记录列表
function updateHistoryList() {
  if (!window.chatElements.historyList) return;
  
  window.chatElements.historyList.innerHTML = '';
  
  if (window.chatState.chatHistory.length === 0) {
    window.chatElements.historyList.innerHTML = '<div class="history-item empty">暂无历史记录</div>';
    return;
  }
  
  window.chatState.chatHistory.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-time">${item.time}</div>
      <div class="history-question">${item.question.substring(0, 30)}${item.question.length > 30 ? '...' : ''}</div>
      <div class="history-answer">${item.answer.substring(0, 50)}${item.answer.length > 50 ? '...' : ''}</div>
    `;
    
    historyItem.addEventListener('click', () => {
      window.chatElements.chat.innerHTML = '';
      appendMessage(item.user_role || 'user', item.question);
      appendMessage(item.assistant_role || 'bot', item.answer);
    });
    
    window.chatElements.historyList.appendChild(historyItem);
  });
}



// 事件处理函数
function handleBodyClick(e) {
  if (e.target === window.chatElements.historyBtn) {
    window.chatElements.historyModal.style.display = 'block';
  } else if (e.target === window.chatElements.closeBtn) {
    window.chatElements.historyModal.style.display = 'none';
  } else if (e.target === window.chatElements.closeUserInfoBtn) {
    window.chatElements.userInfoModal.style.display = 'none';
  } else if (e.target === window.chatElements.userInfoBtn) {
    if (window.showUserInfo) window.showUserInfo();
  } else if (e.target === window.chatElements.newPageBtn || e.target.parentNode === window.chatElements.newPageBtn) {
    window.open('translator.html', '_blank');
  } else if (e.target === window.chatElements.newPageBtn2 || e.target.parentNode === window.chatElements.newPageBtn2) {
    window.open('blank.html', '_blank');
  } else if (e.target === window.chatElements.newPageBtn3 || e.target.parentNode === window.chatElements.newPageBtn3) {
    window.open('blank1.html', '_blank');
  } else if (e.target === window.chatElements.newPageBtn4 || e.target.parentNode === window.chatElements.newPageBtn4) {
    window.open('blank2.html', '_blank');
  } else if (e.target === window.chatElements.historyModal || e.target === window.chatElements.userInfoModal) {
    window.chatElements.historyModal.style.display = 'none';
    window.chatElements.userInfoModal.style.display = 'none';
  }
}

// 初始化标志
window.chatInitFlags = {
  chatEventsInitialized: false
};

// 文档上传分析功能
function initFileUpload() {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFile);
  }
}

// 修复文档解析逻辑（handleFile函数）
async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 添加文件类型验证
  const validTypes = ['text/plain', 'application/pdf', 
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!validTypes.includes(file.type)) {
    alert('仅支持 TXT、PDF 和 DOCX 格式');
    return;
  }

  // +++ 新增: 在分析前发送一条用户消息 +++
  const fileName = file.name;
  const uploadMessage = `请分析文件：${fileName}`;
  
  // 使用appendMessage发送用户消息，但不保存到历史记录
  appendUploadMessage(uploadMessage);

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      let text = e.target.result;
      
      // 特殊格式处理
      if (file.type === 'application/pdf') {
        text = await parsePDF(file); // 专用PDF解析函数
      } else if (file.type.includes('openxml')) {
        text = await parseDOCX(file); // 专用DOCX解析函数
      }
      
      // 存储解析结果到临时上下文
      window.chatState.lastFileContext = text.substring(0, 2000); // 限制长度
      
      // 始终使用单文件模式
      await analyzeText(text, fileName, 'single');
      
    } catch (error) {
      console.error('文件处理失败:', error);
      appendMessage('bot', `❌ 文件解析失败: ${error.message}`);
    }
  };
  reader.readAsArrayBuffer(file); // 统一使用ArrayBuffer读取
}

// +++ 新增函数: 专门处理文件上传消息 +++
function appendUploadMessage(text) {
  // 创建消息容器
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', 'user');
  msgDiv.style.position = 'relative';

  // 创建头像
  const avatarImg = document.createElement('img');
  avatarImg.classList.add('avatar');
  
  // 使用最新的用户头像
  const userAvatarUrl = window.userData?.avatar_url || window.CHAT_CONFIG.USER_AVATAR;
  
  avatarImg.src = userAvatarUrl;
  avatarImg.alt = '你的头像';

  // 创建消息内容
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');
  contentDiv.id = 'message-' + Date.now();
  contentDiv.textContent = text;

  // 组装消息元素
  msgDiv.appendChild(avatarImg);
  msgDiv.appendChild(contentDiv);

  // 添加到聊天区域
  window.chatElements.chat.appendChild(msgDiv);
  window.chatElements.chat.scrollTop = window.chatElements.chat.scrollHeight;
  
  // +++ 注意: 不更新聊天历史 +++
}


async function analyzeText(text, fileName, mode) {
  const analysisPrompt = `请按以下结构化分析文档：
1. 核心主题（不超过20字）
2. 关键论点（3-5个要点）
3. 潜在应用场景
4. 相关风险提示

文档内容：\n${text}`;
  
  try {
    const aiResponse = await fetch(window.CHAT_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.CHAT_CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个专业的文档分析助手，请用中文详细分析用户提供的文件内容，并给出主要观点、结构、重要信息和潜在问题。" },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API 请求失败: HTTP ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiAnalysis = aiData.choices?.[0]?.message?.content || 'AI未返回任何分析结果';

    appendMessage('bot', `文件 ${fileName} 分析结果:\n${aiAnalysis}`);
    
    // 保存分析结果到全局变量
    window.chatState.lastFileContext = text;

    // 单文件模式：保存到 document_analysis 表
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('用户未登录，无法保存文档分析到云端');
        // 即使未登录，也应提示用户并保存到本地
        appendMessage('bot', '⚠️ 未登录，文档仅保存到本地');
      } else {
        // 保存到 document_analysis 表
        const { error } = await supabase
          .from('document_analysis')
          .insert([{
            user_id: userData.user.id,
            file_name: fileName,
            file_content: text,
            analysis_result: aiAnalysis,
            created_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.error('文档分析保存失败:', error);
          appendMessage('bot', `❌ 文档分析保存失败: ${error.message}`);
        } else {
          console.log('文档分析已保存到云端');
        }
      }
    } catch (error) {
      console.error('文档保存总失败:', error);
      appendMessage('bot', `❌ 文档保存失败: ${error.message}`);
    }
  } catch (err) {
    console.error('AI分析出错:', err);
    appendMessage('bot', `AI分析出错: ${err.message}`);
  }
}

// 语音识别功能
function initVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const startVoiceBtn = document.getElementById('startVoice');

  if (SpeechRecognition && startVoiceBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    // 添加标志跟踪识别是否成功
    let recognitionSuccessful = false;

    startVoiceBtn.addEventListener('click', () => {
      try {
        recognition.start();
        recognitionSuccessful = false; // 重置标志
        startVoiceBtn.style.backgroundColor = '#ffc107';
        startVoiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        startVoiceBtn.setAttribute('title', '正在录音，点击停止');
      } catch (error) {
        console.error('语音识别启动失败:', error);
        startVoiceBtn.style.backgroundColor = '#2575fc';
        startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        startVoiceBtn.setAttribute('title', '开始录音');
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      window.chatElements.input.value = transcript;
      recognitionSuccessful = true; // 标记识别成功
      startVoiceBtn.style.backgroundColor = '#2575fc';
      startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      startVoiceBtn.setAttribute('title', '开始录音');
    };

    recognition.onerror = async (event) => {
      console.error('语音识别错误:', event.error);
      startVoiceBtn.style.backgroundColor = '#2575fc';
      startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      startVoiceBtn.setAttribute('title', '开始录音');

      // 只有在识别未成功时才显示错误信息
      if (!recognitionSuccessful) {
        let errorMessage = '语音识别出错';
        if (event.error === 'not-allowed') {
          errorMessage = '需要授予麦克风权限才能使用语音识别';
        } else if (event.error === 'no-speech') {
          errorMessage = '未检测到语音';
        }
        appendMessage('bot', errorMessage);
        await saveChatRecord('', errorMessage, 'system', 'system');
      }
    };

    recognition.onend = () => {
      startVoiceBtn.style.backgroundColor = '#2575fc';
      startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      startVoiceBtn.setAttribute('title', '开始录音');
      // 无需重置标志，下次点击时会重置
    };
  } else {
    if (startVoiceBtn) {
      startVoiceBtn.style.backgroundColor = '#6c757d';
      startVoiceBtn.setAttribute('title', '您的浏览器不支持语音识别');
      startVoiceBtn.addEventListener('click', async () => {
        appendMessage('bot', '您的浏览器不支持语音识别功能');
        await saveChatRecord('', '您的浏览器不支持语音识别功能', 'system', 'system');
      });
    }
  }
}

// 初始化聊天事件
function initChatEvents() {
  if (window.chatInitFlags.chatEventsInitialized) return;

  window.chatElements.chat = document.getElementById('chat');
  window.chatElements.input = document.getElementById('input');
  window.chatElements.sendBtn = document.getElementById('sendBtn');
  window.chatElements.historyBtn = document.getElementById('historyBtn');
  window.chatElements.historyModal = document.getElementById('historyModal');
  window.chatElements.closeBtn = window.chatElements.historyModal?.querySelector('.close-btn');
  window.chatElements.historyList = document.getElementById('historyList');
  window.chatElements.loader = document.getElementById('loader');
  window.chatElements.pauseBtn = document.getElementById('pauseBtn');
  window.chatElements.userInfoBtn = document.getElementById('userInfoBtn');
  window.chatElements.userInfoModal = document.getElementById('userInfoModal');
  window.chatElements.closeUserInfoBtn = window.chatElements.userInfoModal?.querySelector('.close-user-info');
  window.chatElements.newPageBtn = document.getElementById('newPageBtn');
  window.chatElements.newPageBtn2 = document.getElementById('newPageBtn2');
  window.chatElements.newPageBtn3 = document.getElementById('newPageBtn3');
  window.chatElements.newPageBtn4 = document.getElementById('newPageBtn4');

  // 添加语音识别初始化
  initVoiceRecognition();
  initVoiceToggle(); // 添加语音开关初始化

  if (window.chatElements.sendBtn) {
    window.chatElements.sendBtn.addEventListener('click', sendMessage);
  }
  
  if (window.chatElements.input) {
    window.chatElements.input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  if (window.chatElements.pauseBtn) {
    window.chatElements.pauseBtn.addEventListener('click', function() {
      window.chatState.pauseResponse = !window.chatState.pauseResponse;
      if (window.chatState.pauseResponse) {
        this.style.backgroundColor = '#ffc107';
        this.setAttribute('title', '继续响应');
        this.innerHTML = '<i class="fas fa-play"></i>';
      } else {
        this.style.backgroundColor = '#6c757d';
        this.setAttribute('title', '暂停响应');
        this.innerHTML = '<i class="fas fa-pause"></i>';
      }
    });
  }
  
  initFileUpload();
  document.addEventListener('click', handleBodyClick);
  addResetButton(); // 添加重置按钮
  window.chatInitFlags.chatEventsInitialized = true;
}

// 清理聊天事件
function removeChatEvents() {
  document.body.removeEventListener('click', handleBodyClick);
  if (window.chatElements.sendBtn) window.chatElements.sendBtn.removeEventListener('click', sendMessage);
  if (window.chatElements.input) window.chatElements.input.removeEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  window.chatInitFlags.chatEventsInitialized = false;
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatEvents);
} else {
  initChatEvents();
}

// 重置对话上下文
async function resetContext() {
  window.chatState.contextHistory = [];
  appendMessage('bot', '对话上下文已重置，请问有什么可以帮助您的？');
  await saveChatRecord('', '对话上下文已重置，请问有什么可以帮助您的？', 'system', 'system');
}

// 在聊天界面添加重置按钮
function addResetButton() {
  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetContextBtn';
  resetBtn.innerHTML = '<i class="fas fa-eraser"></i>';
  resetBtn.title = '重置上下文';
  resetBtn.addEventListener('click', resetContext);
  
  // 添加到输入区域
  document.querySelector('.input-container').prepend(resetBtn);
}

// 向量计算核心
const vector = {
  dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  },
  norm(a) {
    return Math.sqrt(this.dot(a, a));
  },
  cosineSim(a, b) {
    return this.dot(a, b) / (this.norm(a) * this.norm(b) + 1e-12);
  }
};



// 文档处理
const documentProcessor = {
  async parse(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'txt') return await file.text();
    if (ext === 'docx') {
      const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return res.value;
    }
    if (ext === 'pdf') {
      const pdf = await pdfjsLib.getDocument(new Uint8Array(await file.arrayBuffer())).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        text += (await page.getTextContent()).items.map(t => t.str).join(' ') + '\n';
      }
      return text;
    }
    throw new Error(`不支持的格式: ${ext}`);
  },
  chunk(text, size = 800, overlap = 200) {
    const chunks = [], cleaned = text.replace(/\s+/g, ' ').trim();
    for (let i = 0; i < cleaned.length; i += size - overlap) {
      const chunk = cleaned.slice(i, i + size).trim();
      if (chunk) chunks.push(chunk);
    }
    return chunks;
  }
};

// 添加PDF解析函数
async function parsePDF(file) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n\n';
  }
  return text;
}

// 添加DOCX解析函数
async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// 向量与检索服务
const embeddingService = {
  async get(text, apiKey) {
    const res = await fetch('https://api.deepseek.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
    });
    if (!res.ok) throw new Error(`Embedding失败: ${await res.text()}`);
    return (await res.json()).data?.[0]?.embedding;
  },
  
  async search(query, apiKey, topK = 4) {
    const kb = kbStorage.load();
    if (!kb.chunks.length) return [];
    
    const qEmb = await this.get(query, apiKey);
    return kb.chunks
      .map(c => ({ ...c, score: vector.cosineSim(qEmb, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
};
// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 浏览器兼容
window.appendMessage = appendMessage;
window.initChatEvents = initChatEvents;
window.removeChatEvents = removeChatEvents;
window.initVoiceRecognition = initVoiceRecognition;
window.resetContext = resetContext;
window.addResetButton = addResetButton;

// 动态渲染历史记录
async function renderHistoryRecords(keyword = '') {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  
  historyList.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      historyList.innerHTML = '<div class="history-item empty">请先登录查看历史记录</div>';
      return;
    }
    
    const user = userData.user;
    
    const { data: records, error } = await supabase
      .from('conversations')
      .select(`
        id, 
        created_at, 
        user_message, 
        assistant_message, 
        user:user_id (email)  // 关联用户信息 
      `)
      .eq('user_id', user.id)
      .or(`user_message.ilike.%${keyword}%,assistant_message.ilike.%${keyword}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取历史记录失败:', error);
      historyList.innerHTML = '<div class="history-item empty">获取历史记录失败</div>';
      return;
    }
    
    if (!records || records.length === 0) {
      historyList.innerHTML = '<div class="history-item empty">暂无历史记录</div>';
      return;
    }
    
    let filteredRecords = records;
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredRecords = records.filter(record => 
        // 统一处理空消息的情况
        (record.user_message || '').toLowerCase().includes(lowerKeyword) ||
        (record.assistant_message || '').toLowerCase().includes(lowerKeyword)
      );
    }
    
    if (filteredRecords.length === 0) {
      historyList.innerHTML = '<div class="history-item empty">未找到匹配的记录</div>';
      return;
    }
    
    historyList.innerHTML = '';
    
    filteredRecords.forEach(record => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      const date = new Date(record.created_at).toLocaleString('zh-CN');
      
      historyItem.innerHTML = `
        <div><strong>用户：</strong>${record.user_message || ''}</div>
        <div><strong>助理：</strong>${record.assistant_message || ''}</div>
        <div class="history-time">时间：${date}</div>
      `;
      
      historyItem.addEventListener('click', () => {
        const chatContainer = window.chatElements.chat;
        if (chatContainer) {
          chatContainer.innerHTML = '';
          if (record.user_message) appendMessage('user', record.user_message);
          if (record.assistant_message) appendMessage('bot', record.assistant_message);
          if (window.chatElements.historyModal) {
            window.chatElements.historyModal.style.display = 'none';
          }
        }
      });
      
      historyList.appendChild(historyItem);
    });
  } catch (error) {
    console.error('渲染历史记录时出错:', error);
    historyList.innerHTML = '<div class="history-item empty">加载历史记录失败</div>';
  }
}

// 刷新历史记录
function refreshHistory() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    renderHistoryRecords(searchInput.value);
  } else {
    renderHistoryRecords();
  }
}

// 初始化历史记录侧边栏
function initHistorySidebar() {
  document.getElementById('historyBtn').style.display = 'none';
  loadHistoryToSidebar();
  
  document.getElementById('searchInputSidebar').addEventListener('input', function(e) {
    loadHistoryToSidebar(e.target.value);
  });
  
  document.getElementById('refreshHistoryBtnSidebar').addEventListener('click', function() {
    loadHistoryToSidebar();
  });
}

// 加载历史记录到侧边栏
async function loadHistoryToSidebar(keyword = '') {
  const historyList = document.getElementById('historyListSidebar');
  if (!historyList) return;
  
  historyList.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      historyList.innerHTML = '<div class="history-item empty">请先登录查看历史记录</div>';
      return;
    }
    
    const user = userData.user;
    
    const { data: records, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取历史记录失败:', error);
      historyList.innerHTML = '<div class="history-item empty">获取历史记录失败</div>';
      return;
    }
    
    if (!records || records.length === 0) {
      historyList.innerHTML = '<div class="history-item empty">暂无历史记录</div>';
      return;
    }
    
    // 修复1：使用正确的过滤和分组逻辑
    let filteredRecords = records;
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      // 修改过滤逻辑，移除强制角色校验
      filteredRecords = records.filter(record => {
        // 统一处理空消息的情况
        const matchesKeyword = (
          (record.user_message || '').toLowerCase().includes(lowerKeyword) ||
          (record.assistant_message || '').toLowerCase().includes(lowerKeyword)
        );
        return matchesKeyword; // 只需要关键词匹配
      });
    }
    
    if (filteredRecords.length === 0) {
      historyList.innerHTML = '<div class="history-item empty">未找到匹配的记录</div>';
      return;
    }
    
    // 修复2：清空列表
    historyList.innerHTML = '';
    
    // 修复3：简化搜索结果显示逻辑
    if (keyword) {
      // 搜索模式：直接显示匹配项
      const searchHeader = document.createElement('div');
      searchHeader.className = 'search-header';
      searchHeader.innerHTML = `<i class="fas fa-search"></i> 搜索结果 (${filteredRecords.length}条)`;
      historyList.appendChild(searchHeader);
      
      filteredRecords.forEach(record => {
        const recordItem = document.createElement('div');
        recordItem.className = 'search-record-item';
        
        // 格式化日期时间
        const date = new Date(record.created_at);
        const formattedDate = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        
        // 高亮关键词的函数
        const highlightKeywords = (text) => {
          if (!text || !keyword) return text;
          const regex = new RegExp(keyword, 'gi');
          return text.replace(regex, match =>
            `<span class="highlight">${match}</span>`
          );
        };
        
        // 构建完整对话内容
        const userMsg = record.user_message ?
          `<div class="conversation-line"><strong>用户：</strong>${highlightKeywords(record.user_message)}</div>` : '';
          
        const assistantMsg = record.assistant_message ?
          `<div class="conversation-line"><strong>助理：</strong>${highlightKeywords(record.assistant_message)}</div>` : '';
        
        // 添加角色标识到DOM元素
        recordItem.dataset.userRole = record.user_role || 'user'; // 用户消息
        recordItem.dataset.botRole = record.assistant_role || 'bot'; // 机器人消息
        
        recordItem.innerHTML = `
          <div class="conversation-block">
            <div class="roles-indicator" style="display:none;">
              用户角色: ${record.user_role || 'user'}, 助理角色: ${record.assistant_role || 'bot'}
            </div>
            ${userMsg}
            ${assistantMsg}
            <div class="conversation-time">
              ${formattedDate} ${formattedTime}
            </div>
          </div>
        `;
        
        // 修改点击事件处理
        recordItem.addEventListener('click', function(e) {
          e.stopPropagation();
          // 传递完整记录
          showSingleConversation(record);
        });
        
        historyList.appendChild(recordItem);
      });
    } else {
      // 修复1：使用本地日期格式处理
      const groupedByDate = {};
      filteredRecords.forEach(record => {
        // 使用本地日期作为分组键
        const dateObj = new Date(record.created_at);
        const localYear = dateObj.getFullYear();
        const localMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const localDate = dateObj.getDate().toString().padStart(2, '0');
        const dateKey = `${localYear}-${localMonth}-${localDate}`; // 本地日期作为分组键
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(record);
      });
      
      // 修复2：正确创建分组项
      Object.keys(groupedByDate).forEach(dateKey => {
        const dateGroup = groupedByDate[dateKey];
        const dateItem = document.createElement('div');
        dateItem.className = 'history-date-item';
        dateItem.dataset.date = dateKey;
        
        // 日期显示逻辑保持不变，因为dateKey现在已经是本地日期
        const dateParts = dateKey.split('-');
        const formattedDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`;
        
        // 获取第一条消息作为摘要
        const firstMessage = dateGroup[0].user_message?.substring(0, 40) || 
                             dateGroup[0].assistant_message?.substring(0, 40) || 
                             '无消息内容';
        const displayMessage = firstMessage.length > 40 ? firstMessage + '...' : firstMessage;
        
        dateItem.innerHTML = `
          <div class="date-header">
            <strong>${formattedDate}</strong>
            <span class="record-count">${dateGroup.length}条记录</span>
          </div>
          <div class="date-summary">${displayMessage}</div>
        `;
        
        // 修复3：确保点击事件绑定正确
        dateItem.addEventListener('click', function(e) {
          e.stopPropagation();
          document.querySelectorAll('.history-date-item').forEach(i => 
            i.classList.remove('selected'));
          this.classList.add('selected');
          loadDailyHistory(dateKey);
        });
        
        historyList.appendChild(dateItem);
      });
    }
  } catch (error) {
    console.error('渲染历史记录时出错:', error);
    historyList.innerHTML = '<div class="history-item empty">加载历史记录失败</div>';
  }
}

// 加载某日的完整历史记录
async function loadDailyHistory(dateKey) {
  const chatBox = document.getElementById('chat');
  if (!chatBox) return;
  
  chatBox.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      chatBox.innerHTML = '<div class="message bot"><div class="message-content">请先登录查看历史记录</div></div>';
      return;
    }
    
    const user = userData.user;
    // 直接用本地时间范围查
    const startLocal = new Date(dateKey + 'T00:00:00'); // 本地 0 点
    const endLocal = new Date(startLocal.getTime() + 24 * 60 * 60 * 1000);
    
    const { data: records, error } = await supabase
      .from('conversations')
      .select(`
        id, 
        created_at, 
        user_message, 
        assistant_message
      `)
      .eq('user_id', user.id)
      .gte('created_at', startLocal.toISOString()) // 用本地的 ISO
      .lt('created_at', endLocal.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('获取历史记录失败:', error);
      chatBox.innerHTML = '<div class="message bot"><div class="message-content">获取历史记录失败</div></div>';
      return;
    }
    
    if (!records || records.length === 0) {
      chatBox.innerHTML = '<div class="message bot"><div class="message-content">当日无历史记录</div></div>';
      return;
    }
    
    chatBox.innerHTML = '';
    const dateHeader = document.createElement('div');
    dateHeader.className = 'chat-date-header';
    const date = new Date(dateKey);
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 聊天记录`;
    dateHeader.textContent = formattedDate;
    chatBox.appendChild(dateHeader);
    
    async function loadRecordsSequentially(records) {
      for (const record of records) {
        if (record.user_message) {
          appendMessage(record.user_role || 'user', record.user_message);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        if (record.assistant_message) {
          appendMessage(record.assistant_role || 'bot', record.assistant_message);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    await loadRecordsSequentially(records);
  } catch (error) {
    console.error('加载每日历史记录时出错:', error);
    chatBox.innerHTML = '<div class="message bot"><div class="message-content">加载历史记录失败</div></div>';
  }
}

// 显示单条对话 
function showSingleConversation(record) { 
  const chatBox = document.getElementById('chat'); 
  if (!chatBox || !record) return; // 增加参数校验 
  
  chatBox.innerHTML = ''; 
  
  // 严格校验角色信息，避免异常值 
  const validRoles = ['user', 'bot', 'system']; 
  const userRole = validRoles.includes(record.user_role) ? record.user_role : 'user'; 
  const assistantRole = validRoles.includes(record.assistant_role) ? record.assistant_role : 'bot'; 
  
  // 增加日志便于调试 
  console.log('渲染对话角色:', { 
    userRole, 
    assistantRole, 
    recordId: record.id 
  }); 
  
  // 确保消息存在再渲染，避免空消息导致的角色混淆 
  if (record.user_message) { 
    appendMessage(userRole, record.user_message); 
  }
  
  // 延迟渲染助手消息，避免DOM渲染顺序问题 
  if (record.assistant_message) { 
    setTimeout(() => { 
      appendMessage(assistantRole, record.assistant_message); 
    }, 100); 
  }
  
  // 同步更新上下文历史，确保角色一致性 
  window.chatState.contextHistory = [ 
    { role: "system", content: "你是一个乐于助人的AI助手，使用中文回答用户问题" }, 
    { role: userRole, content: record.user_message || "" }, 
    { role: assistantRole, content: record.assistant_message || "" } 
  ]; 
}

// 在页面加载完成后初始化侧边栏
document.addEventListener('DOMContentLoaded', async function() {
  if (document.getElementById('chatPage')) {
    await updateUserAvatarFromDB();
    initHistorySidebar();
  }
});

// 用户信息函数
window.showUserInfo = async function() {
  if (window.chatElements.userInfoModal) {
    await renderUserInfo();
    window.chatElements.userInfoModal.style.display = 'block';
  }
};

// 添加全局更新函数 
window.updateChatAvatar = function(newAvatarUrl ) { 
  // 更新所有用户消息的头像 
  document.querySelectorAll('.user .avatar').forEach(avatar =>  { 
    avatar.src  = newAvatarUrl; 
  }); 
  
  // 更新全局用户数据 
  if (window.userData ) { 
    window.userData.avatar_url  = newAvatarUrl; 
  } 
};

// 将 updateUserAvatarFromDB 函数添加到全局 window 对象
window.updateUserAvatarFromDB = updateUserAvatarFromDB;

// 重置聊天状态
function resetChatState() {
  const chatBox = document.getElementById('chat');
  if (!chatBox) return;
  
  chatBox.innerHTML = '';
  appendMessage('bot', '您好！请问有什么可以帮助您的吗？您可以具体一点吗？比如："TT"是什么意思？"*"需要帮助解决某个问题？"，还是随便打个招呼？随时告诉我，我会尽力帮你！');
  
  document.querySelectorAll('.history-date-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  window.chatState.chatHistory = [];
}

// 初始化返回聊天按钮
function initBackToChatButton() {
  if (document.getElementById('backToChatBtn')) return;

  const backBtn = document.createElement('button');
  backBtn.id = 'backToChatBtn';
  backBtn.className = 'btn back-to-chat-btn';
  backBtn.innerHTML = '<i class="fas fa-comments"></i> 返回聊天';
  backBtn.title = '退出历史记录，返回正常聊天状态';

  backBtn.addEventListener('click', resetChatState);

  // 修改按钮添加位置，添加到.input-container中，放在输入框左边
  const inputContainer = document.querySelector('.input-container');
  if (inputContainer) {
    // 在输入框前添加返回按钮
    const textarea = document.getElementById('input');
    if (textarea) {
      inputContainer.insertBefore(backBtn, textarea);
    } else {
      inputContainer.appendChild(backBtn);
    }
  } else {
    console.error('未找到输入容器，无法添加返回按钮');
  }
}

// 在页面加载完成后初始化返回按钮
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('chatPage')) {
    initBackToChatButton();
  }
});