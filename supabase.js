// 确保在定义函数前初始化 Supabase 客户端
const supabaseUrl = 'https://sfathljcqvsqtazfcohb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXRobGpjcXZzcXRhemZjb2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzYxNTAsImV4cCI6MjA2OTk1MjE1MH0.e0h04FnSKOnoPDDVU1LqpgpofT5mJiym1QrB1NFZfQ4';

// 直接使用window.supabase对象，假设它已经在index.html中正确初始化
// 现在定义安全访问方法
function getSupabase() {
  if (!window.supabase) {
    throw new Error("Supabase client not available");
  }
  return window.supabase;
}