import express, { Response } from 'express';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 调用 DeepSeek API 分析知识点错题
async function analyzeKnowledgePointErrors(
  knowledgePoint: string,
  wrongQuestions: QuestionDetail[],
  subject: string | null
): Promise<{ suggestedQuestions: string[]; analysisReview: string; studyAdvice: string }> {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API Key 未配置');
  }

  // 构建错题信息
  const questionsInfo = wrongQuestions.map((q, idx) => {
    const userAnswerLetter = q.user_answer >= 0 ? String.fromCharCode(65 + q.user_answer) : '未作答';
    const correctAnswerLetter = String.fromCharCode(65 + q.correct_answer);
    return `错题${idx + 1}：
题目：${q.question_text}
选项：
A. ${q.options[0]}
B. ${q.options[1]}
C. ${q.options[2]}
D. ${q.options[3]}
学生答案：${userAnswerLetter}
正确答案：${correctAnswerLetter}
${q.explanation ? `解析：${q.explanation}` : ''}`;
  }).join('\n\n');

  const prompt = `你是一位专业的教学分析专家。请根据以下学生在"${knowledgePoint}"知识点的错题情况，进行分析并给出建议。

${subject ? `科目：${subject}` : ''}
知识点：${knowledgePoint}
错题数量：${wrongQuestions.length}题

${questionsInfo}

请严格按照以下JSON格式返回分析结果：
{
  "suggested_questions": [
    "学生可能会问的问题1",
    "学生可能会问的问题2",
    "学生可能会问的问题3"
  ],
  "analysis_review": "针对这些错题的分析复盘，说明学生可能存在的知识盲点和理解误区",
  "study_advice": "针对性的复习建议，包括需要重点复习的内容和学习方法建议"
}

注意：
1. suggested_questions 应该是学生在学习过程中可能会提出的3-5个典型问题
2. analysis_review 应该分析错误原因，找出共性问题
3. study_advice 应该给出具体可操作的复习建议
4. 只输出JSON，不要有其他文字`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('DeepSeek API 响应中没有内容');
  }

  // 提取JSON
  let jsonStr = content;
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = content.slice(jsonStart, jsonEnd + 1);
    }
  }

  const result = JSON.parse(jsonStr);
  return {
    suggestedQuestions: result.suggested_questions || [],
    analysisReview: result.analysis_review || '',
    studyAdvice: result.study_advice || ''
  };
}

// 后台AI分析任务
async function runAiAnalysisTask(examId: number, questionDetails: QuestionDetail[], subject: string | null) {
  try {
    // 更新状态为 processing
    await cscaPool.query(
      `UPDATE test_results SET ai_analysis_status = 'processing' WHERE id = ?`,
      [examId]
    );

    // 按知识点分组错题
    const kpWrongQuestions: Record<string, QuestionDetail[]> = {};
    const kpTotalQuestions: Record<string, number> = {};

    questionDetails.forEach((q) => {
      const kp = q.knowledge_point || '未分类';
      if (!kpTotalQuestions[kp]) kpTotalQuestions[kp] = 0;
      kpTotalQuestions[kp]++;

      if (!q.is_correct) {
        if (!kpWrongQuestions[kp]) kpWrongQuestions[kp] = [];
        kpWrongQuestions[kp].push(q);
      }
    });

    // 逐个知识点分析（跳过全对的知识点）
    for (const kp of Object.keys(kpWrongQuestions)) {
      const wrongQuestions = kpWrongQuestions[kp];
      if (wrongQuestions.length === 0) continue; // 跳过全对的知识点

      try {
        console.log(`开始分析知识点: ${kp}, 错题数: ${wrongQuestions.length}`);
        
        const analysis = await analyzeKnowledgePointErrors(kp, wrongQuestions, subject);

        // 保存分析结果
        await cscaPool.query(
          `INSERT INTO exam_kp_ai_analysis (exam_result_id, knowledge_point, suggested_questions, analysis_review, study_advice)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE suggested_questions = VALUES(suggested_questions), 
                                   analysis_review = VALUES(analysis_review), 
                                   study_advice = VALUES(study_advice)`,
          [examId, kp, JSON.stringify(analysis.suggestedQuestions), analysis.analysisReview, analysis.studyAdvice]
        );

        console.log(`知识点 ${kp} 分析完成`);
      } catch (error: any) {
        console.error(`知识点 ${kp} 分析失败:`, error.message);
        // 继续处理其他知识点
      }
    }

    // 更新状态为 completed
    await cscaPool.query(
      `UPDATE test_results SET ai_analysis_status = 'completed' WHERE id = ?`,
      [examId]
    );

    console.log(`考试 ${examId} AI分析完成`);
  } catch (error: any) {
    console.error(`考试 ${examId} AI分析失败:`, error.message);
    // 更新状态为 failed
    await cscaPool.query(
      `UPDATE test_results SET ai_analysis_status = 'failed', ai_analysis_error = ? WHERE id = ?`,
      [error.message, examId]
    );
  }
}

