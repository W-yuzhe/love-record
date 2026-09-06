# 相册公开化改造完成

## 做了什么

将项目原有的 `/gallery` 相册模块改造为**无需登录即可访问的公开相册**。访客通过你分享的 `https://你的域名/gallery` 链接，即可直接浏览所有标记为“公开”的回忆图片和文字。

## 关键改动

### 1. 权限控制（Supabase RLS）

在 `supabase/schema.sql` 新增了 4 条公开读取策略：

- `public_memories`：允许匿名 SELECT `visibility = 'public'` 的回忆
- `public_memory_media`：允许匿名 SELECT 属于公开回忆的媒体
- `public_memory_locations`：允许匿名 SELECT 属于公开回忆的地点
- `public_memory_tags`：允许匿名 SELECT 属于公开回忆的标签

**注意**：上线前需要在 Supabase SQL Editor 重新执行一遍 `supabase/schema.sql`，新策略才会生效。

### 2. 路由公开性

- `src/App.tsx`：`/gallery` 路由现在渲染 `PublicGallery`
- `src/components/layout/NavBar.tsx`：顶部导航增加 Gallery 入口
- `src/components/layout/BottomNav.tsx`：移动端底部 Tab 增加 Gallery 入口

### 3. 公开相册页面

基于现有 `src/pages/PublicGallery.tsx` 增强：

- 不依赖 `useAuth`/`couple`，未登录用户也能加载公开内容
- 瀑布流展示图片/视频
- 卡片与灯箱中展示回忆标题、日期、故事描述（`description`）
- 灯箱中额外展示地点标签和图片备注
- 新增「分享」按钮，一键复制当前页面链接

### 4. 其他修复

- `src/utils/date.ts`：修复 `let current` 未重新赋值却使用 `let` 导致的 lint error

## 验证结果

- `npm run lint`：通过（仅剩既有 warning，无新增错误）
- `npm run build -- --emptyOutDir=false`：构建成功

## 使用方式

1. 在创建回忆时把「可见性」设为「公开」。
2. 把 `https://你的域名/gallery` 分享给朋友。
3. 朋友在未登录状态下打开链接即可看到所有公开图片和文字。

## 第二批：照片/文字功能统一公开可见（2026-09-06 18:57）

在公开相册的基础上，进一步统一项目中所有照片/文字相关功能的可见性为公开，确保编辑保存后他人即时可见。

### 关键改动

- **`src/pages/CreateMemory.tsx`**：新建回忆时 `visibility` 从 `'couple'` 改为 `'public'`
- **`src/pages/EditMemory.tsx`**：编辑保存时强制设为 `'public'`
- **`src/pages/Memories.tsx`**：通过 PhotoNoteModal 修改日期/标签时，同步传入 `visibility: 'public'`
- **`src/data/mock.ts`**：所有 Mock 回忆 `visibility` 改为 `'public'`
- **`src/lib/localMemories.ts`**：`getLocalMemories` 读取本地数据时自动把非公开回忆转为公开并写回
- **`src/lib/migrateLocalMemories.ts`**：本地数据迁移到 Supabase 时统一设为 `'public'`
- **`supabase/schema.sql`**：
  - `memories.visibility` 默认值改为 `'public'`
  - 追加一次性 `UPDATE memories SET visibility='public' WHERE visibility!='public'` 迁移已有数据

## 验证结果

- `npm run lint`：通过（仅剩既有 warning，无新增错误）
- `npm run build -- --emptyOutDir=false`：构建成功

## 使用方式

1. 创建或编辑任意回忆，保存后自动公开。
2. 把 `https://你的域名/gallery` 分享给朋友，对方无需登录即可查看所有图片和文字。
3. 若使用 Supabase，部署后需在 SQL Editor 重新执行 `supabase/schema.sql`，新默认值、公开策略和一次性迁移才会生效。

## 已知限制

- 该页面只展示 `visibility='public'` 的回忆；项目已统一把默认值、创建/编辑/迁移/本地读取都改为公开，历史数据也会通过 schema.sql 的一次性迁移或再次编辑后变为公开。
- 未配置 Supabase 时，公开相册会读取浏览器 localStorage 中已统一为公开的本地回忆。
