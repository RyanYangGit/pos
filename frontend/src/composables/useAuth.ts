import { ref, computed, readonly } from 'vue'
import { getDatabase } from '@/db'
import { hashPin } from '@/utils/crypto'
import { setToken, clearToken } from '@/utils/token'
import type { UserDoc } from '@/db/schemas/user'
import type { Role } from '@/constants/roles'

export type AuthScreen = 'loading' | 'login' | 'set-pin' | 'pin' | 'app'

const authScreen = ref<AuthScreen>('loading')
const currentUser = ref<UserDoc | null>(null)

export function useAuth() {
  const userRole = computed<Role | null>(() => currentUser.value?.role ?? null)
  const userName = computed(() => currentUser.value?.displayName ?? '')
  const isSuperAdmin = computed(() => currentUser.value?.role === 'super_admin')

  async function init() {
    console.log('[POS] init() start')
    authScreen.value = 'loading'
    console.log('[POS] init() getDatabase...')
    const db = getDatabase()
    console.log('[POS] init() db.users.find().exec()...')
    const users = await db.users.find().exec()
    console.log('[POS] init() users found:', users.length)

    if (users.length > 0) {
      const user = users[0]!
      const data = user.toJSON() as UserDoc
      currentUser.value = data
      // Admin / super_admin skip PIN lock
      if (data.role === 'admin' || data.role === 'super_admin') {
        authScreen.value = 'app'
      } else if (data.pinHash) {
        authScreen.value = 'pin'
      } else {
        authScreen.value = 'login'
      }
    } else {
      authScreen.value = 'login'
    }
    console.log('[POS] init() done, screen:', authScreen.value)
  }

  async function loginSuccess(userData: {
    token: string
    id: string
    username: string
    display_name: string
    role: string
    company_id: string | null
  }) {
    // Store JWT
    setToken(userData.token)

    const db = getDatabase()
    await db.users.find().remove()

    const doc: UserDoc = {
      id: userData.id,
      username: userData.username,
      displayName: userData.display_name,
      role: userData.role as Role,
      companyId: userData.company_id,
      pinHash: null,
    }

    await db.users.insert(doc)
    currentUser.value = doc
    // Admin / super_admin skip PIN setup, go straight to app
    if (doc.role === 'admin' || doc.role === 'super_admin') {
      authScreen.value = 'app'
    } else {
      authScreen.value = 'set-pin'
    }
  }

  async function setPin(pin: string) {
    const db = getDatabase()
    const hash = await hashPin(pin)
    const user = await db.users.findOne(currentUser.value!.id).exec()
    if (user) {
      await user.patch({ pinHash: hash })
      currentUser.value = { ...currentUser.value!, pinHash: hash }
    }
    authScreen.value = 'app'
  }

  async function verifyPin(pin: string): Promise<boolean> {
    const hash = await hashPin(pin)
    if (hash === currentUser.value?.pinHash) {
      authScreen.value = 'app'
      return true
    }
    return false
  }

  async function logout() {
    clearToken()
    const db = getDatabase()
    await db.users.find().remove()
    currentUser.value = null
    authScreen.value = 'login'
  }

  async function lock() {
    const role = currentUser.value?.role
    // Admin / super_admin don't use PIN lock
    if (role === 'admin' || role === 'super_admin') {
      return
    }
    if (currentUser.value?.pinHash) {
      authScreen.value = 'pin'
    } else {
      authScreen.value = 'login'
    }
  }

  return {
    authScreen: readonly(authScreen),
    currentUser: readonly(currentUser),
    userRole,
    userName,
    isSuperAdmin,
    init,
    loginSuccess,
    setPin,
    verifyPin,
    logout,
    lock,
  }
}
