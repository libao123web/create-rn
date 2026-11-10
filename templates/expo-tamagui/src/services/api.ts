import { create } from 'axios'
import { env } from '../config/env'

export function createApiClient(baseURL = env.apiUrl) {
  if (!baseURL || !/^https?:\/\//.test(baseURL))
    throw new Error('请配置有效的 EXPO_PUBLIC_API_URL 后再创建请求客户端')
  return create({ baseURL, timeout: 15_000, headers: { 'Content-Type': 'application/json' } })
}
