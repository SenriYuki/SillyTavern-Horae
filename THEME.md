# Horae 美化指南

## 快速开始

Horae 的所有视觉样式由 **CSS 变量** 控制。只需覆盖这些变量，即可改变整个插件外观。

### 方式一：修改 CSS 变量（推荐）

在插件设置 → 外观设置 → 自定义CSS 中输入：

```css
#horae_drawer,
.horae-message-panel,
.horae-modal,
.horae-context-menu,
.horae-progress-overlay {
    --horae-primary: #ec4899;      /* 主色改为粉色 */
    --horae-primary-light: #f472b6;
    --horae-bg: #1a1020;           /* 背景改为深紫 */
    --horae-bg-secondary: #2d1f3c;
}
```

### 方式二：导入美化文件

1. 获取他人分享的 `.json` 美化文件
2. 插件设置 → 外观设置 → 点击导入按钮（📥）
3. 在主题下拉列表中选择导入的美化

### 方式三：导出并分享

1. 调好你喜欢的样式后，点击导出按钮（📤）
2. 会下载一个 `horae-theme.json` 文件
3. 分享给其他用户即可

---

## CSS 变量一览

### 配色

| 变量 | 默认值（暗色） | 说明 |
|------|---------------|------|
| `--horae-primary` | `#7c3aed` | 主色（按钮、高亮、渐变） |
| `--horae-primary-light` | `#a78bfa` | 主色亮版（文字高亮） |
| `--horae-primary-dark` | `#5b21b6` | 主色暗版（渐变起点） |
| `--horae-accent` | `#f59e0b` | 强调色（金色标记、NPC名） |
| `--horae-success` | `#10b981` | 成功色（好感度正值） |
| `--horae-warning` | `#f59e0b` | 警告色 |
| `--horae-danger` | `#ef4444` | 危险色（删除、负好感度） |
| `--horae-info` | `#3b82f6` | 信息色（NPC外貌标签） |

### 背景与边框

| 变量 | 默认值（暗色） | 说明 |
|------|---------------|------|
| `--horae-bg` | `#1e1e28` | 主背景（区块、卡片） |
| `--horae-bg-secondary` | `#2d2d3c` | 次级背景（容器、表头） |
| `--horae-bg-hover` | `#3c3c50` | 悬停背景 |
| `--horae-border` | `rgba(255,255,255,0.1)` | 边框色 |

### 文字

| 变量 | 默认值（暗色） | 说明 |
|------|---------------|------|
| `--horae-text` | `#e5e5e5` | 主文字色 |
| `--horae-text-muted` | `#a0a0a0` | 次级文字色（标签、提示） |

### 雷达图

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--horae-radar-color` | 跟随 `--horae-primary` | 雷达图数据区颜色（填充/描边/顶点） |
| `--horae-radar-label` | 跟随 `--horae-text` | 雷达图标签文字颜色 |

### 其他

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--horae-shadow` | `0 4px 20px rgba(0,0,0,0.3)` | 阴影 |
| `--horae-radius` | `8px` | 大圆角 |
| `--horae-radius-sm` | `4px` | 小圆角 |

---

## 主要容器类名

想针对特定区域微调样式时，使用以下选择器：

### 顶级容器

| 选择器 | 说明 |
|--------|------|
| `#horae_drawer` | 主抽屉面板（设置、状态、时间线等） |
| `.horae-message-panel` | 消息底部的元数据面板 |
| `.horae-modal` | 所有模态弹窗 |
| `.horae-context-menu` | 右键菜单 |
| `.horae-progress-overlay` | 进度覆盖层 |

### 抽屉内部

| 选择器 | 说明 |
|--------|------|
| `.horae-tabs` | 标签页导航栏 |
| `.horae-tab` | 单个标签页按钮 |
| `.horae-tab-contents` | 标签页内容容器 |
| `.horae-state-section` | 状态区块（仪表板内的各个卡片） |
| `.horae-settings-section` | 设置区块 |

### 数据展示

| 选择器 | 说明 |
|--------|------|
| `.horae-timeline-item` | 时间线事件卡片 |
| `.horae-timeline-list` | 时间线列表容器 |
| `.horae-affection-item` | 好感度条目 |
| `.horae-npc-item` | NPC 卡片 |
| `.horae-full-item` | 物品条目 |
| `.horae-item-tag` | 物品标签（小圆角胶囊） |
| `.horae-agenda-item` | 待办事项条目 |
| `.horae-relationship-item` | 关系网络条目 |
| `.horae-relationship-list` | 关系网络列表容器 |
| `.horae-location-card` | 场景记忆卡片 |
| `.horae-mood-tag` | 情绪标签（圆角胶囊） |
| `.horae-panel-rel-row` | 底部面板关系行 |
| `.horae-empty-hint` | 空数据提示文字 |

### 摘要与压缩

