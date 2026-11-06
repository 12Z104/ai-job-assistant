import { Modal as AntModal } from 'antd'
import type { ModalProps } from 'antd'

/** L1 基础件：浮层阴影唯一允许使用 --shadow-overlay 的组件。 */
export function Modal(props: ModalProps) {
  return <AntModal width={520} maskClosable {...props} />
}
