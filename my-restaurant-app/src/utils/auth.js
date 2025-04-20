import { API_URL } from '@/config/api'

export const validateToken = async (token) => {
  try {
    const response = await fetch(`${API_URL}/user/validate-token?token=${token}`)
    return response.ok
  } catch (err) {
    console.error('Error validating token:', err)
    return false
  }
}