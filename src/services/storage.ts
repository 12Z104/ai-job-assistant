// 模块8：localStorage 本地存档——刷新不丢数据
export const storage = {
  saveResume: (text: string) => localStorage.setItem('resume', text),
  loadResume: () => localStorage.getItem('resume') || '',
  saveJd: (text: string) => localStorage.setItem('jd', text),
  loadJd: () => localStorage.getItem('jd') || '',
  saveInterview: (messages: { role: string; content: string }[]) =>
    localStorage.setItem('interview-history', JSON.stringify(messages)),
  loadInterview: () => {
    try { return JSON.parse(localStorage.getItem('interview-history') || '[]') }
    catch { return [] }
  },
}
