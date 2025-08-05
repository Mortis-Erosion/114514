// 账号系统相关功能

// 导入Supabase客户端
import supabase from './supabase.js';

// 账号系统相关变量
const registerTab = document.getElementById('registerTab');
const loginTab = document.getElementById('loginTab');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerAccountInput = document.getElementById('registerAccount');
const passwordInput = document.getElementById('password');
const strengthMeter = document.getElementById('strengthMeter');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const loginAccountInput = document.getElementById('loginAccount');
const loginPasswordInput = document.getElementById('loginPassword');
const accountSystem = document.getElementById('accountSystem');
const chatPage = document.getElementById('chatPage');
const logoutBtn = document.getElementById('logoutBtn');
const userAccountDisplay = document.getElementById('userAccountDisplay');

// 用户数据
let currentUserAccount = null;
let userData = {
  name: "张先生",
  account: "",
  regDate: "2023-08-15",
  lastLogin: "2023-10-20",
  status: "正常",
  securityLevel: "高",
  conversations: 128,
  activeDays: 42
};

// 切换注册/登录表单
registerTab.addEventListener('click', function() {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
});

loginTab.addEventListener('click', function() {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
});

// 验证邮箱地址格式
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 忘记密码功能
async function resetPassword(account) {
  if (!validateEmail(account)) {
    alert('请输入有效的邮箱地址');
    return false;
  }
  
  const email = account; // 直接使用用户输入的邮箱地址
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html',
    });
    
    if (error) throw error;
    
    alert('密码重置链接已发送到您的邮箱，请查收');
    return true;
  } catch (error) {
    console.error('密码重置错误:', error);
    alert(`密码重置失败: ${error.message || '未知错误'}`);
    return false;
  }
}

// 密码强度检测
passwordInput.addEventListener('input', function() {
  const password = this.value;
  let strength = 0;
  
  // 长度检测
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  
  // 包含数字
  if (/\d/.test(password)) strength += 20;
  
  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 15;
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) strength += 15;
  
  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  
  // 更新强度条
  strengthMeter.style.width = Math.min(strength, 100) + '%';
  
  // 更新颜色
  if (strength < 40) {
    strengthMeter.style.background = '#e74c3c';
  } else if (strength < 70) {
    strengthMeter.style.background = '#f39c12';
  } else {
    strengthMeter.style.background = '#2ecc71';
  }
});

// 注册功能
registerBtn.addEventListener('click', async function() {
  const account = registerAccountInput.value;
  const password = passwordInput.value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const email = account; // 直接使用用户输入的邮箱作为用户名
  
  if (!validateEmail(account)) {
    alert('请输入有效的邮箱地址');
    return;
  }
  
  if (password.length < 8) {
    alert('密码长度至少为8位');
    return;
  }
  
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  // 简单密码强度检查
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (!hasNumber || !hasLetter) {
    alert('密码需同时包含字母和数字');
    return;
  }
  
  // 显示加载状态
  registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
  
  try {
    // 使用Supabase注册
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: "用户" + account.split('@')[0], // 使用邮箱前缀作为默认名称
          email: email
        },
        emailRedirectTo: window.location.origin // 邮箱验证后重定向回当前页面
      }
    });
    
    if (error) throw error;
    
    alert(`注册成功！\n请检查您的邮箱 (${email}) 并点击验证链接完成注册。\n验证完成后即可登录。`);
    
    // 更新用户数据
    userData.account = account;
    
    // 自动切换到登录
    loginTab.click();
    document.getElementById('loginAccount').value = account;
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    registerAccountInput.value = '';
  } catch (error) {
    alert(`注册失败: ${error.message || '未知错误'}`);
    console.error('注册错误:', error);
  } finally {
    registerBtn.innerHTML = '注册账号';
  }
});

