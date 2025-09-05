// 账号系统相关功能

// 使用全局Supabase客户端（已在supabase.js中初始化）

// 在所有Supabase调用前添加检查
async function handleLogin() {
  // 确保Supabase已加载
  if (!window.supabase) {
    console.error("Supabase not initialized");
    return;
  }
  
  // 原有代码...
}

// 等待DOM加载完成后初始化账号系统
document.addEventListener('DOMContentLoaded', function() {
  initAccountSystem();
});

// 初始化账号系统函数
function initAccountSystem() {
  const registerTab = document.getElementById('registerTab');
  const loginTab = document.getElementById('loginTab');
  
  // 关键DOM元素安全检查
  if (!registerTab || !loginTab) {
    console.error('关键DOM元素缺失!');
    return;
  }
  
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
  
  // 调用表检查函数
  checkAndCreateTable();

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

// 表检查函数
async function checkAndCreateTable() {
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('relation "users" does not exist')) {
      console.log('users表不存在，尝试创建...');
      
      // 在实际应用中，应通过API调用后端创建表
      // 这里仅作为示例
      alert('系统正在初始化，请稍后重试');
    }
  } catch (e) {
    console.error('表检查失败:', e);
  }
}

// 忘记密码功能
async function resetPassword(account) {
  if (!validateEmail(account)) {
    alert('请输入有效的邮箱地址');
    return false;
  }
  
  const email = account; // 直接使用用户输入的邮箱地址
  
  try {
    // 关键修改：强制包含114514子路径（适配你的GitHub Pages部署路径）
    const basePath = '/114514/'; // 直接指定包含子路径的基础路径
    
    // 生成完整的重置密码页面URL
    const redirectUrl = window.location.origin + basePath + 'reset-password.html';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
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

// 初始化密码强度检测器
if (passwordInput && document.querySelector('.strength-meter')) {
  window.initStrengthMeter(passwordInput, document.querySelector('.strength-meter'));
}


// 注册功能
async function handleRegister() {
  const account = registerAccountInput.value;
  const password = passwordInput.value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const email = account; // 直接使用用户输入的邮箱作为用户名
  
  if (!validateEmail(account)) {
    alert('请输入有效的邮箱地址');
    return;
  }
  
  if (password.length < 6) {
    alert('密码长度至少为6位');
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
  
  // 检查用户是否已存在（由Supabase Auth处理）
  
  // 显示加载状态
  registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
  
  try {
    console.log('开始注册流程，邮箱:', email);
    
    // 使用Supabase注册
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: "用户" + account.split('@')[0],
          email: email,
          registrationDate: new Date().toISOString().split('T')[0]
        },
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
    // 保存用户数据到数据库
    if (data.user) {
      console.log('注册成功，用户ID:', data.user.id);
      
      // 创建用户配置对象
      const userProfile = {
        id: data.user.id,
        email: email,
        name: data.user.user_metadata?.name || "用户" + account.split('@')[0],
        registration_date: new Date().toISOString().split('T')[0],
        last_login: new Date().toISOString().split('T')[0],
        status: "正常",
        security_level: "高",
        conversations: 0,
        active_days: 1
      };

      // 尝试插入用户数据 - 添加错误处理
      try {
        const { error: dbError } = await supabase
          .from('users')
          .insert([userProfile]);
        
        if (dbError) {
          console.error('用户数据存储失败:', dbError);
          // 特殊处理：注册成功但用户数据保存失败
          alert('账户创建成功，但用户数据保存失败。您仍可登录，系统会尝试修复此问题');
        }
      } catch (dbError) {
        console.error('用户数据存储过程中出错:', dbError);
        // 不阻断注册流程，仅记录错误
      }
      
      // +++ 重要修复：即使数据库插入失败，仍认为注册成功 +++
      saveUserSession(data.user);
      
      // 自动切换到登录
      loginTab.click();
      document.getElementById('loginAccount').value = account;
      document.getElementById('password').value = '';
      document.getElementById('confirmPassword').value = '';
      registerAccountInput.value = '';
      
      alert('注册成功！请检查邮箱完成验证');
    }
  } catch (error) {
    // 错误处理逻辑优化
    console.error('注册错误:', error);
    
    let errorMessage = '注册失败: ';
    if (error.message.includes('User already registered')) {
      errorMessage += '该邮箱已被注册';
    } else if (error.message.includes('users')) {
      errorMessage += '数据库错误，请联系管理员';
    } else {
      errorMessage += error.message || '未知错误';
    }
    
    alert(errorMessage);
  } finally {
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.innerHTML = '注册账号';
  }
}

// 登录功能
async function handleLogin() {
  const account = loginAccountInput.value;
  const password = loginPasswordInput.value;
  const email = account; // 直接使用用户输入的邮箱作为用户名
  
  if (!validateEmail(account)) {
    alert('请输入有效的邮箱地址');
    return;
  }
  
  if (password.length < 6) {
    alert('密码长度至少为6位');
    return;
  }
  
  // 显示加载状态
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
  
  try {
    // Supabase Auth会自动处理用户存在性验证
    
    // 使用Supabase登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      if (error.message && error.message.includes('Email not confirmed')) {
        const shouldResend = confirm(`登录失败: 邮箱未验证\n\n请检查您的邮箱 (${email}) 并点击验证链接完成注册，然后再尝试登录。\n\n是否重新发送验证邮件？`);
        
        if (shouldResend) {
          await resendVerificationEmail(email);
        }
        return;
      } else if (error.message && error.message.includes('Invalid login credentials')) {
        alert('邮箱或密码错误，请重新输入');
        return;
      }
      throw error;
    }
    
    // 获取用户信息
    const { user } = data;
    
    // 设置当前用户
    currentUserAccount = account;
    
    // 更新users表中的最后登录时间
    const today = new Date().toISOString().split('T')[0];
    
    // 先获取当前active_days值
    const { data: currentUserData } = await supabase
      .from('users')
      .select('active_days')
      .eq('id', user.id)
      .single();
    
    const currentActiveDays = currentUserData?.active_days || 0;
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        last_login: today,
        active_days: currentActiveDays + 1
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('更新最后登录时间失败:', updateError);
    }
    
    // 获取用户数据
    const { data: userDataFromDb, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // 检查用户数据是否存在，不存在则创建
    if (!userDataFromDb || dbError) {
      // 创建基础用户数据
      userData = {
        id: user.id,
        email: email,
        name: user.user_metadata?.name || "用户" + account.split('@')[0],
        registration_date: new Date().toISOString().split('T')[0],
        last_login: today,
        status: "正常",
        security_level: "高",
        conversations: 0,
        active_days: 1
      };

      // 尝试保存用户数据
      try {
        await supabase.from('users').insert([userData]);
      } catch (insertError) {
        console.error('创建用户数据失败:', insertError);
      }
    } else {
      userData = userDataFromDb;
    }
    
    // 保存用户会话
    saveUserSession(user);
    
    // 获取用户数据
    if (userDataFromDb) {
      window.userData = userDataFromDb;
      // 更新聊天界面中所有用户头像
      updateChatAvatar(userDataFromDb.avatar_url);
    }
    
    alert('登录成功！欢迎回来！');
    switchToChatPage();
  } catch (error) {
    alert(`登录失败: ${error.message || '网络错误，请稍后重试'}`);
    console.error('登录错误:', error);
  } finally {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.innerHTML = '登录';
  }
}

