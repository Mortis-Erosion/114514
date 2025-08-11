// 主题切换相关功能

// 主题切换功能
function setTheme(themeName) {
  // 根据主题名称设置正确的类名
  if (themeName === 'dark') {
    document.body.className = 'dark-theme';
  } else if (themeName === 'eye') {
    document.body.className = 'eye-theme';
  } else {
    document.body.className = '';
  }
  
  // 更新按钮状态
  const defaultThemeBtn = document.getElementById('defaultTheme');
  const darkThemeBtn = document.getElementById('darkTheme');
  const eyeThemeBtn = document.getElementById('eyeTheme');
  
  if (defaultThemeBtn && darkThemeBtn && eyeThemeBtn) {
    defaultThemeBtn.classList.remove('active');
    darkThemeBtn.classList.remove('active');
    eyeThemeBtn.classList.remove('active');
    
    if (themeName === '') {
      defaultThemeBtn.classList.add('active');
    } else {
      const activeBtn = document.getElementById(themeName + 'Theme');
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }
  }
  
  // 保存主题偏好
  localStorage.setItem('theme', themeName);
}

// 初始化主题
function initTheme() {
  // 加载主题偏好
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  }
  
  // 设置主题按钮事件监听器
  const defaultThemeBtn = document.getElementById('defaultTheme');
  const darkThemeBtn = document.getElementById('darkTheme');
  const eyeThemeBtn = document.getElementById('eyeTheme');
  
  if (defaultThemeBtn) defaultThemeBtn.addEventListener('click', () => setTheme(''));
  if (darkThemeBtn) darkThemeBtn.addEventListener('click', () => setTheme('dark'));
  if (eyeThemeBtn) eyeThemeBtn.addEventListener('click', () => setTheme('eye'));
}

// 导出函数
// 浏览器兼容
window.setTheme = setTheme;
window.initTheme = initTheme;