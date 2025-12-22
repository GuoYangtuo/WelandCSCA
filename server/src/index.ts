import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { initDatabase } from './config/initDatabase';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CSCA平台服务运行正常' });
});

// 清空 uploads 目录中的临时文件（启动时）
// 注意：保留 question-images 和 documents 目录（持久化文件）
async function clearUploads() {
  const uploadsDir = path.join(__dirname, '../uploads');
  // 需要保留的目录列表
  const preserveDirs = ['question-images', 'documents'];
  
  try {
    const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
    for (const entry of entries) {
      // 跳过需要保留的目录
      if (preserveDirs.includes(entry.name)) {
        continue;
      }
      
      const entryPath = path.join(uploadsDir, entry.name);
      if (entry.isDirectory()) {
        // 删除其他子目录及其内容
        // fs.rm is available in recent Node versions; fallback to rmdir if necessary
        // use force to ignore missing files
        // @ts-ignore - some environments may not have rm typing
        if ((fs as any).rm) {
          await (fs as any).rm(entryPath, { recursive: true, force: true });
        } else {
          await fs.rmdir(entryPath, { recursive: true });
        }
      } else {
        // 删除临时文件
        await fs.unlink(entryPath).catch(() => {});
      }
    }
    console.log('uploads 临时文件已清空（保留持久化目录）');
  } catch (err: any) {
    if (err && err.code === 'ENOENT') {
      // 目录不存在，创建之
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('uploads 目录已创建');
    } else {
      console.error('清理 uploads 目录失败:', err);
    }
  }
}

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    console.log('数据库初始化完成');

    // 启动前清理 uploads
    await clearUploads();

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();


