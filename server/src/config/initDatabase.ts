import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { cscaPool } from './database';

dotenv.config();

export async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const dbName = process.env.DB_CSCA_NAME || 'csca_platform';

  try {
    // 创建数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`数据库 ${dbName} 已准备就绪`);

    // 切换到新数据库
    await connection.query(`USE \`${dbName}\``);

    // 创建测试记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        test_type VARCHAR(50) NOT NULL COMMENT 'basic或mock',
        score INT NOT NULL,
        total_questions INT NOT NULL,
        answers JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_test_type (test_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试结果表'
    `);

    // 创建题目表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        options JSON NOT NULL COMMENT '选项数组',
        correct_answer INT NOT NULL COMMENT '正确答案索引(0-3)',
        explanation TEXT COMMENT '解析',
        category VARCHAR(100) COMMENT '题目分类',
        difficulty VARCHAR(20) DEFAULT 'medium' COMMENT '难度: easy, medium, hard',
        knowledge_point VARCHAR(100) COMMENT '知识点',
        source VARCHAR(200) COMMENT '题目来源',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_difficulty (difficulty),
        INDEX idx_knowledge_point (knowledge_point),
        INDEX idx_source (source)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目表'
    `);

    // 检查并添加 knowledge_point 字段（如果表已存在但没有该字段）
    try {
      await connection.query(`ALTER TABLE questions ADD COLUMN knowledge_point VARCHAR(100) COMMENT '知识点' AFTER difficulty`);
      await connection.query(`ALTER TABLE questions ADD INDEX idx_knowledge_point (knowledge_point)`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column') && !e.message.includes('Duplicate key name')) {
        // 忽略列或索引已存在的错误
      }
    }

    // 检查并添加 source 字段（如果表已存在但没有该字段）
    try {
      await connection.query(`ALTER TABLE questions ADD COLUMN source VARCHAR(200) COMMENT '题目来源' AFTER knowledge_point`);
      await connection.query(`ALTER TABLE questions ADD INDEX idx_source (source)`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column') && !e.message.includes('Duplicate key name')) {
        // 忽略列或索引已存在的错误
      }
    }

    // 创建模拟测试配置表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mock_test_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL COMMENT '测试名称',
        duration_minutes INT NOT NULL COMMENT '考试时长（分钟）',
        total_questions INT NOT NULL COMMENT '题目总数',
        question_ids JSON NOT NULL COMMENT '题目ID数组',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模拟测试配置表'
    `);

    // 创建章节表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL COMMENT '章节标题',
        description TEXT COMMENT '章节描述',
        order_index INT NOT NULL DEFAULT 0 COMMENT '排序索引',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order (order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='章节表'
    `);

    // 创建课时表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chapter_id INT NOT NULL COMMENT '所属章节ID',
        title VARCHAR(200) NOT NULL COMMENT '课时标题',
        content TEXT NOT NULL COMMENT '课时内容',
        document_url VARCHAR(500) NULL COMMENT '文档URL',
        document_name VARCHAR(200) NULL COMMENT '文档原始文件名',
        order_index INT NOT NULL DEFAULT 0 COMMENT '排序索引',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
        INDEX idx_chapter_order (chapter_id, order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课时表'
    `);

    // 检查并添加 document_url 和 document_name 字段（如果表已存在但没有这些字段）
    try {
      await connection.query(`ALTER TABLE lessons ADD COLUMN document_url VARCHAR(500) NULL COMMENT '文档URL' AFTER content`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) {
        // 忽略列已存在的错误
      }
    }
    try {
      await connection.query(`ALTER TABLE lessons ADD COLUMN document_name VARCHAR(200) NULL COMMENT '文档原始文件名' AFTER document_url`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) {
        // 忽略列已存在的错误
      }
    }

    // 创建邀请码表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invitation_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE COMMENT '邀请码',
        description VARCHAR(200) COMMENT '备注说明',
        is_used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
        used_by VARCHAR(36) COMMENT '使用者用户ID',
        used_at TIMESTAMP NULL COMMENT '使用时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_is_used (is_used)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构邀请码表'
    `);

    // 创建 CSCA 平台专属用户数据表（存储平台特有用户字段）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_csca_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE COMMENT '引用 weland.users.id',
        extra JSON NULL COMMENT '平台专属的额外用户数据（可扩展）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CSCA 平台用户专属数据表'
    `);

    // 创建卡片类型表（包含平台支持的卡种）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS card_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE COMMENT '唯一编码，例如 wenke_chinese, like_chinese, math, physics, chemistry',
        name VARCHAR(200) NOT NULL COMMENT '显示名称',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡片类型表'
    `);

    // 创建用户卡片表（记录用户拥有哪些卡）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL COMMENT '引用 weland.users.id',
        card_type_id INT NOT NULL COMMENT '引用 card_types.id',
        quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
        expires_at DATETIME NULL COMMENT '过期时间，NULL代表不过期',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_cards_user_id (user_id),
        FOREIGN KEY (card_type_id) REFERENCES card_types(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户卡片持有表'
    `);

    // 插入默认卡片类型（如果尚不存在）
    try {
      await connection.query(`
        INSERT INTO card_types (code, name, description)
        VALUES
          ('wenke_chinese', '文科中文测试卡', '文科中文测试使用的卡'),
          ('like_chinese', '理科中文测试卡', '理科中文测试使用的卡'),
          ('math', '数学测试卡', '数学测试使用的卡'),
          ('physics', '物理测试卡', '物理测试使用的卡'),
          ('chemistry', '化学测试卡', '化学测试使用的卡')
        ON DUPLICATE KEY UPDATE name=VALUES(name)
      `);
    } catch (e:any) {
      // 忽略重复插入导致的错误
    }

    console.log('数据库表初始化完成');

    // 插入示例题目（如果表为空）
    const [questionRows] = await connection.query('SELECT COUNT(*) as count FROM questions');
    const count = (questionRows as any[])[0].count;

    if (count === 0) {
      await connection.query(`
        INSERT INTO questions (question_text, options, correct_answer, explanation, category, difficulty) VALUES
        ('下列哪个是中国的首都？', '["北京", "上海", "广州", "深圳"]', 0, '北京是中华人民共和国的首都。', '地理', 'easy'),
        ('"你好"的英文翻译是什么？', '["Hello", "Goodbye", "Thank you", "Sorry"]', 0, '"你好"的英文翻译是"Hello"。', '语言', 'easy'),
        ('1+1等于多少？', '["1", "2", "3", "4"]', 1, '1+1=2', '数学', 'easy'),
        ('下列哪个不是编程语言？', '["JavaScript", "Python", "HTML", "Java"]', 2, 'HTML是标记语言，不是编程语言。', '计算机', 'medium'),
        ('中国的面积约是多少平方公里？', '["约960万", "约860万", "约1060万", "约760万"]', 0, '中国陆地面积约960万平方公里。', '地理', 'medium')
      `);
      console.log('示例题目已插入');
    }

    // 插入默认模拟测试配置（如果表为空）
    const [configRows] = await connection.query('SELECT COUNT(*) as count FROM mock_test_configs');
    const configCount = (configRows as any[])[0].count;

    if (configCount === 0) {
      const [questionIds] = await connection.query('SELECT id FROM questions LIMIT 20');
      const ids = (questionIds as any[]).map(q => q.id);
      
      if (ids.length > 0) {
        await connection.query(`
          INSERT INTO mock_test_configs (name, duration_minutes, total_questions, question_ids) VALUES
          (?, 120, ?, ?)
        `, ['CSCA官方模拟测试', ids.length, JSON.stringify(ids)]);
        console.log('默认模拟测试配置已创建');
      } else {
        console.log('没有可用题目，跳过创建模拟测试配置');
      }
    }

    // 插入示例章节和课时（如果表为空）
    const [chapterRows] = await connection.query('SELECT COUNT(*) as count FROM chapters');
    const chapterCount = (chapterRows as any[])[0].count;

    if (chapterCount === 0) {
      // 插入章节
      await connection.query(`
        INSERT INTO chapters (title, description, order_index) VALUES
        ('第一章：数学基础', '学习数学基础知识，包括代数、几何等内容', 1),
        ('第二章：语言能力', '提升语言理解和表达能力', 2),
        ('第三章：地理知识', '了解中国和世界地理知识', 3),
        ('第四章：计算机基础', '掌握计算机基本概念和操作', 4)
      `);

      // 获取插入的章节ID
      const [chapters] = await connection.query('SELECT id FROM chapters ORDER BY order_index');
      const chapterIds = (chapters as any[]).map(c => c.id);

      if (chapterIds.length > 0) {
        // 为每个章节插入示例课时
        await connection.query(`
          INSERT INTO lessons (chapter_id, title, content, order_index) VALUES
          (?, '1.1 代数基础', '代数是数学的基础分支之一，主要研究数和符号之间的关系。在本课时中，我们将学习：\n\n1. 基本代数运算\n2. 方程式的解法\n3. 不等式的应用\n\n通过本课时的学习，您将掌握代数的基本概念和解题方法。', 1),
          (?, '1.2 几何图形', '几何学是研究空间形状和大小的数学分支。本课时内容包括：\n\n1. 平面几何图形\n2. 立体几何\n3. 几何证明\n\n学习几何有助于培养空间思维能力和逻辑推理能力。', 2),
          (?, '2.1 词汇理解', '词汇是语言的基础。本课时将帮助您：\n\n1. 扩大词汇量\n2. 理解词汇的语境含义\n3. 掌握词汇的正确用法\n\n通过大量练习，提升您的词汇理解能力。', 1),
          (?, '2.2 阅读理解', '阅读理解是语言能力的重要组成部分。本课时将学习：\n\n1. 快速阅读技巧\n2. 理解文章主旨\n3. 分析文章结构\n\n提高阅读理解能力，有助于更好地理解各类文本。', 2),
          (?, '3.1 中国地理', '了解中国的地理概况。本课时内容包括：\n\n1. 中国的地理位置和疆域\n2. 主要地形地貌\n3. 气候特点\n4. 主要河流和山脉\n\n通过学习，全面了解中国的地理环境。', 1),
          (?, '3.2 世界地理', '拓展世界地理知识。本课时将介绍：\n\n1. 世界各大洲概况\n2. 主要国家和地区\n3. 重要的地理特征\n\n开阔视野，了解世界地理知识。', 2),
          (?, '4.1 计算机基础概念', '学习计算机的基本知识。本课时包括：\n\n1. 计算机的发展历史\n2. 计算机的组成结构\n3. 操作系统基础\n\n掌握计算机基础知识，为深入学习打下基础。', 1),
          (?, '4.2 网络与互联网', '了解网络和互联网的基本概念。本课时将学习：\n\n1. 计算机网络基础\n2. 互联网的工作原理\n3. 网络安全知识\n\n学习网络知识，适应数字化时代的需求。', 2)
        `, [
          chapterIds[0], chapterIds[0],
          chapterIds[1], chapterIds[1],
          chapterIds[2], chapterIds[2],
          chapterIds[3], chapterIds[3]
        ]);
        console.log('示例章节和课时已插入');
      }
    }

  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