// 保存用户会话
function saveUserSession(user) {
  // 真实Supabase客户端会自动管理会话，无需手动保存
}

// 清除用户会话
function clearUserSession() {
  localStorage.removeItem('mockSession');
}

// 切换到聊天页面 - 使用全局状态管理
function switchToChatPage() {
  // 更新页面内容
  document.querySelector('#chatPage .header h1').textContent = `智能聊天助手 - ${currentUserAccount}`;
  
  // 动画切换
  const accountSystem = document.getElementById('accountSystem');
  const chatPage = document.getElementById('chatPage');
  
  if (accountSystem) accountSystem.classList.add('slide-out');
  
  // 添加头像更新逻辑
  if (window.updateUserAvatarFromDB) {
    window.updateUserAvatarFromDB();
  }
  if (window.userData?.avatar_url) {
    window.CHAT_CONFIG.USER_AVATAR = window.userData.avatar_url;
  }
  
  if (accountSystem) accountSystem.style.display = 'none';
  if (chatPage) {
    chatPage.style.display = 'block';
    chatPage.classList.add('slide-in');
  }
  
  // 清除输入框
  const input = document.getElementById('input');
  if (input) input.focus();
  
  // 清空对话区
  const chatContainer = document.getElementById('chat');
  if (chatContainer) {
    chatContainer.innerHTML = '';
    
    // 添加欢迎消息
    if (window.appendMessage) {
      window.appendMessage('bot', `欢迎回来，${currentUserAccount || '用户'}！有什么我可以帮助您的吗？`);
    }
  }
  
  // 立即初始化聊天事件
  if (!window.chatInitFlags.chatEventsInitialized) {
    if (window.initChatEvents) {
      window.initChatEvents();
      window.chatInitFlags.chatEventsInitialized = true;
    }
  }
}

