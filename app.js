// 主应用初始化

// 导入其他模块
import { initTheme } from './theme.js';
import { initAccountEvents } from './account.js';

// 全局状态管理
window.chatEventsInitialized = false;

// 应用初始化函数
function initApp() {
  console.log('智能聊天系统初始化...');
  
  // 初始化主题
  initTheme();
  
  // 初始化账号系统
  initAccountEvents();
  
  // 延迟加载聊天模块（仅当需要时）
  if (document.getElementById('chatPage')?.style.display === 'flex') {
    import('./chat.js').then(chatModule => {
      chatModule.initChatEvents();
      window.chatEventsInitialized = true;
    }).catch(err => {
      console.error('加载聊天模块失败:', err);
    });
  }
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}