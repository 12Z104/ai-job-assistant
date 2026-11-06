import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { antdTheme } from '../styles/antd-theme'

/**
 * 全局 Provider 装配（唯一入口，页面禁止再挂 Provider）。
 * ConfigProvider：antd 主题桥 + 中文文案；AntdApp：为 useToast 提供上下文。
 * message.top 下移到顶栏（56px）之下，避免提示遮挡主导航。
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp message={{ top: 72, maxCount: 3 }}>{children}</AntdApp>
    </ConfigProvider>
  )
}
