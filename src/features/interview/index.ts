/**
 * features/interview 唯一对外出口。
 * 其他域与 pages 只允许从这里 import，禁止深路径。
 */
export { MessageBubble } from './MessageBubble'
export type { InterviewMessage, MessageRole } from './MessageBubble'
export { InterviewComposer } from './InterviewComposer'
