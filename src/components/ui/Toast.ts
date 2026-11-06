import { App } from 'antd'

/**
 * 统一提示入口：替代 alert()（AGENTS.md 已禁用 alert，关联 #24）。
 * 必须在 <Providers>（含 antd <App>）内使用，主题与层级由 antd 管理。
 */
export function useToast() {
  const { message } = App.useApp()
  return {
    success: (content: string) => message.success(content),
    error: (content: string) => message.error(content),
    warning: (content: string) => message.warning(content),
    info: (content: string) => message.info(content),
  }
}
