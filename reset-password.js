// 验证邮箱地址格式
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 获取DOM元素
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const strengthMeter = document.getElementById('strengthMeter');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

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

// 重置密码功能
resetPasswordBtn.addEventListener('click', async function() {
  const password = newPasswordInput.value;
  const confirmPassword = confirmNewPasswordInput.value;
  
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
  resetPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
  
  try {
    // 从URL获取访问令牌
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      throw new Error('未找到访问令牌，请重新发送重置密码邮件');
    }
    
    // 使用Supabase更新密码
    const { error } = await window.supabase.auth.updateUser({
      password: password
    });
    
    if (error) throw error;
    
    alert('密码重置成功！请使用新密码登录');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('密码重置错误:', error);
    alert(`密码重置失败: ${error.message || '未知错误'}`);
  } finally {
    resetPasswordBtn.innerHTML = '重置密码';
  }
});

function initResetPasswordEvents() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');

  if (!accessToken) {
    alert('无效的密码重置链接，请重新发送重置密码邮件');
    window.location.href = 'index.html';
    return;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResetPasswordEvents);
} else {
  initResetPasswordEvents();
}