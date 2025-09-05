// 验证邮箱地址格式
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let newPasswordInput, confirmNewPasswordInput, strengthMeter, resetPasswordBtn;

// 在页面加载时把 hash 缓存下来，防止后续丢失
const rawHash = window.location.hash;
const params = new URLSearchParams(rawHash.substring(1));
const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');

// 初始化元素函数
function initializeElements() {
  newPasswordInput = document.getElementById('newPassword');
  confirmNewPasswordInput = document.getElementById('confirmNewPassword');
  strengthMeter = document.getElementById('strengthMeter');
  resetPasswordBtn = document.getElementById('resetPasswordBtn');
}

// 在DOM加载完成后初始化元素和事件监听器
function initResetPasswordPage() {
  initializeElements();
  
  // 检查元素是否存在
  if (newPasswordInput && strengthMeter) {
    // 密码强度检测
    newPasswordInput.addEventListener('input', function() {
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
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResetPasswordPage);
} else {
  initResetPasswordPage();
}

// 初始化事件绑定
function initResetPasswordEvents() {
  initializeElements();
  
  if (!resetPasswordBtn) return;

  resetPasswordBtn.addEventListener('click', async function() {
    const password = newPasswordInput.value;
    const confirmPassword = confirmNewPasswordInput.value;

    if (password.length < 8) return alert('密码长度至少为8位');
    if (password !== confirmPassword) return alert('两次输入的密码不一致');
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return alert('密码需同时包含字母和数字');
    }

    resetPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

    try {
      // 确认 Supabase 已加载
      if (!window.supabase) throw new Error('Supabase 未初始化');

      // 使用缓存的 token 设置 session
      if (!accessToken || !refreshToken) {
        throw new Error('重置密码链接无效，请重新发送邮件');
      }

      // 设置临时会话，才能更新密码
      await window.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      const { error } = await window.supabase.auth.updateUser({ password });
      if (error) throw error;

      alert('密码重置成功，请用新密码登录');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('密码重置错误:', error);
      alert(`密码重置失败: ${error.message || '未知错误'}`);
    } finally {
      resetPasswordBtn.innerHTML = '重置密码';
    }
  });
}

document.addEventListener('DOMContentLoaded', initResetPasswordEvents);