import type { ThemeConfig } from 'antd'

/**
 * antd 主题桥：从 Paper token 派生组件库主题。
 * 色值必须与 src/styles/tokens.css 保持一致（同一 PR 内同步修改）。
 * 约束：页面不得再写 ThemeConfig 覆盖、不得 !important 覆盖 antd 样式。
 */
export const antdTheme: ThemeConfig = {
  token: {
    // 主色与状态色（对应 --color-accent / --color-danger 等）
    colorPrimary: '#2e5b4c',
    colorInfo: '#3e5f8a',
    colorSuccess: '#2f7d5b',
    colorWarning: '#b7791f',
    colorError: '#b3403a',
    // 中性色（对应 --color-ink* / --color-line）
    colorText: '#1a1a17',
    colorTextSecondary: '#57544c',
    colorTextTertiary: '#767162',
    colorTextPlaceholder: '#767162',
    colorBorder: '#e6e3d9',
    colorBorderSecondary: '#e6e3d9',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f7f6f1',
    // 几何：Paper 圆角 2px、无阴影、控件高度 36
    borderRadius: 2,
    borderRadiusLG: 4,
    borderRadiusSM: 2,
    controlHeight: 36,
    fontSize: 14,
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    boxShadow: 'none',
    boxShadowSecondary: '0 8px 24px rgba(46, 91, 76, 0.14)',
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      fontWeight: 500,
      borderRadius: 2,
    },
    Card: {
      paddingLG: 16,
    },
    Modal: {
      boxShadow: '0 8px 24px rgba(46, 91, 76, 0.14)',
    },
  },
}
