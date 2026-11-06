import { Skeleton as AntSkeleton } from 'antd'
import type { SkeletonProps } from 'antd'

/**
 * L1 基础件：加载骨架。数据未到位时先渲染骨架，禁止白屏等待。
 * 默认 active；保留 antd 的 Skeleton.Input / Button / Node 子组件能力。
 */
export const Skeleton = Object.assign(
  function Skeleton(props: SkeletonProps) {
    return <AntSkeleton active {...props} />
  },
  {
    Button: AntSkeleton.Button,
    Input: AntSkeleton.Input,
    Node: AntSkeleton.Node,
    Avatar: AntSkeleton.Avatar,
    Image: AntSkeleton.Image,
  },
) as typeof AntSkeleton
