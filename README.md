# 🍜 喂你 (WeiNi)

> 喂饱你的胃，也喂饱你的心。

**WeiNi** 是一对情侣的专属私人网站——集点餐、互动、记录、AI 助手于一体的全栈 Web 应用。取名"喂你"，既是"喂养"的喂，也是"为你"的为。

---

## ✨ 功能模块

### 🍕 点餐系统
- **零食饮料** — 库存展示、分类浏览、搜索过滤、补货请求流（女友发起 → 男友审批）、消耗扣减、进度条预警
- **饭菜点单** — 菜单池管理（带图片）、日期 + 餐段选择、订单状态流转（待接单 → 备菜中 → 烹饪中 → 已完成）、编辑与取消

### 🔧 趣味工单
- 支持 Bug / 功能需求 / 吐槽 / 愿望 四种分类
- 优先级标记、审核处理流转（已提交 → 已受理 → 处理中 → 已完成 / 已拒绝）
- 年度筛选

### 📅 纪念日倒计时
- 多类型纪念日（恋爱纪念日、生日、初次见面等）
- 自动计算距今/已过天数，首页展示最近事件

### 😊 心情打卡
- 18 种 emoji 心情选择 + 可选文字备注
- 日历视图、双方并排展示、统计接口

### 📝 愿望清单
- 共同维护、分类标签（旅行/美食/实物/体验/其他）
- 达成标记 + 拍照存证、进度追踪

### 📸 情侣相册
- 多相册管理、图片上传 + 标题 + 标签
- emoji 评论系统、"随机回忆"功能

### 🍳 烹饪战绩
- 关联饭菜订单、1-5 星评分
- 时间线展示、平均评分统计

### 🤖 AI 助手 + Live2D
- **Live2D Cubism 3** 看板娘（oh-my-live2d 渲染），全局悬浮可拖拽
- **DeepSeek API** 驱动的 AI 对话面板，SSE 流式打字效果
- 拟人化人格"小喂"——可爱、温柔、带点俏皮
- 聊天记录持久化

### 🔔 实时通知
- WebSocket (STOMP/SockJS) 推送
- 零食请求、饭菜订单、工单、烹饪评分等事件通知
- 导航栏通知铃铛 + 未读计数 + 通知中心页

### 🎨 主题切换
- 日间模式：奶油白 + 柔粉色
- 夜间模式：深灰 + 石板色
- CSS 自定义属性 + Tailwind `@theme` 语义令牌，一键切换

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 · TypeScript · Vite · Tailwind CSS 4 · framer-motion · zustand · axios · date-fns · lucide-react |
| **Live2D** | oh-my-live2d (Cubism 3) |
| **后端** | Java 21 · Spring Boot 3.3 · Spring Security · Spring Data JPA · Spring WebSocket · Spring WebFlux · Spring Mail |
| **认证** | JWT (access 15min + refresh 7day) · BCrypt |
| **数据库** | MySQL 8.0 |
| **存储** | MinIO (S3 兼容对象存储) |
| **AI** | DeepSeek API (OpenAI 兼容) · SSE 流式响应 |
| **部署** | Docker Compose · Nginx · Let's Encrypt SSL |
| **消息** | STOMP over SockJS · QQ SMTP 邮件 |

---

## 📁 项目结构

```
WeiNi/
├── server/                          # Spring Boot 后端
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/com/weini/
│       │   ├── controller/          # 16 个 REST 控制器
│       │   ├── service/             # 16 个业务服务
│       │   ├── repository/          # 16 个 JPA 仓库
│       │   ├── entity/              # 22 个实体 + 枚举
│       │   ├── dto/                 # 28 个 DTO
│       │   ├── security/            # JWT + WebSocket 认证
│       │   ├── config/              # Spring 配置
│       │   └── exception/           # 全局异常处理
│       └── resources/
│           ├── application.yml
│           └── db/reset.sql         # 完整建表 + 种子数据
│
├── frontend/                        # React 前端
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile + nginx.conf
│   ├── public/                      # Live2D 模型 + 静态资源
│   │   ├── Mao/                     #   Cubism 3 模型
│   │   ├── Hiyori/
│   │   └── aersasi_3/
│   └── src/
│       ├── App.tsx                  # 路由定义
│       ├── pages/                   # 16 个页面
│       ├── components/              # 15 个通用组件
│       ├── api/                     # Axios 客户端 + 拦截器
│       ├── stores/                  # Zustand 状态管理
│       ├── hooks/                   # 自定义 Hooks
│       └── index.css                # Tailwind + 主题令牌
│
├── docker-compose.yml               # 多容器编排
├── ARCHITECTURE.md                  # 架构设计文档 (5 ADR)
├── OPS.md                           # 部署运维手册
└── PROGRESS.md                      # 开发进度追踪
```

---

## 🚀 快速开始

### 环境要求

- **JDK 21** · **Node.js 22+** · **Maven 3.9+** · **Docker & Docker Compose**
- MySQL 8.0 + MinIO（可使用 Docker 快速部署）

### 本地开发

```bash
# 1. 启动依赖服务
docker run -d --name mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=weini_db \
  mysql:8.0

docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# 2. 初始化数据库
mysql -h127.0.0.1 -uroot -proot weini_db < server/src/main/resources/db/reset.sql

# 3. 配置 MinIO (创建 bucket)
# 访问 http://localhost:9001 登录后创建名为 "weini" 的 bucket，设为 public

# 4. 启动后端 (端口 8084)
cd server
cp src/main/resources/application.yml src/main/resources/application-dev.yml
# 编辑 application-dev.yml 填入 DeepSeek API Key、QQ 邮箱授权码等
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 5. 启动前端 (端口 5173)
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`，使用测试账号登录：
- 女友：`girlfriend` / `weini123`
- 男友：`boyfriend` / `weini123`

### Docker 生产部署

详细部署文档请参阅 [OPS.md](./OPS.md)。

```bash
# 1. 构建前后端
cd server && mvn clean package -DskipTests
cd ../frontend && npm run build

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入生产环境配置

# 3. 启动
docker compose up -d
```

---

## 📐 架构

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser    │────▶│   Nginx:80  │────▶│  Backend:8084│
│  (React SPA) │     │  (反向代理)  │     │ (Spring Boot)│
└─────────────┘     └─────────────┘     └──────┬───────┘
                                               │
                        ┌──────────────────────┼──────────────────────┐
                        │                      │                      │
                   ┌────▼────┐          ┌──────▼──────┐         ┌─────▼─────┐
                   │ MySQL:8 │          │  MinIO:9000  │         │ DeepSeek  │
                   │  (数据)  │          │  (图片存储)   │         │   (AI)    │
                   └─────────┘          └─────────────┘         └───────────┘
```

采用**模块化单体 (Modular Monolith)** 架构——10 个业务模块共享同一代码库和数据库，按功能分包。详情参见 [ARCHITECTURE.md](./ARCHITECTURE.md) 中的 5 个架构决策记录 (ADR)。
<p align="center">
</p>
