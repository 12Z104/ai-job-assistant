// 统一测试入口：修正 Windows + Git Bash 的盘符大小写漂移，再启动 vitest
//
// 背景（vitest #10812）：Git Bash 会把小写盘符传给子进程（d:\...），
// 而磁盘真实大小写是 D:\...。vitest 的模块状态按路径缓存，路径大小写
// 不一致会让测试文件与 worker 拿到两份 vitest 模块实例，runner 注入丢失，
// 所有测试报 "Vitest failed to find the runner"。
// fs.realpathSync.native 在 Windows 上返回磁盘真实大小写，用它纠正 cwd
// 后再启动 vitest 即可稳定；POSIX 上该调用无副作用，跨平台安全。
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = fs.realpathSync.native(path.resolve(here, '..'))
const vitestBin = path.join(repoRoot, 'node_modules', 'vitest', 'vitest.mjs')

const result = spawnSync(process.execPath, [vitestBin, 'run', ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
