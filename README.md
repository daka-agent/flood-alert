# 🌊 校园水浸预警

> 一个轻量的校园积水众包上报工具，让师生第一时间掌握校门外路况，主动规避风险。

**在线访问：** https://kaleidoscopic-madeleine-8dadf1.netlify.app

---

## 背景

暴雨天气下，校门外道路积水往往来得很快，但信息传递严重滞后——微信群消息容易淹没、无已读确认、没有汇聚点。这个工具希望解决"最后一公里"的信息差：**任何人发现积水，都能第一时间上报；所有人打开页面，立即看到当前路况。**

---

## 功能

| 功能 | 说明 |
|------|------|
| 🚨 状态横幅 | 根据最新上报自动显示绿色（正常）/ 橙色（警告）/ 红色（严重） |
| 📍 众包上报 | 任何人均可提交：地点、积水程度、文字描述、昵称（可匿名） |
| 📷 照片上传 | 上传现场照片至 imgbb，所有访问者可见 |
| ⏰ 过期提示 | 超过 12 小时的记录自动标注"信息可能已过期" |
| 🔒 管理员删除 | 凭密码删除错误或过时的上报记录 |

---

## 使用方式

直接用手机浏览器打开链接，或将链接发送到班级/辅导员微信群即可。无需安装任何 App。

**访问地址：**

- **主站（Netlify）：** https://kaleidoscopic-madeleine-8dadf1.netlify.app
- **备用（GitHub Pages）：** https://daka-agent.github.io/flood-alert/（国内可能需要 VPN）

---

## 技术架构

### 最终架构

```
用户浏览器 / 微信
      ↓
Netlify 静态托管（国内访问稳定）
      ↓
Netlify Functions（同域名，无跨域问题）
      ↓
GitHub Issues API（海外服务器调用，国内用户无感知）
      ↓
GitHub Issues（作为数据库）
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 纯静态 HTML + CSS + JS | 单文件 `index.html`，无框架 |
| 前端托管 | Netlify Static | 国内访问稳定，自动 HTTPS |
| 后端 API | Netlify Functions | 同域名部署，无 CORS 问题 |
| 数据库 | GitHub Issues | 免费、可靠、API 成熟 |
| 图片 | imgbb 图床 | 免费，支持 API 上传 |
| 认证安全 | Netlify 环境变量 | `GH_TOKEN` 仅存在于服务端，前端零密钥 ✅ |
| 费用 | 完全免费 | ✅ |

### 安全设计

- ✅ **前端零 Token**：GitHub Token 仅保存在 Netlify 环境变量 `GH_TOKEN` 中
- ✅ **删除密码保护**：仅知道管理员密码（`admin888`）的人可删除上报
- ✅ **GitHub Push Protection**：代码中若含 Token 会被自动拦截（已验证生效）

---

## 本地运行

### 仅预览前端（无后端功能）

直接用浏览器打开 `index.html` 即可，无需任何构建步骤。

> ⚠️ 注意：本地打开时，上报提交功能需要连接 Netlify Functions，需保持网络畅通。

### 完整本地开发

1. 安装 [Netlify CLI](https://docs.netlify.com/cli/get-started/)：
   ```bash
   npm install -g netlify-cli
   ```
2. 在项目目录下运行：
   ```bash
   netlify dev
   ```
3. 访问 `http://localhost:8888`

---

## 部署说明

### Netlify（主部署平台）

1. 登录 https://app.netlify.com
2. "Add new site" → "Import an existing project" → 选择 GitHub 仓库 `daka-agent/flood-alert`
3. 配置：
   - Build command: **留空**
   - Publish directory: **`.`**
4. 在 Site Settings → Environment variables 中添加：
   - Key: `GH_TOKEN`
   - Value: GitHub Personal Access Token（需 `repo` 权限）
   - Scopes: 勾选 **Functions**
5. 点击 "Deploy" 完成部署

### GitHub Pages（备用）

推送到 `main` 分支后，GitHub Pages 会自动部署到：
https://daka-agent.github.io/flood-alert/

---

## 项目文件结构

```
flood-alert/
├── index.html                      # 前端主文件（单页应用）
├── netlify.toml                   # Netlify 配置文件
├── netlify/
│   └── functions/
│       └── api.js                # Netlify Function（GitHub Issues 代理）
├── _redirects                     # Netlify 重定向规则
└── README.md                     # 本文件
```

---

## 管理员操作

### 删除上报

1. 在上报卡片右上角点击 **🗑️** 按钮
2. 输入管理员密码：`admin888`
3. 确认后该上报会被关闭（在 GitHub Issues 中标记为 Closed）

---

## 升级路线

- [x] 接入 GitHub Issues 实现多端实时同步 ✅
- [x] 部署到 Netlify，解决国内访问问题 ✅
- [ ] 支持微信公众号模板消息推送
- [ ] 扩展至停电、道路封闭等其他校园突发场景
- [ ] 增加地图标注功能

---

## 仓库镜像

| 平台 | 地址 |
|------|------|
| GitHub（主仓库） | https://github.com/daka-agent/flood-alert |
| AtomGit（镜像） | https://atomgit.com/dakazhang/flood-alert |
| Gitee（已废弃） | https://gitee.com/duobaozhang/flood-alert |

---

## License

MIT