| 选择器 | 说明 |
|--------|------|
| `.horae-timeline-item.summary` | 摘要事件卡片（active 状态） |
| `.horae-timeline-item.horae-summary-collapsed` | 已展开为原始事件时的折叠指示条 |
| `.horae-summary-actions` | 摘要卡片上的切换/删除按钮容器 |
| `.horae-summary-toggle-btn` | 摘要/时间线切换按钮 |
| `.horae-summary-delete-btn` | 删除摘要按钮 |
| `.horae-compressed-restored` | 被摘要覆盖但当前已恢复显示的事件（虚线框） |

### 自定义表格

| 选择器 | 说明 |
|--------|------|
| `.horae-excel-table-container` | 表格外层容器 |
| `.horae-excel-table` | 表格主体 `<table>` |
| `.horae-excel-table th` | 表头单元格 |
| `.horae-excel-table td` | 数据单元格 |
| `.horae-table-prompt-row` | 表格底部提示词区域 |

### 按钮

| 选择器 | 说明 |
|--------|------|
| `.horae-btn` | 通用按钮 |
| `.horae-btn.primary` | 主色按钮（紫色渐变） |
| `.horae-btn.danger` | 危险按钮（红色） |
| `.horae-icon-btn` | 小图标按钮（28×28） |
| `.horae-data-btn` | 数据管理大按钮（带图标+文字） |
| `.horae-data-btn.primary` | 主功能按钮（跨两列） |

---

## 美化文件格式

导出的 `.json` 文件结构如下：

```json
{
    "name": "我的美化",
    "author": "你的名字",
    "version": "1.0",
    "variables": {
        "--horae-primary": "#ec4899",
        "--horae-primary-light": "#f472b6",
        "--horae-primary-dark": "#be185d",
        "--horae-accent": "#f59e0b",
        "--horae-bg": "#1a1020",
        "--horae-bg-secondary": "#2d1f3c",
        "--horae-bg-hover": "#3c2f50",
        "--horae-border": "rgba(255, 255, 255, 0.08)",
        "--horae-text": "#e5e5e5",
        "--horae-text-muted": "#a0a0a0"
    },
    "css": "/* 可选：额外CSS覆盖 */\n.horae-timeline-item { border-radius: 12px; }"
}
```

**字段说明：**
- `name`：美化名称（显示在主题选择器中）
- `author`：作者名（可选）
- `version`：版本号（可选）
- `variables`：CSS 变量键值对，会覆盖默认变量
- `css`：额外的 CSS 代码（可选），用于无法通过变量实现的样式调整

---

## 示例美化

### 樱花粉

```json
{
    "name": "樱花粉",
    "variables": {
        "--horae-primary": "#ec4899",
        "--horae-primary-light": "#f472b6",
        "--horae-primary-dark": "#be185d",
        "--horae-accent": "#fb923c",
        "--horae-bg": "#1f1018",
        "--horae-bg-secondary": "#2d1825",
        "--horae-bg-hover": "#3d2535",
        "--horae-text": "#fce7f3",
        "--horae-text-muted": "#d4a0b9"
    }
}
```

### 森林绿

```json
{
    "name": "森林绿",
    "variables": {
        "--horae-primary": "#059669",
        "--horae-primary-light": "#34d399",
        "--horae-primary-dark": "#047857",
        "--horae-accent": "#fbbf24",
        "--horae-bg": "#0f1a14",
        "--horae-bg-secondary": "#1a2e22",
        "--horae-bg-hover": "#2a3e32",
        "--horae-text": "#d1fae5",
        "--horae-text-muted": "#6ee7b7"
    }
}
```

### 海洋蓝

```json
{
    "name": "海洋蓝",
    "variables": {
        "--horae-primary": "#3b82f6",
        "--horae-primary-light": "#60a5fa",
        "--horae-primary-dark": "#1d4ed8",
        "--horae-accent": "#f59e0b",
        "--horae-bg": "#0c1929",
        "--horae-bg-secondary": "#162a45",
        "--horae-bg-hover": "#1e3a5f",
        "--horae-text": "#dbeafe",
        "--horae-text-muted": "#93c5fd"
    }
}
```

---

## 常见问题 & 美化技巧

### 底部面板被其他元素遮挡（无法交互）

部分酒馆美化或预设的 z-index 较高，导致 Horae 底部面板被盖住。在自定义 CSS 中添加：

```css
.horae-message-panel {
    margin-bottom: 10px;
    z-index: 9999;
    position: relative;
}
```

### 自定义顶部抽屉图标

将顶部导航栏的 Horae 图标替换为自定义图片：

```css
#horae_drawer .drawer-icon::before {
    background-image: url('你的图片URL') !important;
}
```

---

## 注意事项

1. **变量作用域**：CSS 变量定义在 `#horae_drawer`、`.horae-modal` 等顶级容器上，不要在 `body` 或 `:root` 上定义，否则不会生效。

2. **`!important` 防护**：部分按钮样式带有 `!important` 以抵抗酒馆全局主题干扰。如需覆盖这些样式，你的自定义 CSS 也需要使用 `!important`。

3. **深浅模式**：自定义美化选择后，会覆盖默认的暗色/浅色变量。如果你的美化是浅色系，记得调整 `--horae-text` 为深色。

4. **不影响酒馆**：Horae 的所有样式都限定在插件容器内，不会影响酒馆主界面。
