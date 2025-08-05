// 主应用初始化

// 导入其他模块
import { initTheme } from './theme.js';
import { appendMessage } from './chat.js';

// 应用初始化函数
function initApp() {
  // 初始化主题
  initTheme();
  
  // 其他初始化操作
  console.log('智能聊天系统初始化完成');
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}