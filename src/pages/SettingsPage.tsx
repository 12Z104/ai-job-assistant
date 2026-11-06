import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, Field, Input, Skeleton, Spinner, Tag, Textarea } from '../components/ui'
import s from './SettingsPage.module.css'

/**
 * 设置页（P1）：一半是占位，一半是 L1 基础件的实机样例。
 * P6 接账号与数据管理（issue #40）；样例区在 P3 收尾时移除。
 */
export default function SettingsPage() {
  return (
    <div className={`rise ${s.page}`}>
      <PageHeader title="设置" desc="账号与数据管理将在 V1.5 P6 接入（issue #40）" />

      <Card title="基础件样例（P1 验收用，P3 移除）">
        <div className={s.demo}>
          <div className={s.row}>
            <Button type="primary">主按钮</Button>
            <Button>次按钮</Button>
            <Button type="text">轻按钮</Button>
            <Button danger>危险</Button>
            <Button loading>加载中</Button>
            <Button disabled>禁用</Button>
          </div>

          <Field label="输入框" hint="聚焦后边框加深、无彩色光环">
            <Input placeholder="占位文本" />
          </Field>

          <Field label="多行输入" hint="简历 / JD 粘贴区，行高 1.75">
            <Textarea rows={3} placeholder="粘贴一段 JD 试试" />
          </Field>

          <div className={s.row}>
            <Tag>默认标签</Tag>
            <Tag tone="polish">润色标记</Tag>
            <Tag tone="suggest">补充标记</Tag>
            <Tag tone="danger">风险</Tag>
            <Tag closable>可关闭</Tag>
          </div>

          <div className={s.row}>
            <Spinner />
            <Skeleton.Input active size="small" />
            <Skeleton.Avatar active size="small" />
          </div>
        </div>
      </Card>
    </div>
  )
}
