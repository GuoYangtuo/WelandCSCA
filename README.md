# CSCA在线培训平台

CSCA（来华留学本科入学学业水平测试）在线培训平台，是Weland全球教育大数据平台的子网站。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL

## 功能特性

1. **用户认证**: 登录/注册功能，使用Weland平台的users表
2. **首页**: 展示CSCA考试的基础信息
3. **基础测试**: 在线做题练习，不限时间，支持题目导航
4. **模拟测试**: 完全模拟官方考试，120分钟限时测试
5. **题目上传**: 支持图片OCR智能识别，自动解析题目结构入库

## 项目结构

```
WelandCSCA/
├── client/          # 前端React应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── contexts/      # Context API
│   │   ├── services/      # API服务
│   │   └── ...
│   └── package.json
├── server/          # 后端Node.js应用
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   └── index.ts
│   └── package.json
└── README.md
```

## 数据库配置

### 使用的数据库

1. **weland数据库**: 存储用户信息（users表）
   - 字段: id, username, email, password

2. **csca_platform数据库**: 存储平台数据（自动创建）
   - `questions`: 题目表
   - `test_results`: 测试结果表
   - `mock_test_configs`: 模拟测试配置表

### 环境变量配置

在 `server` 目录下创建 `.env` 文件：

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=weland
DB_CSCA_NAME=csca_platform
JWT_SECRET=your_jwt_secret_key_here

# Dify AI API 配置（用于OCR识别题目，可选）
DIFY_API_KEY=your_dify_api_key_here

# 服务器公网地址（用于图片上传后生成可访问的URL，Dify需要访问此地址）
# 如果是本地开发，可使用 ngrok 等工具暴露服务
SERVER_URL=https://your-server-domain.com
```

## 安装和运行

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 配置数据库

确保MySQL服务已启动，并创建weland数据库（如果不存在）。users表应该已经存在。

### 3. 启动后端服务器

```bash
cd server
npm run dev
```

服务器将在 `http://localhost:3001` 启动。首次启动时会自动创建 `csca_platform` 数据库并初始化表结构。

### 4. 安装前端依赖

```bash
cd client
npm install
```

### 5. 启动前端开发服务器

```bash
cd client
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

## API接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 题目接口

- `GET /api/questions` - 获取题目列表（支持category、difficulty、limit参数）
- `GET /api/questions/:id` - 获取单个题目

### 测试接口

- `POST /api/tests/submit` - 提交测试结果
- `GET /api/tests/history` - 获取测试历史

### 模拟测试接口

- `GET /api/mock-test/config` - 获取模拟测试配置

### Dify AI接口

- `POST /api/dify/parse-questions` - 调用Dify工作流解析图片中的题目

## 使用说明

1. **注册/登录**: 点击右上角的"注册"或"登录"按钮，使用Weland平台的账号登录
2. **基础测试**: 在首页点击"开始基础测试"，可以进行不限时的练习
3. **模拟测试**: 登录后可以开始模拟测试，完全按照官方考试时间进行

## 开发说明

- 后端使用TypeScript编写，运行 `npm run build` 编译
- 前端使用Vite作为构建工具，支持热更新
- 所有API请求都需要JWT认证（除了登录和注册）
- 题目数据以JSON格式存储在数据库中

## 注意事项

- 确保MySQL服务正在运行
- 确保weland数据库和users表已存在
- 首次运行后端时会自动创建csca_platform数据库
- JWT_SECRET应该设置为一个安全的随机字符串


