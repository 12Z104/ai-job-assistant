import { Button as AntButton } from 'antd'
import type { ButtonProps } from 'antd'

/**
 * L1 基础件：主色墨绿实底、2px 圆角、无阴影（主题桥已统一）。
 * 约束：页面禁止直接 import 'antd'，一律从这里取。
 */
export function Button(props: ButtonProps) {
  return <AntButton {...props} />
}
