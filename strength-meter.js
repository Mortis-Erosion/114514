// 密码强度计算器
export function initStrengthMeter(inputElement, meterElement) {
  if (!inputElement || !meterElement) return;

  const strengthIndicator = meterElement.querySelector('.strength-indicator') || 
                           meterElement.querySelector('.strength-meter-fill');
  const strengthText = meterElement.querySelector('.strength-text') || 
                      meterElement.querySelector('.strength-label');
  
  if (!strengthIndicator) return;

  function calculateStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    
    return Math.min(score, 100);
  }

  function updateStrengthMeter() {
    const password = inputElement.value;
    const strength = calculateStrength(password);
    
    if (!password) {
      strengthIndicator.style.width = '0%';
      strengthIndicator.className = 'strength-indicator';
      strengthText.textContent = '';
      return;
    }

    let level, color, text;
    
    if (strength < 30) {
      level = 'weak';
      color = '#ff4757';
      text = '弱';
    } else if (strength < 60) {
      level = 'medium';
      color = '#ffa502';
      text = '中';
    } else if (strength < 80) {
      level = 'strong';
      color = '#2ed573';
      text = '强';
    } else {
      level = 'very-strong';
      color = '#1e90ff';
      text = '很强';
    }

    strengthIndicator.style.width = `${strength}%`;
    strengthIndicator.className = `strength-indicator ${level}`;
    strengthIndicator.style.backgroundColor = color;
    strengthText.textContent = `密码强度: ${text}`;
  }

  inputElement.addEventListener('input', updateStrengthMeter);
  updateStrengthMeter(); // 初始化
}