# 喂你 (WeiNi) · 开发进度

> 2026-05-22

## Phase 1 ✅ 脚手架

Stack: Spring Boot 3.3.5 + Java 21 + MySQL 8.0 + MinIO + JWT + React 18 + Vite + Tailwind

### 后端 `server/`

```
com.weini
├── WeiniApplication.java
├── controller/        AuthController         POST /api/auth/login, GET /api/auth/me
├── service/           AuthService, UserService
├── repository/        UserRepository
├── entity/            User, Role (GIRLFRIEND / BOYFRIEND)
├── dto/               LoginRequest, LoginResponse, MeResponse
├── config/            SecurityConfig, WebConfig (CORS), MinioConfig
├── security/          JwtTokenProvider (access 15min + refresh 7d), JwtAuthFilter, UserPrincipal
└── exception/         AuthException, GlobalExceptionHandler → ProblemDetail (RFC 7807)
```

- 18 源文件，BUILD SUCCESS
- `application.yml` — MySQL 192.168.154.130:3306/weini, `app.jwt.*`, `app.minio.*`, ddl-auto: update
- `init.sql` — 16 张表
- `seed.sql` — 两个初始用户 (girlfriend/weini123, boyfriend/weini123)
- `docker-compose.yml` — MySQL 8.0 + MinIO

### 前端 `frontend/`

- `LoginPage.tsx` — 登录页
- `HomePage.tsx` — 主页（角色区分导航）
- `AuthGuard.tsx` — 路由守卫（角色校验）
- `authStore.ts` — zustand 状态管理（登录/退出/JWT 持久化）
- `client.ts` — axios 实例（自动带 token，401 跳转登录）
- 17 条路由，按 GIRLFRIEND/BOYFRIEND 分两组

---

## Phase 2 ✅ 轻量三件套

### 纪念日倒计时

| API | Method | Path |
|-----|--------|------|
| 列表 | GET | `/api/anniversaries` |
| 添加 | POST | `/api/anniversaries` |
| 删除 | DELETE | `/api/anniversaries/{id}` |

- `AnniversaryResponse.daysUntil` — 自动计算距今天数
- 首页顶部展示最近纪念日倒计时卡片
- 首页可添加/删除纪念日（类型：纪念日/生日/初见/其他）

### 心情打卡

| API | Method | Path |
|-----|--------|------|
| 日历 | GET | `/api/moods?start=&end=` |
| 打卡 | POST | `/api/moods` |
| 修改 | PUT | `/api/moods/today` |

- `(user_id, checkin_date)` 唯一约束，防止重复打卡
- 前端：18 emoji 网格选择器 + 可选文字 + 两人当天心情对照 + 近 14 天日历
- 路由：`/girlfriend/mood`、`/boyfriend/mood`

### 随机投喂

| API | Method | Path |
|-----|--------|------|
| 随机 | GET | `/api/snacks/random` |

- `ORDER BY RAND() LIMIT 1`，库存 > 0 且状态 AVAILABLE
- 库存空时返回友好提示
- 前端暂未接（零食完整模块在 Phase 3）

---

## Phase 3 ✅ 零食模块 + 饭菜模块

### 零食模块

| API | Method | Path | 说明 |
|-----|--------|------|------|
| 列表 | GET | `/api/snacks` | 可选 `?category=&status=` 过滤 |
| 随机 | GET | `/api/snacks/random` | Phase 2 已有 |
| 发起请求 | POST | `/api/snack-requests` | RESTOCK / ADD / REMOVE |
| 请求列表 | GET | `/api/snack-requests` | 男朋友看全部待处理，女朋友看自己的 |
| 处理请求 | PATCH | `/api/snack-requests/{id}?status=` | COMPLETED / REJECTED，通过后更新库存 |

新建文件：`SnackRequest.java`, `SnackRequestStatus.java`, `SnackRequestType.java`, `SnackRequestRepository.java`, `SnackRequestService.java`, `SnackRequestController.java`, `CreateSnackRequest.java`, `SnackRequestResponse.java`

前端页面：
- `SnackBrowserPage.tsx` — `/girlfriend/snacks` 分类筛选 + 库存展示 + 请求表单
- `SnackRequestsPage.tsx` — `/boyfriend/snack-requests` 待处理队列 + 完成/拒绝

### 饭菜模块

