// 聊天系统相关功能

// 导入账号系统中的变量和函数
import { currentUserAccount, userData } from './account.js';
import supabase from './supabase.js';

// 聊天系统相关变量
const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeBtn = document.querySelector('.close-btn');
const historyList = document.getElementById('historyList');
const loader = document.getElementById('loader');
const pauseBtn = document.getElementById('pauseBtn');
const userInfoBtn = document.getElementById('userInfoBtn');
const userInfoModal = document.getElementById('userInfoModal');
const closeUserInfoBtn = document.querySelector('.close-user-info');

// 聊天相关配置
const USER_AVATAR = "https://i.ibb.co/Gfkc7dM0/favicon-1.jpg";
const BOT_AVATAR = "https://i.ibb.co/sdFXFR26/favicon-2.jpg";

// 状态变量
let chatHistory = [];
let isLoading = false;
let pauseResponse = false;

// 添加消息
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);

  // 创建头像元素
  const avatarImg = document.createElement('img');
  avatarImg.classList.add('avatar');
  avatarImg.src = sender === 'user' ? USER_AVATAR : BOT_AVATAR;
  avatarImg.alt = sender === 'user' ? '你的头像' : '机器人头像';

  // 创建消息内容容器
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');
  contentDiv.textContent = text;

  // 组装消息元素
  msgDiv.appendChild(avatarImg);
  msgDiv.appendChild(contentDiv);
  chat.appendChild(msgDiv);

  // 滚动到底部
  chat.scrollTop = chat.scrollHeight;
  
  // 保存到历史记录
  if (sender === 'user') {
    const currentTime = new Date().toLocaleString();
    chatHistory.push({
      time: currentTime,
      question: text,
      answer: ''
    });
  } else if (sender === 'bot' && chatHistory.length > 0) {
    chatHistory[chatHistory.length - 1].answer = text;
    updateHistoryList();
  }
  
  // 更新用户数据
  if (sender === 'bot') {
    userData.conversations++;
  }
}

// 暂停/继续响应
pauseBtn.addEventListener('click', function() {
  pauseResponse = !pauseResponse;
  if (pauseResponse) {
    pauseBtn.style.backgroundColor = '#ffc107';
    pauseBtn.setAttribute('title', '继续响应');
    pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    pauseBtn.style.backgroundColor = '#6c757d';
    pauseBtn.setAttribute('title', '暂停响应');
    pauseBtn.innerHTML = '';
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  }
});

// 保存对话记录到Supabase
async function saveChatRecord(userMessage, botMessage) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('用户未登录，无法保存对话记录');
      return;
    }
    
    const { data, error } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: user.id,
          user_message: userMessage,
          bot_message: botMessage,
          created_at: new Date().toISOString()
        }
      ]);
    
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
  const text = input.value.trim();
  if (!text) return;
  
  appendMessage('user', text);
  
  // 保存用户消息
  await saveChatRecord(text, '');
  
  input.value = '';
  sendBtn.disabled = true;
  pauseBtn.disabled = false;
  
  // 显示加载指示器
  loader.style.display = 'flex';
  isLoading = true;
  pauseResponse = false;
  pauseBtn.style.backgroundColor = '#6c757d';
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  
  // 模拟AI响应
  setTimeout(async () => {
    // 隐藏加载指示器
    loader.style.display = 'none';
    sendBtn.disabled = false;
    
    // 生成AI回复
    const responses = [
      "我理解您的疑问。人工智能的核心在于模拟人类认知过程，通过算法处理信息并做出决策。",
      "学习编程最重要的是实践。建议您从基础项目开始，逐步增加复杂度，同时学习算法和数据结构。",
      "用户体验设计的关键在于理解用户需求。通过用户调研和原型测试，可以创建更符合用户期望的产品。",
      "网络安全涉及多个层面，包括数据加密、访问控制和入侵检测。定期更新系统和使用强密码是基础防护措施。",
      "大数据分析需要掌握数据清洗、处理和可视化技术。Python和R是常用的工具，配合SQL数据库使用效果更佳。"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    appendMessage('bot', randomResponse);
    
    // 保存完整的对话记录
    await saveChatRecord(text, randomResponse);
    
    input.focus();
    isLoading = false;
  }, 1500);
}

// 更新历史记录列表
function updateHistoryList() {
  historyList.innerHTML = '';
  
  chatHistory.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');
    
    const timeDiv = document.createElement('div');
    timeDiv.classList.add('history-time');
    timeDiv.textContent = item.time;
    
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('history-question');
    questionDiv.textContent = `问: ${item.question}`;
    
    const answerDiv = document.createElement('div');
    answerDiv.classList.add('history-answer');
    answerDiv.textContent = `答: ${item.answer}`;
    
    historyItem.appendChild(timeDiv);
    historyItem.appendChild(questionDiv);
    historyItem.appendChild(answerDiv);
    
    historyList.appendChild(historyItem);
  });
}

// 事件处理函数
function handleBodyClick(e) {
  if (e.target === historyBtn) {
    historyModal.style.display = 'block';
  } else if (e.target === closeBtn) {
    historyModal.style.display = 'none';
  } else if (e.target === closeUserInfoBtn) {
    userInfoModal.style.display = 'none';
  } else if (e.target === userInfoBtn) {
    import('./account.js').then(module => module.showUserInfo()).catch(err => console.error('无法加载用户信息:', err));
  } else if (e.target === historyModal || e.target === userInfoModal) {
    historyModal.style.display = 'none';
    userInfoModal.style.display = 'none';
  }
}

// 初始化聊天事件
let chatEventsInitialized = false;

function initChatEvents() {
  if (chatEventsInitialized) return;
  chatEventsInitialized = true;

  document.body.addEventListener('click', handleBodyClick);
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input) input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// 清理聊天事件
function removeChatEvents() {
  document.body.removeEventListener('click', handleBodyClick);
  if (sendBtn) sendBtn.removeEventListener('click', sendMessage);
  if (input) input.removeEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  chatEventsInitialized = false;
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatEvents);
} else {
  initChatEvents();
}

// 导出函数
export { appendMessage, sendMessage, initChatEvents, removeChatEvents };