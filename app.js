// 主应用初始化

// 全局状态管理
window.chatEventsInitialized = false;

// 应用初始化函数
function initApp() {
  // 检查Supabase是否初始化
  if (!window.supabase) {
    console.error("Supabase not initialized! Retrying...");
    setTimeout(initApp, 500); // 延迟重试
    return;
  }
  
  console.log('智能聊天系统初始化...');
  
  // 初始化主题
  initTheme();
  
  // 初始化账号系统
  if (window.initAccountEvents) {
    window.initAccountEvents();
    console.log('账号系统初始化完成');
  }
  
  // 延迟加载聊天模块（仅当需要时）
  if (document.getElementById('chatPage') && document.getElementById('chatPage').style.display === 'flex') {
    if (window.initChatEvents) {
      window.initChatEvents();
      window.chatEventsInitialized = true;
    }
  }
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}