// 登录功能
loginBtn.addEventListener('click', async function() {
  const account = loginAccountInput.value;
  const password = loginPasswordInput.value;
  const email = account; // 直接使用用户输入的邮箱作为用户名
  
  if (!validateEmail(account)) {
    alert('请输入有效的邮箱地址');
    return;
  }
  
  if (password.length < 8) {
    alert('密码长度至少为8位');
    return;
  }
  
  // 显示加载状态
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
  
  try {
    // 使用Supabase登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    // 获取用户信息
    const { user } = data;
    
    // 设置当前用户
    currentUserAccount = account;
    
    // 更新用户数据
    userData.account = account;
    userData.name = user.user_metadata.name || "用户" + account.substring(7);
    userData.lastLogin = new Date().toISOString().split('T')[0];
    
    // 切换到聊天页面
    switchToChatPage();
  } catch (error) {
    if (error.message && error.message.includes('Email not confirmed')) {
      const shouldResend = confirm(`登录失败: 邮箱未验证\n\n请检查您的邮箱 (${email}) 并点击验证链接完成注册，然后再尝试登录。\n\n是否重新发送验证邮件？`);
      
      if (shouldResend) {
        await resendVerificationEmail(email);
      }
    } else {
      alert(`登录失败: ${error.message || '账号或密码错误'}`);
    }
    console.error('登录错误:', error);
  } finally {
    loginBtn.innerHTML = '登录账号';
  }
});

// 切换到聊天页面
function switchToChatPage() {
  // 更新页面内容
  document.querySelector('#chatPage .header h1').textContent = `智能聊天助手 - ${currentUserAccount}`;
  
  // 动画切换
  accountSystem.classList.add('slide-out');
  
  setTimeout(() => {
    accountSystem.style.display = 'none';
    chatPage.style.display = 'block';
    chatPage.classList.add('slide-in');
    
    // 清除输入框
    document.getElementById('input').focus();
    
    // 重新初始化聊天事件并获取函数
    import('./chat.js').then(module => {
      if (module.initChatEvents) {
        module.initChatEvents();
      }
      if (module.appendMessage) {
        // 添加欢迎消息
        setTimeout(() => {
          module.appendMessage('bot', `您好！欢迎使用智能聊天助手。我是您的AI助手，随时为您提供帮助。`);
        }, 500);
      }
    }).catch(err => {
      console.error('无法重新初始化聊天事件:', err);
    });
  }, 500);
}

// 登出功能
logoutBtn.addEventListener('click', async function() {
  try {
    // 使用Supabase登出
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // 清除用户数据
    currentUserAccount = null;
    
    // 切换到账号系统
    chatPage.classList.add('slide-out');
    
    setTimeout(() => {
      chatPage.style.display = 'none';
      accountSystem.style.display = 'block';
      accountSystem.classList.add('slide-in');
      
      // 清除登录表单
      loginAccountInput.value = '';
      loginPasswordInput.value = '';
      loginTab.click();
    }, 500);
  } catch (error) {
    console.error('登出错误:', error);
    alert(`登出失败: ${error.message || '未知错误'}`);
  }
});

// 显示用户信息
function showUserInfo() {
  userAccountDisplay.textContent = currentUserAccount || userData.account;
  document.getElementById('userInfoModal').style.display = 'block';
}

// 检查用户是否已登录
async function checkUserSession() {
  try {
    // 获取当前会话
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    // 如果有活跃会话，自动登录
    if (data.session) {
      const { user } = data.session;
      
      // 从用户元数据中获取邮箱
        const email = user.email || user.user_metadata.email;
        
        if (email) {
          // 设置当前用户
          currentUserAccount = email;
          
          // 更新用户数据
          userData.account = email;
          userData.name = user.user_metadata.name || "用户" + email.split('@')[0];
          userData.lastLogin = new Date().toISOString().split('T')[0];
          
          // 切换到聊天页面
          switchToChatPage();
          return true;
        }
    }
    
    return false;
  } catch (error) {
    console.error('会话检查错误:', error);
    return false;
  }
}

// 应用初始化时检查会话
function initAccountEvents() {
  // 检查用户会话
  checkUserSession();
  
  // 绑定忘记密码点击事件
  const forgotPasswordLink = document.querySelector('.form-group a[href="#"]');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      const account = loginAccountInput.value;
      
      if (!account) {
        alert('请先输入您的邮箱地址');
        return;
      }
      
      resetPassword(account);
    });
  }
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccountEvents);
} else {
  initAccountEvents();
}

// 重新发送验证邮件
async function resendVerificationEmail(email) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) throw error;
    
    alert(`验证邮件已重新发送到 ${email}，请查收并点击验证链接完成注册。`);
  } catch (error) {
    alert(`发送验证邮件失败: ${error.message || '未知错误'}`);
    console.error('重新发送验证邮件错误:', error);
  }
}

// 导出函数和变量
export { 
  currentUserAccount, 
  userData, 
  showUserInfo, 
  switchToChatPage,
  checkUserSession,
  resetPassword,
  resendVerificationEmail,
  validateEmail
};