export const validateToken = async (token) => {
  try {
    const response = await fetch(`http://134.122.68.20:80/user/validate-token?token=${token}`)
    return response.ok
  } catch (err) {
    console.error('Error validating token:', err)
    return false
  }
}