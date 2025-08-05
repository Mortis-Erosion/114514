// 模拟Supabase客户端
const mockSupabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      if (email && password && password.length >= 8) {
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: email,
              user_metadata: { name: email.split('@')[0] }
            }
          },
          error: null
        }
      }
      throw new Error('登录失败')
    },
    signUp: async ({ email, password }) => {
      return {
        data: {
          user: {
            id: 'mock-user-id',
            email: email,
            user_metadata: { name: email.split('@')[0] }
          }
        },
        error: null
      }
    },
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    resend: async ({ email }) => ({ error: null })
  },
  from: (tableName) => ({
    insert: async (data) => {
      console.log(`Mock insert to ${tableName}:`, data)
      return { data: null, error: null }
    }
  })
}

export default mockSupabase