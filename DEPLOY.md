# 恋爱记录网站 · 上线部署指南

本指南覆盖 **腾讯地图 Key 申请**、**Supabase 后端配置**、**环境变量填写** 以及 **前端部署到线上平台** 的完整流程。

> 本教程默认你在 Windows 环境下操作。命令行操作建议使用 **VS Code 终端**（按 `Ctrl`+`` ` `` 打开），并确保已安装 [Node.js](https://nodejs.org/)（推荐 18+）。

---

## 操作环境说明

| 步骤              | 推荐工具/软件                | 替代方式               |
| --------------- | ---------------------- | ------------------ |
| 复制 .env.example | VS Code 终端 / Git Bash  | 手动右键复制文件           |
| 编辑环境变量          | VS Code 文本编辑器          | 记事本 / Notepad++    |
| 安装依赖 & 构建       | VS Code 终端 + npm       | 命令提示符 / PowerShell |
| 腾讯地图控制台         | 浏览器（Chrome/Edge）       | -                  |
| Supabase 控制台    | 浏览器                    | -                  |
| 部署平台            | Vercel / Cloudflare 官网 | -                  |

---

## 一、腾讯地图 Key、背景图与 Referer 白名单

### 1.1 申请 Key

1. 打开 [腾讯位置服务 LBS 控制台](https://lbs.qq.com/dev/console/application/mine)。
2. 登录后点击 **「应用管理」→「创建应用」**。
3. 应用类型选择 **「浏览器端（Web）」**，名称填写 `恋爱记录网站`。
4. 创建成功后，进入应用详情 → **添加 Key**。
   - Key 名称：`love-record-web`
   - 勾选 **WebServiceAPI** 和 **JavaScript API (GL)**
   - 点击提交，复制生成的 Key。

### 1.2 配置 Referer 白名单

腾讯地图要求调用来源域名在白名单内，否则地图不会加载。

| 场景               | Referer 白名单填写示例                           |
| ---------------- | ----------------------------------------- |
| 本地开发             | `localhost:5173`                          |
| Vercel 预览/生产     | `*.vercel.app` 或你的自定义域名 `your-domain.com` |
| Cloudflare Pages | `*.pages.dev` 或你的自定义域名 `your-domain.com`  |
| 自有服务器            | `your-domain.com` 或 `www.your-domain.com` |

> 如果有自定义域名，建议同时填写 `your-domain.com` 和 `*.your-domain.com`，并去掉 `https://` 协议头。

### 1.3 填入项目

#### 方式 A：在 VS Code / WorkBuddy 终端执行（推荐）