// 登出功能
async function handleLogout() {
  try {
    // 使用Supabase登出
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // 清除用户数据
    currentUserAccount = null;
    
    // 重置头像
    window.CHAT_CONFIG.USER_AVATAR = 'https://your-project-ref.supabase.co/storage/v1/object/public/avatars/Default%20avatar.jpg';
    
    // 清除用户会话
    clearUserSession();
    
    // 切换到账号系统
    const chatPage = document.getElementById('chatPage');
    const accountSystem = document.getElementById('accountSystem');
    
    if (chatPage) chatPage.classList.add('slide-out');
    
    setTimeout(() => {
      if (chatPage) chatPage.style.display = 'none';
      if (accountSystem) {
        accountSystem.style.display = 'block';
        accountSystem.classList.add('slide-in');
      }
      
      // 清除登录表单
      loginAccountInput.value = '';
      loginPasswordInput.value = '';
      loginTab.click();
    }, 500);
  } catch (error) {
    console.error('登出错误:', error);
    alert(`登出失败: ${error.message || '未知错误'}`);
  }
}

// 显示用户信息
async function showUserInfo() {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData?.user) return alert('请先登录');

  const id = userData.user.id;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) return alert('未找到用户信息');

  document.getElementById('userNameInput').value = profile.name || '';
  document.getElementById('userEmailDisplay').textContent = profile.email;
  document.getElementById('regDate').textContent = new Date(profile.registration_date).toLocaleDateString();
  document.getElementById('conversationCount').textContent = profile.conversations ?? 0;
  document.getElementById('activeDays').textContent = profile.active_days ?? 0;
  document.getElementById('avatarImg').src = profile.avatar_url || window.userData?.avatar_url || 'https://via.placeholder.com/80x80?text=默认头像';

  document.getElementById('userInfoModal').style.display = 'block';
}

// 保存用户名
async function saveUserInfo() {
  const name = document.getElementById('userNameInput').value;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;

  await supabase
    .from('users')
    .update({ name })
    .eq('id', userData.user.id);

  alert('保存成功');
}

// 头像上传
async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;

  // 检查文件类型和大小
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    alert('请上传JPG、PNG或GIF格式的图片');
    return;
  }
  
  if (file.size > 2 * 1024 * 1024) { // 2MB限制
    alert('图片大小不能超过2MB');
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    alert('请先登录');
    return;
  }

  const userId = userData.user.id;
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  
  // 修复1: 使用filePath作为上传路径
  const filePath = `user_avatars/${fileName}`; // 在avatars桶中创建子目录

  try {
    // 修复2: 使用filePath上传
    const { error: uploadError } = await supabase.storage
      .from('avatars') // 确保存储桶名称完全匹配
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type // 明确设置内容类型
      });

    if (uploadError) {
      throw uploadError;
    }

    // 修复3: 正确获取公共URL
    const { data: { publicUrl } } = await supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 修复4: 更新users表
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 更新前端显示
    document.getElementById('avatarImg').src = publicUrl;
    alert('头像上传成功！');
    
    // 更新全局用户数据
    window.userData.avatar_url = publicUrl; 
    window.CHAT_CONFIG.USER_AVATAR = publicUrl; 
    
    // 更新聊天配置中的用户头像
    if (window.CHAT_CONFIG) {
      window.CHAT_CONFIG.USER_AVATAR = publicUrl;
    }
    
    // 更新所有用户消息的头像 
    updateChatAvatar(publicUrl); 
  } catch (error) {
    console.error('头像上传失败:', error);
    alert(`头像上传失败: ${error.message || '服务器错误'}`);
  }
}