| API | Method | Path | 说明 |
|-----|--------|------|------|
| 菜单列表 | GET | `/api/menu-pool` | 可选 `?activeOnly=true` |
| 添加菜品 | POST | `/api/menu-pool` | 男朋友管理菜单池 |
| 删除菜品 | DELETE | `/api/menu-pool/{id}` | 软删除（isActive=false） |
| 发起点单 | POST | `/api/meal-orders` | 日期 + 餐种 + 菜品 + 备注 |
| 订单列表 | GET | `/api/meal-orders` | 可选 `?date=&mealType=&status=` |
| 更新状态 | PATCH | `/api/meal-orders/{id}?status=` | PENDING → COOKING → DONE |

新建文件：`MenuItem.java`, `MealOrder.java`, `MealType.java`, `MealOrderStatus.java`, `MenuRepository.java`, `MealOrderRepository.java`, `MenuPoolService.java`, `MealOrderService.java`, `MenuPoolController.java`, `MealOrderController.java`, `CreateMenuItemRequest.java`, `MenuItemResponse.java`, `CreateMealOrderRequest.java`, `MealOrderResponse.java`

前端页面：
- `MenuPoolPage.tsx` — `/boyfriend/menu-pool` 菜品列表 + 添加/移除
- `MealOrderPage.tsx` — `/girlfriend/meals` 日期选择 + 餐种切换 + 菜单选择 + 提交
- `MealOrdersPage.tsx` — `/boyfriend/meal-orders` 按日期餐种分组 + 状态推进

### seed.sql 补充

- 7 条零食：薯片、可乐、布丁、草莓、泡面、曲奇、酸奶
- 8 条菜品：番茄炒蛋、红烧排骨、酸辣土豆丝、清炒时蔬、可乐鸡翅、紫菜蛋花汤、蛋炒饭、意大利面

---

## Phase 5 ✅ 愿望清单 + 情侣相册 + MinIO 上传

### MinIO 文件服务

`MinioStorageService` — 统一的文件上传/删除/预签名URL服务：
- `upload(file, prefix)` → 返回 MinIO objectName
- `delete(objectName)` → 从 bucket 删除文件
- `getPresignedUrl(objectName)` → 生成 7 天有效期的临时访问 URL

### 愿望清单

| API | Method | Path | 说明 |
|-----|--------|------|------|
| 列表 | GET | `/api/wishlist` | 两人共享，按创建时间倒序 |
| 许愿 | POST | `/api/wishlist` | 标题 + 描述 + 分类(TRAVEL/FOOD/THING/EXPERIENCE/OTHER) |
| 删除 | DELETE | `/api/wishlist/{id}` | 同时删除关联的 MinIO 文件 |
| 达成 | PATCH | `/api/wishlist/{id}/achieve` | multipart file 上传达成照片 |

新建文件：`WishlistItem.java`, `WishlistCategory.java`, `WishlistStatus.java`, `WishlistRepository.java`, `WishlistService.java`, `WishlistController.java`, `CreateWishlistRequest.java`, `WishlistResponse.java`

前端页面：`WishlistPage.tsx` — 待实现/已实现分区 + 许愿表单 + 标记达成（含照片上传）

### 情侣相册

| API | Method | Path | 说明 |
|-----|--------|------|------|
| 相册列表 | GET | `/api/albums` | 含封面 URL + 照片数量 |
| 创建相册 | POST | `/api/albums` | 标题 |
| 删除相册 | DELETE | `/api/albums/{id}` | — |
| 照片列表 | GET | `/api/albums/{id}/photos` | 含评论列表 |
| 上传照片 | POST | `/api/albums/{id}/photos` | multipart file + caption + tags |
| 删除照片 | DELETE | `/api/photos/{id}` | 删除文件 + 评论 |
| 添加评论 | POST | `/api/photos/{id}/comments` | content |

新建文件：`PhotoAlbum.java`, `Photo.java`, `PhotoComment.java`, `AlbumRepository.java`, `PhotoRepository.java`, `PhotoCommentRepository.java`, `AlbumService.java`, `PhotoService.java`, `AlbumController.java`, `PhotoController.java` + 5 个 DTO

前端页面：`PhotoAlbumPage.tsx` — 相册网格 + 创建/删除 + 照片浏览 + 上传 + 评论

---

## Phase 6 ✅ 烹饪战绩

| API | Method | Path | 说明 |
|-----|--------|------|------|
| 时间线 | GET | `/api/cooking-records` | 按日期倒序，含照片 + 平均分 + 评分详情 |
| 晒厨艺 | POST | `/api/cooking-records` | multipart: dishName + cookingDate + photo(可选) + mealOrderId(可选) |
| 删除 | DELETE | `/api/cooking-records/{id}` | 同时删除 MinIO 照片 |
| 评分 | POST | `/api/cooking-records/{id}/ratings` | 1-5 分 + 可选评论，同一人不能重复评分 |