1. 打开 VS Code，点击菜单 **「终端」→「新建终端」**（快捷键 `Ctrl`+`` ` ``）。
2. 确保终端已经切换到项目目录：
   ```bash
   cd C:/Users/王玉喆/WorkBuddy/2026-09-05-14-39-39/love-record-site
   ```

3. 输入并回车：
   ```bash
   cp .env.example .env
   ```
   > Windows CMD 用户请用：`copy .env.example .env`

#### 方式 B：手动复制（不用命令行）

1. 打开文件夹：`C:\Users\王玉喆\WorkBuddy\2026-09-05-14-39-39\love-record-site`
2. 找到 `.env.example` 文件 → 右键 → **复制**。
3. 在空白处右键 → **粘贴**，得到 `.env.example - 副本`。
4. 将其重命名为 `.env`（注意前面有个点）。

编辑 `.env`：

```env
VITE_TENCENT_MAP_KEY=你复制的腾讯地图 Key
```

### 1.4 背景图替换

| 页面 | 图片文件名 | 放置位置 |
|------|-----------|---------|
| 星空页 | `star-sky.jpg` | `love-record-site/public/star-sky.jpg` |
| 首页 Hero | `hero-bg.jpg` | `love-record-site/public/hero-bg.jpg` |

图片不存在时会用 CSS 渐变兜底，不会报错。

---

## 二、Supabase 后端配置

### 2.1 创建项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 点击 **「New project」**，选择组织，输入项目名称 `love-record`。
3. 设置数据库密码并选择区域（推荐 `East Asia (Tokyo)` 或 `Southeast Asia (Singapore)`，延迟较低）。
4. 等待项目初始化完成（约 1-2 分钟）。

### 2.2 执行数据库 Schema

1. 进入项目 → 左侧菜单 **「SQL Editor」→「New query」**。
2. 打开本项目文件 `supabase/schema.sql`，复制全部 SQL。
3. 粘贴到 Supabase SQL Editor，点击 **「Run」**。
4. 执行成功后，左侧 **「Database」→「Tables」** 应能看到 11 张表。

> **如果你之前已经执行过 schema.sql 并报错 `relation "profiles" already exists`**：
> 当前 `schema.sql` 已改为幂等脚本，直接重新执行即可，不会再报错。

### 2.3 启用 Auth（MVP 单账号）

1. 进入 **「Authentication」→「Providers」**。
2. 启用 **Anonymous**（匿名登录），MVP 会自动为新访客创建账号。
3. 启用 **Email** 登录（V2 双人账号时使用）。
   - 关闭 `Confirm email`（MVP 阶段无需邮件验证，上线后建议开启）。
4. （可选 V2）启用 **OAuth** 提供商，如微信、Google。

### 2.4 创建存储桶（照片上传）

1. 进入 **「Storage」→「New bucket」**。
2. 名称填写 `memory-photos`。
3. 勾选 **Public bucket**。
4. 在 `Bucket policies` 中添加策略：允许 authenticated 用户读写。

### 2.5 获取项目凭证

1. 点击左侧 **「Project Settings」→「API」**。
2. 复制：
   - **Project URL** → 对应 `VITE_SUPABASE_URL`
   - **anon public** API key → 对应 `VITE_SUPABASE_ANON_KEY`

### 2.6 填入项目

1. 在 VS Code 左侧文件列表中找到 `.env` 文件，双击打开。
2. 将以下两项替换为从 Supabase 复制的内容，然后保存（`Ctrl`+`S`）：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 三、环境变量完整清单

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 站点信息（上线前请替换为真实信息）
VITE_SITE_NAME=恋爱记录
VITE_PARTNER_A_NICKNAME=小A
VITE_PARTNER_B_NICKNAME=小B
VITE_LOVE_START_DATE=2025-09-10
```

---

## 四、构建与部署

### 4.1 本地验证

1. 打开 VS Code，按 `Ctrl`+`` ` `` 打开终端。
2. 切换到项目目录（如果已经在项目目录可跳过）：
   ```bash
   cd C:/Users/王玉喆/WorkBuddy/2026-09-05-14-39-39/love-record-site
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 构建生产版本：
   ```bash
   npm run build
   ```

构建成功后，会在 `dist/` 目录生成静态文件。

### 4.2 部署到 Vercel（推荐）

**整体流程**：先把本地项目推送到 GitHub → 在 Vercel 官网导入这个仓库 → 填环境变量 → 部署。

#### 4.2.1 把项目推送到 GitHub

> 如果你已经有 GitHub 仓库，可跳过这步。