// 检查用户是否已登录
  async function checkUserSession() {
    try {
      if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') {
        console.error('Supabase auth.getSession 方法未定义');
        return false;
      }

      // 获取当前会话
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      // 如果有活跃会话，自动登录
      if (data && data.session) {
        const { user } = data.session;
        
        // 从用户元数据中获取邮箱
        const email = user.email || (user.user_metadata && user.user_metadata.email);
        
        if (email) {
          // 设置当前用户
          currentUserAccount = email;
          
          // 获取用户数据
          const { data: userDataFromDb, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (userDataFromDb && !dbError) {
            userData = userDataFromDb;
            window.userData = userDataFromDb; // 关键：设置全局用户数据 
            
            // 更新聊天头像
            updateChatAvatar(userDataFromDb.avatar_url);
          } else {
            // 如果数据库中没有用户数据，创建基础数据
            userData = {
              id: user.id,
              email: email,
              name: (user.user_metadata && user.user_metadata.name) || "用户" + email.split('@')[0],
              registration_date: new Date().toISOString().split('T')[0],
              last_login: new Date().toISOString().split('T')[0],
              status: "正常",
              security_level: "高",
              conversations: 0,
              active_days: 1
            };
          }
          
          // 保存会话
          saveUserSession(user);
          
          // 更新用户头像
          if (typeof window.updateUserAvatarFromDB === 'function') {
            await window.updateUserAvatarFromDB();
          }
          
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

// 登录状态管理
let authInitialized = false;

// 添加全局更新函数 
window.updateChatAvatar = function(newAvatarUrl) {
  // 更新所有用户消息的头像 
  document.querySelectorAll('.user .avatar').forEach(avatar => {
    if (avatar) avatar.src = newAvatarUrl;
  });
  
  // 更新全局用户数据 
  if (window.userData) { 
    window.userData.avatar_url = newAvatarUrl;
  }
};

// 添加全局用户数据对象 
window.userData = window.userData  || { 
  avatar_url: 'https://your-project-ref.supabase.co/storage/v1/object/public/avatars/Default%20avatar.jpg' 
};

// 忘记密码处理函数
function handleForgotPassword(e) {
  e.preventDefault();
  const account = document.getElementById('loginAccount')?.value;
  if (!account) {
    alert('请先输入您的邮箱地址');
    return;
  }
  resetPassword(account);
}

// 确保DOM元素存在后再绑定事件
function initAccountEvents() {
  if (authInitialized) return;
  authInitialized = true;
  
  console.log('初始化账号系统事件绑定...');
  
  // 延迟绑定事件，确保DOM完全加载
  setTimeout(() => {
    const registerTab = document.getElementById('registerTab');
    const loginTab = document.getElementById('loginTab');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    console.log('找到元素:', {
      registerTab: !!registerTab,
      loginTab: !!loginTab,
      registerBtn: !!registerBtn,
      loginBtn: !!loginBtn,
      logoutBtn: !!logoutBtn
    });
    
    // 绑定标签切换事件
    if (registerTab) {
      registerTab.addEventListener('click', function() {
        this.classList.add('active');
        loginTab?.classList.remove('active');
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
      });
    }
    
    if (loginTab) {
      loginTab.addEventListener('click', function() {
        this.classList.add('active');
        registerTab?.classList.remove('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
      });
    }
    
    // 绑定按钮点击事件
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // 忘记密码事件
    const forgotPasswordLink = document.querySelector('.form-group a[href="#"]');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
    
    // 表单提交事件（防止表单默认提交）
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
      registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegister();
      });
    }
    
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
      });
    }
    
    // 检查用户会话
    checkUserSession();
    
    // 绑定用户信息模态框事件
    const userInfoBtn = document.getElementById('userInfoBtn');
    const closeUserInfoBtn = document.querySelector('.close-user-info');
    const saveUserInfoBtn = document.getElementById('saveUserInfoBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    
    if (userInfoBtn) userInfoBtn.addEventListener('click', showUserInfo);
    if (closeUserInfoBtn) closeUserInfoBtn.addEventListener('click', () => {
      document.getElementById('userInfoModal').style.display = 'none';
    });
    if (saveUserInfoBtn) saveUserInfoBtn.addEventListener('click', saveUserInfo);
    if (avatarUpload) avatarUpload.addEventListener('change', uploadAvatar);
    
    console.log('账号系统事件绑定完成');
  }, 100);
}

// 浏览器兼容
window.initAccountEvents = initAccountEvents;

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

// 浏览器兼容
window.currentUserAccount = currentUserAccount;
window.userData = userData;
window.showUserInfo = showUserInfo;
window.saveUserInfo = saveUserInfo;
window.uploadAvatar = uploadAvatar;
window.switchToChatPage = switchToChatPage;
window.checkUserSession = checkUserSession;
window.resetPassword = resetPassword;
window.resendVerificationEmail = resendVerificationEmail;
}

// 检查URL参数，是否需要直接显示聊天页面
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('show') && urlParams.get('show') === 'chat') {
    // 检查用户是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // 用户已登录，直接切换到聊天页面
        switchToChatPage();
      } else {
        // 用户未登录，重定向到登录页面
        window.location.href = 'index.html';
      }
    });
  }
}

// 页面加载时检查URL参数
window.addEventListener('DOMContentLoaded', checkUrlParams);

