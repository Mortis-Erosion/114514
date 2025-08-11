// 密码强度计算器
function initStrengthMeter(inputElement, meterElement) {
  if (!inputElement || !meterElement) return;

  // 创建或获取强度指示器元素
  let strengthIndicator = meterElement;
  
  // 创建文本显示区域（如果不存在）
  const strengthTextContainer = document.createElement('div');
  strengthTextContainer.className = 'strength-text-container';
  strengthTextContainer.style.display = 'none'; // 默认隐藏
  strengthTextContainer.style.marginTop = '5px';
  strengthTextContainer.style.fontSize = '0.85rem';
  strengthTextContainer.style.textAlign = 'right';
  
  const strengthText = document.createElement('span');
  strengthText.className = 'strength-text';
  strengthTextContainer.appendChild(strengthText);
  
  // 将文本容器插入到密码强度计下方
  meterElement.parentNode.insertBefore(strengthTextContainer, meterElement.nextSibling);

  // 增强的密码强度计算逻辑
  function calculateStrength(password) {
    if (!password) return 0;
    
    let score = 0;
    const length = password.length;
    
    // 基础长度评分（最高30分）
    if (length >= 6) score += 10;
    if (length >= 8) score += 10;
    if (length >= 12) score += 10;
    
    // 字符多样性评分（最高40分）
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    if (hasLowercase) score += 10;
    if (hasUppercase) score += 10;
    if (hasDigit) score += 10;
    if (hasSpecial) score += 10;
    
    // 复杂度评分（最高30分）
    // 检查是否有连续重复字符
    const hasRepeats = /(.)\1{2,}/.test(password); // 连续3个以上相同字符
    if (!hasRepeats) score += 10;
    
    // 检查是否包含常见键盘序列
    const commonSequences = ['qwerty', '123456', 'abcdef', 'asdfgh'];
    let hasCommonSequence = false;
    for (const seq of commonSequences) {
      if (password.toLowerCase().includes(seq)) {
        hasCommonSequence = true;
        break;
      }
    }
    if (!hasCommonSequence) score += 10;
    
    // 字符类型多样性评分
    const diversityScore = (hasLowercase + hasUppercase + hasDigit + hasSpecial) * 2.5;
    score += diversityScore;
    
    return Math.min(Math.max(score, 0), 100); // 确保分数在0-100之间
  }

  // 更新密码强度显示
  function updateStrengthMeter() {
    const password = inputElement.value;
    const strength = calculateStrength(password);
    
    // 显示文本容器（当开始输入密码时）
    if (password.length > 0) {
      strengthTextContainer.style.display = 'block';
    } else {
      strengthTextContainer.style.display = 'none';
    }
    
    // 设置强度条宽度
    strengthIndicator.style.width = `${strength}%`;
    
    // 确定强度级别和对应的样式
    let level, color, text, suggestion = '';
    
    if (strength < 30) {
      level = 'weak';
      color = '#ff4757';
      text = '弱';
      suggestion = '建议使用更长的密码并添加特殊字符';
    } else if (strength < 60) {
      level = 'medium';
      color = '#ffa502';
      text = '中';
      suggestion = '可以添加大写字母或特殊字符提高强度';
    } else if (strength < 80) {
      level = 'strong';
      color = '#2ed573';
      text = '强';
      suggestion = '不错的密码强度';
    } else {
      level = 'very-strong';
      color = '#1e90ff';
      text = '很强';
      suggestion = 'excellent! 非常安全的密码';
    }

    // 应用样式
    strengthIndicator.style.backgroundColor = color;
    strengthText.innerHTML = `密码强度: <strong style="color:${color}">${text}</strong> - ${suggestion}`;
  }

  // 监听密码输入事件
  inputElement.addEventListener('input', updateStrengthMeter);
  
  // 初始化时执行一次更新
  updateStrengthMeter();
}

// 浏览器兼容
window.initStrengthMeter = initStrengthMeter;