1. 打开浏览器，访问 [github.com](https://github.com) 并登录。
2. 点击页面右上角 **「+」号** → 选择 **「New repository」**。
3. 在 **Repository name** 输入仓库名，例如 `love-record-site`。
4. 保持 **Public**（公开）或选择 **Private**（私有）。Vercel 对私有仓库也支持，但可能需要授权。
5. 点击最下方绿色按钮 **「Create repository」**。
6. 创建成功后，页面会显示一段推送命令。复制那段命令，类似：
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/love-record-site.git
   git push -u origin main
   ```
7. 回到 VS Code，按 `Ctrl`+`` ` `` 打开终端，确保在项目目录下：
   ```bash
   cd C:/Users/王玉喆/WorkBuddy/2026-09-05-14-39-39/love-record-site
   ```
8. 依次执行上面复制的那几条命令（或直接运行 `git add . && git commit -m "init" && git push`）。
9. 刷新 GitHub 页面，看到代码已经上传，说明成功。

#### 4.2.2 在 Vercel 导入仓库

1. 打开浏览器，访问 [vercel.com](https://vercel.com) 并登录（建议用 GitHub 账号一键登录）。
2. 登录后进入 Vercel Dashboard，点击页面右上角或中间的 **「Add New Project」** 按钮。
3. 在 **Import Git Repository** 页面，找到你刚才创建的 `love-record-site` 仓库。
4. 点击仓库右侧的 **「Import」**。
5. 进入配置页面：
   - **Project Name**：默认就是仓库名，可不改。
   - **Framework Preset**：点击下拉框，选择 **「Vite」**。
   - **Root Directory**：留空（默认根目录）。
   - 其他保持默认。

#### 4.2.3 填写环境变量

1. 在同一页面往下滚动，找到 **「Environment Variables」** 区域。
2. 逐条添加以下变量，每次填完点击 **「Add」**：

| 变量名 | 值从哪里复制 |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon public` API key |
| `VITE_SITE_NAME` | 你的网站名，例如 `恋爱记录` |
| `VITE_PARTNER_A_NICKNAME` | 你的昵称，例如 `小A` |
| `VITE_PARTNER_B_NICKNAME` | 对方昵称，例如 `小B` |
| `VITE_LOVE_START_DATE` | 相恋起始日，格式 `YYYY-MM-DD`，例如 `2025-09-10` |

3. 全部加完后，点击页面下方 **「Deploy」** 按钮。

#### 4.2.4 等待部署并查看域名

1. 点击 Deploy 后，Vercel 会显示构建日志，等待约 1-3 分钟。
2. 构建成功后，页面会显示 **「Congratulations! Your project has been deployed.」**
3. 点击 **「Visit」** 或复制 Vercel 分配的域名（例如 `https://love-record-site-xxx.vercel.app`），即可访问网站。

---

### 4.3 部署到 Cloudflare Pages

**整体流程**：登录 Cloudflare → 创建 Pages 项目 → 连接 GitHub 仓库 → 填构建命令和输出目录 → 填环境变量 → 部署。

#### 4.3.1 进入 Cloudflare Pages

1. 打开浏览器，访问 [dash.cloudflare.com](https://dash.cloudflare.com) 并登录。
2. 登录后，在左侧菜单找到 **「Pages」**（可能在 **Compute** 分类下），点击进入。
3. 点击 **「Create a project」** 或 **「Create」** 按钮。

#### 4.3.2 连接 GitHub 仓库

1. 选择 **「Connect to Git」**。
2. 如果之前没授权过，Cloudflare 会跳转到 GitHub 授权页面，点击 **「Authorize Cloudflare」**。
3. 在仓库列表里找到 `love-record-site`，点击 **「Connect」** 或 **「Select」**。
4. 进入构建设置页面。

#### 4.3.3 填写构建设置

1. **Project name**：填写 `love-record-site` 或你喜欢的名字。
2. **Production branch**：保持 `main`。
3. **Framework preset**：点击下拉框，选择 **「Vite」**（如果没有，保持 None 也可以，手动填下面两项）。
4. **Build command**：输入
   ```bash
   npm run build
   ```
5. **Build output directory**：输入
   ```
   dist
   ```
6. 其他保持默认。

#### 4.3.4 填写环境变量

1. 在同一页面找到 **「Environment variables」** 区域（有些版本在高级设置里，点击 **「Add variable」**）。
2. 依次添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_SUPABASE_URL` | 你的 Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase anon public key |
| `VITE_TENCENT_MAP_KEY` | 你的腾讯地图 Key |
| `VITE_SITE_NAME` | 网站名 |
| `VITE_PARTNER_A_NICKNAME` | 你的昵称 |
| `VITE_PARTNER_B_NICKNAME` | 对方昵称 |
| `VITE_LOVE_START_DATE` | 相恋起始日 |

3. 点击 **「Save and Deploy」**。

#### 4.3.5 等待部署并加白名单

1. Cloudflare 开始构建，等待 1-2 分钟。
2. 构建成功后，会分配一个 `*.pages.dev` 域名，例如 `https://love-record-site-xxx.pages.dev`。
3. 复制这个域名，加到腾讯地图 Referer 白名单：
   - 打开 [腾讯位置服务控制台](https://lbs.qq.com/dev/console/application/mine)。
   - 进入你的 Web 应用 → Key 设置。
   - 在白名单里添加 `love-record-site-xxx.pages.dev`。
   - 点击保存，等待 5 分钟生效。

---

### 4.4 自有服务器 / CDN

如果你有自己的服务器、对象存储或 CDN，可以手动上传构建产物。

#### 4.4.1 本地构建

1. 在 VS Code 终端中进入项目目录：
   ```bash
   cd C:/Users/王玉喆/WorkBuddy/2026-09-05-14-39-39/love-record-site
   ```
2. 安装依赖（如果还没装）：
   ```bash
   npm install
   ```
3. 执行构建：
   ```bash
   npm run build
   ```
4. 构建成功后，项目根目录下会生成一个 `dist/` 文件夹，里面就是可以部署的静态文件。

#### 4.4.2 上传到服务器或对象存储

**方式 A：腾讯云 COS + CDN**

1. 打开 [腾讯云对象存储 COS 控制台](https://console.cloud.tencent.com/cos)。
2. 创建一个 Bucket（存储桶），例如 `love-record-website-你的后缀`，地域选离你最近的。
3. 进入 Bucket → **「文件列表」** → **「上传文件」**。
4. 把本地 `dist/` 文件夹里的所有文件拖拽或选择上传到 Bucket 根目录。
5. 开启 Bucket 的 **静态网站** 功能：进入 **「基础配置」→「静态网站」**，开启并设置索引文档为 `index.html`，错误文档也为 `index.html`（SPA 路由需要）。
6. 绑定 CDN 域名：进入 **「域名与传输管理」→「自定义 CDN 加速域名」**，添加你的域名并配置 CNAME。
7. 把最终访问域名加到腾讯地图 Referer 白名单。

**方式 B：阿里云 OSS + CDN**

1. 打开 [阿里云对象存储 OSS 控制台](https://oss.console.aliyun.com/)。
2. 创建 Bucket，例如 `love-record-website`。
3. 上传 `dist/` 内所有文件到 Bucket 根目录。
4. 进入 Bucket → **「基础设置」→「静态页面」**，设置默认首页为 `index.html`，默认 404 页为 `index.html`。
5. 绑定 CDN 加速域名。
6. 把访问域名加到腾讯地图 Referer 白名单。

**方式 C：Nginx / Apache 服务器**

1. 把 `dist/` 文件夹整体上传到服务器的网站目录，例如 `/var/www/love-record-site`。
2. 配置 Nginx 虚拟主机：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/love-record-site;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
3. 重启 Nginx：
   ```bash
   sudo nginx -s reload
   ```
4. 把 `your-domain.com` 加到腾讯地图 Referer 白名单。

> 无论用哪种方式，部署后都需确保：
> - 能正常访问 `index.html`
> - 刷新任意路由（如 `/memories`）不返回 404
> - 域名已在腾讯地图白名单中

---

## 五、部署后检查清单

- [ ] 访问首页，Hero 图片、相恋天数、模块入口正常显示
- [ ] 进入「足迹地图」，腾讯地图正常加载，切换城市有反应
- [ ] 进入「记一件小事」，能正常填写并提交（MVP 阶段提交后会跳转回忆录）
- [ ] 在 Supabase Table Editor 中能看到 `memories` 表新增的数据
- [ ] 移动端浏览器打开，导航可正常展开/收起

---

## 六、常见问题

**Q1：地图显示「KEY 鉴权失败」或空白？**

> 检查 `VITE_TENCENT_MAP_KEY` 是否正确，以及当前域名是否已加入腾讯地图 Referer 白名单。白名单修改后约 5 分钟生效。

**Q2：Supabase 请求 401？**

> 检查 `VITE_SUPABASE_ANON_KEY` 是否为 `anon public` key，不是 `service_role` key。

**Q3：如何替换真实照片？**

> 照片上传已接入 Supabase Storage `memory-photos` 桶。确保在 Supabase Storage 中创建了该 Public bucket 并允许 authenticated 用户读写。

**Q4：执行 SQL 时报错 `relation "profiles" already exists` 怎么办？**

> 这说明你之前已经创建过部分表。当前 `supabase/schema.sql` 已改为**幂等脚本**，即重复执行不会报错。解决方式：
> 1. 直接清空 SQL Editor 后重新粘贴最新版 `schema.sql` 执行；
> 2. 或仅执行缺失的部分（例如只建 `stardust_notes` 表和 storage bucket）。
> 
> 推荐方式 1，因为新脚本会补全 RLS 策略、触发器和存储桶策略。

**Q5：如何启用双人账号？**

> 当前为单账号 + 只读分享链接的 MVP 范围。双人配对体系建议在 V2 通过 `couples` 表 + Supabase Auth 实现。
