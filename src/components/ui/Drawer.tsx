import { Drawer as AntDrawer } from 'antd'
import type { DrawerProps } from 'antd'

/** L1 基础件：侧滑抽屉，默认 420px，窄屏自适应。 */
export function Drawer(props: DrawerProps) {
  return <AntDrawer width={420} {...props} />
}