新建文件：`CookingRecord.java`, `CookingRating.java`, `CookingRecordRepository.java`, `CookingRatingRepository.java`, `CookingRecordService.java`, `CookingRecordController.java`, `CreateCookingRecordRequest.java`, `CookingRecordResponse.java`, `CreateRatingRequest.java`, `RatingResponse.java`

前端页面：`CookingRecordsPage.tsx` — 烹饪时间线 + 晒厨艺表单（照片上传）+ 女朋友评分（1-5 星 + 评论）+ 删除

---

## 目录结构

```
WeiNi/
├── PROGRESS.md                    # 本文件
├── WeiNi-项目开发文档.md           # 完整设计文档
├── ARCHITECTURE.md                # 架构评审 (5 ADRs)
├── docker-compose.yml             # MySQL 8.0 + MinIO
│
├── server/                        # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/weini/        # 102 源文件
│       └── resources/
│           ├── application.yml
│           └── db/
│               ├── init.sql       # 16 张表结构
│               └── seed.sql       # 初始用户 + 零食 + 菜品
│
└── frontend/                      # React 前端
    └── src/
        ├── api/client.ts
        ├── stores/authStore.ts
        ├── routes/AuthGuard.tsx
        ├── App.tsx
        ├── components/
        │   └── BackHome.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── HomePage.tsx
            ├── MoodCheckinPage.tsx
            ├── PlaceholderPage.tsx
            ├── SnackBrowserPage.tsx
            ├── SnackRequestsPage.tsx
            ├── MenuPoolPage.tsx
            ├── MealOrderPage.tsx
            ├── MealOrdersPage.tsx
            ├── WorkOrdersPage.tsx
            ├── WorkOrderManagePage.tsx
            ├── WishlistPage.tsx
            ├── PhotoAlbumPage.tsx
            └── CookingRecordsPage.tsx
```

---

## Phase 7 ✅ Live2D + DeepSeek AI

### DeepSeek AI 聊天

| API | Method | Path | 说明 |
|-----|--------|------|------|
| SSE 聊天 | GET | `/api/ai/chat?message=` | Server-Sent Events 流式响应 |

新建文件：`AiChatService.java`, `AiChatController.java`

- DeepSeek API (OpenAI-compatible) + SSE streaming via RestTemplate.execute()
- System prompt: "小喂" AI 女友助手，温柔俏皮
- 前端 `AiChatPanel.tsx` — 粉色悬浮聊天面板，SSE 流式读取 + 打字光标

### Live2D 看板娘

- `Live2dWidget.tsx` — 使用 oh-my-live2d v0.19.3，加载本地 `aersasi_3` 模型 (Cubism 3)
- 模型路径：`public/aersasi_3/` — .model3.json + .moc3 + 2 张纹理 + 80+ 动作文件
- 全局浮动 UI：Live2D 右下角常驻，AI 聊天面板 toggle

---

## 大改版 (2026-05-22)

### Phase 1 ✅ 主题系统
- CSS 自定义属性实现日/夜模式切换
- Tailwind `@theme` 语义令牌，全站颜色迁移

### Phase 2 ✅ 首页重构
- 可滚动信息流（在一起天数 + 纪念日 + 心情 + 快捷统计 + 最近动态）
- 固定底部导航 5 个标签，AppLayout + Outlet 嵌套路由

### Phase 3 ✅ WebSocket 通知
- Spring STOMP/SockJS 端点 `/ws`，JWT 拦截器
- Notification 实体/仓库/服务/控制器
- 前端 `useWebSocket` hook + `NotificationBell` + `NotificationsPage`

### Phase 4 ✅ 点菜增强 (2026-05-22)
- `PUT /api/menu-pool/{id}/image` — MinIO 菜品图片上传
- `PUT /api/meal-orders/{id}` — 编辑 PENDING 订单
- `DELETE /api/meal-orders/{id}` — 取消 PENDING 订单
- 前端状态进度指示器 (PENDING → COOKING → DONE 步进器)
- 菜单选择项显示缩略图

### Phase 5 ✅ 零食增强 (2026-05-22)
- `GET /api/snacks?search=` — 名称搜索过滤
- 前端搜索栏 + 图片缩略图 + 库存进度条（颜色预警）
- MenuItemResponse / SnackResponse 返回 MinIO 预签名 URL

---

## 待实施

| Phase | 内容 |
|-------|------|
| 8 | 移动端适配 + Docker 部署 |