interface QuestionDetail {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  user_answer: number;
  is_correct: boolean;
  knowledge_point?: string;
  difficulty?: string;
  explanation?: string;
  image_url?: string;
}

// 提交测试结果（扩展版）
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { testType, answers, questionIds, subject, difficultyLevel, durationMinutes } = req.body;
    const userId = req.userId!;

    if (!testType || !answers || !questionIds) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    // 获取题目详细信息（包含知识点、解析等）
    const placeholders = questionIds.map(() => '?').join(',');
    const [questions] = await cscaPool.query(
      `SELECT id, question_text, options, correct_answer, knowledge_point, difficulty, explanation, image_url 
       FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );

    const questionMap = new Map(
      (questions as any[]).map(q => [q.id, q])
    );

    // 计算分数并构建题目详情
    let score = 0;
    const totalQuestions = questionIds.length;
    const questionDetails: QuestionDetail[] = [];

    questionIds.forEach((qId: number, index: number) => {
      const question = questionMap.get(qId);
      if (question) {
        const isCorrect = question.correct_answer === answers[index];
        if (isCorrect) score++;

        questionDetails.push({
          id: question.id,
          question_text: question.question_text,
          options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
          correct_answer: question.correct_answer,
          user_answer: answers[index],
          is_correct: isCorrect,
          knowledge_point: question.knowledge_point || null,
          difficulty: question.difficulty || 'medium',
          explanation: question.explanation || null,
          image_url: question.image_url || null,
        });
      }
    });

    // 检查是否有错题，决定是否需要AI分析
    const hasWrongQuestions = questionDetails.some(q => !q.is_correct);
    const aiAnalysisStatus = hasWrongQuestions ? 'pending' : 'completed';

    // 保存测试结果（包含完整题目详情）
    const [result] = await cscaPool.query(
      `INSERT INTO test_results (user_id, test_type, score, total_questions, answers, subject, difficulty_level, duration_minutes, question_details, ai_analysis_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        testType, 
        score, 
        totalQuestions, 
        JSON.stringify(answers),
        subject || null,
        difficultyLevel || null,
        durationMinutes || null,
        JSON.stringify(questionDetails),
        aiAnalysisStatus
      ]
    );

    const insertId = (result as any).insertId;

    // 如果有错题，启动后台AI分析任务（异步执行，不阻塞响应）
    if (hasWrongQuestions && testType === 'mock') {
      setImmediate(() => {
        runAiAnalysisTask(insertId, questionDetails, subject || null);
      });
    }

    res.json({
      success: true,
      data: {
        id: insertId,
        score,
        total: totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100)
      }
    });
  } catch (error) {
    console.error('提交测试错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户的测试历史列表
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { testType, limit = 50, offset = 0 } = req.query;

    let query = `SELECT id, test_type, score, total_questions, subject, difficulty_level, duration_minutes, created_at 
                 FROM test_results WHERE user_id = ?`;
    const params: any[] = [userId];

    if (testType) {
      query += ' AND test_type = ?';
      params.push(testType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [results] = await cscaPool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM test_results WHERE user_id = ?';
    const countParams: any[] = [userId];
    if (testType) {
      countQuery += ' AND test_type = ?';
      countParams.push(testType);
    }
    const [countResult] = await cscaPool.query(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    res.json({
      success: true,
      data: {
        records: results,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('获取测试历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单次考试的详细结果（包含题目详情和知识点分析）
router.get('/detail/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const examId = req.params.id;

    const [results] = await cscaPool.query(
      `SELECT * FROM test_results WHERE id = ? AND user_id = ?`,
      [examId, userId]
    );

    if ((results as any[]).length === 0) {
      return res.status(404).json({ message: '考试记录不存在' });
    }

    const exam = (results as any[])[0];
    
    // 解析JSON字段
    const questionDetails = typeof exam.question_details === 'string' 
      ? JSON.parse(exam.question_details) 
      : exam.question_details || [];
    const answers = typeof exam.answers === 'string' 
      ? JSON.parse(exam.answers) 
      : exam.answers || [];

    // 统计知识点正确率
    const knowledgePointStats: Record<string, { total: number; correct: number; questions: any[] }> = {};
    
    questionDetails.forEach((q: QuestionDetail) => {
      const kp = q.knowledge_point || '未分类';
      if (!knowledgePointStats[kp]) {
        knowledgePointStats[kp] = { total: 0, correct: 0, questions: [] };
      }
      knowledgePointStats[kp].total++;
      if (q.is_correct) {
        knowledgePointStats[kp].correct++;
      }
      knowledgePointStats[kp].questions.push(q);
    });

    // 转换为数组格式
    const knowledgePointAnalysis = Object.entries(knowledgePointStats).map(([kp, stats]) => ({
      knowledge_point: kp,
      total: stats.total,
      correct: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      wrong_questions: stats.questions.filter(q => !q.is_correct)
    }));

    // 按正确率排序（低到高，便于复盘）
    knowledgePointAnalysis.sort((a, b) => a.accuracy - b.accuracy);

    // 获取错题知识点列表（去重）
    const wrongKnowledgePoints = [...new Set(
      questionDetails
        .filter((q: QuestionDetail) => !q.is_correct)
        .map((q: QuestionDetail) => q.knowledge_point || '未分类')
    )];

    // 获取AI分析结果
    const [aiAnalysisResults] = await cscaPool.query(
      `SELECT knowledge_point, suggested_questions, analysis_review, study_advice 
       FROM exam_kp_ai_analysis WHERE exam_result_id = ?`,
      [examId]
    );

    // 转换AI分析结果为便于查询的Map格式
    const aiAnalysisMap: Record<string, {
      suggestedQuestions: string[];
      analysisReview: string;
      studyAdvice: string;
    }> = {};

    (aiAnalysisResults as any[]).forEach(row => {
      aiAnalysisMap[row.knowledge_point] = {
        suggestedQuestions: typeof row.suggested_questions === 'string' 
          ? JSON.parse(row.suggested_questions) 
          : row.suggested_questions || [],
        analysisReview: row.analysis_review || '',
        studyAdvice: row.study_advice || ''
      };
    });

    res.json({
      success: true,
      data: {
        id: exam.id,
        testType: exam.test_type,
        score: exam.score,
        totalQuestions: exam.total_questions,
        percentage: Math.round((exam.score / exam.total_questions) * 100),
        subject: exam.subject,
        difficultyLevel: exam.difficulty_level,
        durationMinutes: exam.duration_minutes,
        createdAt: exam.created_at,
        questionDetails,
        knowledgePointAnalysis,
        wrongKnowledgePoints,
        aiAnalysisStatus: exam.ai_analysis_status || 'pending',
        aiAnalysisError: exam.ai_analysis_error || null,
        aiAnalysis: aiAnalysisMap
      }
    });
  } catch (error) {
    console.error('获取考试详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取AI分析状态
router.get('/ai-analysis-status/:examId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const examId = req.params.examId;

    const [results] = await cscaPool.query(
      `SELECT ai_analysis_status, ai_analysis_error FROM test_results WHERE id = ? AND user_id = ?`,
      [examId, userId]
    );

    if ((results as any[]).length === 0) {
      return res.status(404).json({ message: '考试记录不存在' });
    }

    const exam = (results as any[])[0];

    res.json({
      success: true,
      data: {
        status: exam.ai_analysis_status || 'pending',
        error: exam.ai_analysis_error || null
      }
    });
  } catch (error) {
    console.error('获取AI分析状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取或创建复盘进度
router.get('/review-progress/:examId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const examId = req.params.examId;

    // 检查考试记录是否存在
    const [exams] = await cscaPool.query(
      `SELECT * FROM test_results WHERE id = ? AND user_id = ?`,
      [examId, userId]
    );

    if ((exams as any[]).length === 0) {
      return res.status(404).json({ message: '考试记录不存在' });
    }

    // 查找现有进度
    const [progressResults] = await cscaPool.query(
      `SELECT * FROM exam_review_progress WHERE exam_result_id = ? AND user_id = ?`,
      [examId, userId]
    );

    if ((progressResults as any[]).length > 0) {
      const progress = (progressResults as any[])[0];
      res.json({
        success: true,
        data: {
          id: progress.id,
          knowledgePointQueue: typeof progress.knowledge_point_queue === 'string' 
            ? JSON.parse(progress.knowledge_point_queue) 
            : progress.knowledge_point_queue,
          currentIndex: progress.current_index,
          completedPoints: typeof progress.completed_points === 'string' 
            ? JSON.parse(progress.completed_points) 
            : progress.completed_points || [],
          practiceRecords: typeof progress.practice_records === 'string' 
            ? JSON.parse(progress.practice_records) 
            : progress.practice_records || {},
          isCompleted: progress.is_completed
        }
      });
    } else {
      // 不存在则返回需要创建
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('获取复盘进度错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建复盘进度
router.post('/review-progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { examId, knowledgePointQueue } = req.body;

    if (!examId || !knowledgePointQueue) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    // 检查是否已存在
    const [existing] = await cscaPool.query(
      `SELECT id FROM exam_review_progress WHERE exam_result_id = ? AND user_id = ?`,
      [examId, userId]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({ message: '复盘进度已存在' });
    }

    const [result] = await cscaPool.query(
      `INSERT INTO exam_review_progress (user_id, exam_result_id, knowledge_point_queue, current_index, completed_points, practice_records) 
       VALUES (?, ?, ?, 0, '[]', '{}')`,
      [userId, examId, JSON.stringify(knowledgePointQueue)]
    );

    res.json({
      success: true,
      data: {
        id: (result as any).insertId,
        knowledgePointQueue,
        currentIndex: 0,
        completedPoints: [],
        practiceRecords: {},
        isCompleted: false
      }
    });
  } catch (error) {
    console.error('创建复盘进度错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新复盘进度
router.put('/review-progress/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const progressId = req.params.id;
    const { currentIndex, completedPoints, practiceRecords, isCompleted } = req.body;

    // 验证权限
    const [existing] = await cscaPool.query(
      `SELECT id FROM exam_review_progress WHERE id = ? AND user_id = ?`,
      [progressId, userId]
    );

    if ((existing as any[]).length === 0) {
      return res.status(404).json({ message: '复盘进度不存在' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (currentIndex !== undefined) {
      updates.push('current_index = ?');
      params.push(currentIndex);
    }
    if (completedPoints !== undefined) {
      updates.push('completed_points = ?');
      params.push(JSON.stringify(completedPoints));
    }
    if (practiceRecords !== undefined) {
      updates.push('practice_records = ?');
      params.push(JSON.stringify(practiceRecords));
    }
    if (isCompleted !== undefined) {
      updates.push('is_completed = ?');
      params.push(isCompleted);
    }

    if (updates.length > 0) {
      params.push(progressId);
      await cscaPool.query(
        `UPDATE exam_review_progress SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('更新复盘进度错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取知识点的练习题（用于复盘时抽取额外题目）
router.get('/practice-questions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgePoint, category, excludeIds } = req.query;

    if (!knowledgePoint) {
      return res.status(400).json({ message: '缺少知识点参数' });
    }

    // 确定查询的科目
    let categoryForQuery = category as string;
    if (category === '文科中文' || category === '理科中文') {
      categoryForQuery = '中文';
    }

    // 排除已有题目
    const excludeIdList = excludeIds ? (excludeIds as string).split(',').map(Number) : [];
    
    // 分别获取三个难度的题目
    const difficulties = ['easy', 'medium', 'hard'];
    const practiceQuestions: any[] = [];

    for (const difficulty of difficulties) {
      let query = `SELECT id, question_text, options, correct_answer, knowledge_point, difficulty, explanation, image_url 
                   FROM questions 
                   WHERE knowledge_point = ? AND difficulty = ?`;
      const params: any[] = [knowledgePoint, difficulty];

      if (categoryForQuery) {
        query += ' AND category = ?';
        params.push(categoryForQuery);
      }

      if (excludeIdList.length > 0) {
        query += ` AND id NOT IN (${excludeIdList.map(() => '?').join(',')})`;
        params.push(...excludeIdList);
      }

      query += ' ORDER BY RAND() LIMIT 1';

      const [questions] = await cscaPool.query(query, params);
      
      if ((questions as any[]).length > 0) {
        const q = (questions as any[])[0];
        practiceQuestions.push({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        });
      }
    }

    res.json({
      success: true,
      data: practiceQuestions
    });
  } catch (error) {
    console.error('获取练习题错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
