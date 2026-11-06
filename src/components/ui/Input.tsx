import { Input as AntInput } from 'antd'
import type { InputProps } from 'antd'
import type { TextAreaProps } from 'antd/es/input'

/** L1 基础件：白底 + 1px 细线边框，聚焦无彩色光环（主题桥统一为细线加深）。 */
export function Input(props: InputProps) {
  return <AntInput {...props} />
}

/** 多行输入：简历 / JD 粘贴区用，行高走 --leading-long。 */
export function Textarea(props: TextAreaProps) {
  return <AntInput.TextArea {...props} />
}
