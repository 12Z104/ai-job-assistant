import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Smartphone } from 'lucide-react'
import { Button, Field, Input, useToast } from '../components/ui'
import s from './LoginPage.module.css'

/**
 * 登录页壳（issue #44）：只做表单与校验，不建立登录态、不写任何存储。
 * 账号载体为手机号（11 位大陆号）；真实认证在 V1.5 P6（issue #40）接入，
 * 届时替换 handleSubmit 里的登录桩，可能追加短信验证码登录。
 */
const PHONE_PATTERN = /^1[3-9]\d{9}$/
const PASSWORD_MIN = 8
/** 登录桩延迟：仅用于暴露按钮 loading 态，P6 接真实接口时删除。 */
const STUB_DELAY_MS = 600

interface FormErrors {
  phone: string
  password: string
}

function validate(phone: string, password: string): FormErrors {
  const errors: FormErrors = { phone: '', password: '' }
  const trimmedPhone = phone.replace(/\s/g, '')

  if (!trimmedPhone) {
    errors.phone = '请输入手机号'
  } else if (!PHONE_PATTERN.test(trimmedPhone)) {
    errors.phone = '手机号格式不正确'
  }

  if (!password) {
    errors.password = '请输入密码'
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `密码至少 ${PASSWORD_MIN} 位`
  }

  return errors
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export default function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({ phone: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validate(phone, password)
    setErrors(nextErrors)
    if (nextErrors.phone || nextErrors.password) return

    setSubmitting(true)
    await wait(STUB_DELAY_MS)
    setSubmitting(false)
    toast.info('账号体系 V1.5 上线，当前为游客模式')
    navigate('/')
  }

  return (
    <div className={s.page}>
      <div className={`rise ${s.card}`}>
        <header className={s.head}>
          <h1 className={s.brand}>AI 求职助手</h1>
          <p className={s.slogan}>投递之前，先把简历改到岗位真正想要的样子。</p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <Field label="手机号" required>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, ''))
                setErrors((prev) => ({ ...prev, phone: '' }))
              }}
              prefix={<Smartphone size={14} strokeWidth={1.5} aria-hidden="true" />}
              placeholder="11 位手机号"
              autoComplete="tel"
              status={errors.phone ? 'error' : undefined}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'login-phone-error' : undefined}
            />
            {errors.phone && (
              <span id="login-phone-error" className={s.error} role="alert">
                {errors.phone}
              </span>
            )}
          </Field>

          <Field label="密码" required hint={`至少 ${PASSWORD_MIN} 位字符`}>
            <Input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((prev) => ({ ...prev, password: '' }))
              }}
              prefix={<Lock size={14} strokeWidth={1.5} aria-hidden="true" />}
              placeholder="输入密码"
              autoComplete="current-password"
              status={errors.password ? 'error' : undefined}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            {errors.password && (
              <span id="login-password-error" className={s.error} role="alert">
                {errors.password}
              </span>
            )}
          </Field>

          <div className={s.actions}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              登录
            </Button>
            <Button block onClick={() => navigate('/')}>
              游客模式进入
            </Button>
          </div>
        </form>

        <p className={s.note}>V1.5 前无需账号，数据只保存在当前浏览器。</p>
      </div>
    </div>
  )
}
