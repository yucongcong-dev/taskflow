const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3002;
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;


app.use(express.static('public'));
app.use(express.json());


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));


app.post('/api/execute', async (req, res) => {
  try {
    const { task } = req.body;
    if (!task) return res.status(400).json({ error: 'No task provided' });
    if (!genAI) return res.json(executeMock(task));


    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `You are TaskFlow, an autonomous workflow agent. Given a task, break it down into steps and simulate executing them.
Task: "${task}"
Respond in strict JSON format (no markdown, no code blocks):
{"plan":["step 1","step 2"],"execution":[{"step":"step 1","action":"what you did","result":"outcome","status":"success"}],"summary":"what was accomplished"}`;


    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/\`\`\`json\n?/g,'').replace(/\`\`\`/g,'').trim();
    const json = JSON.parse(text);
    res.json({ success: true, ...json, model: 'gemini-3.5-flash' });
  } catch (e) {
    console.error(e.message);
    res.json(executeMock(req.body.task));
  }
});


function executeMock(task) {
  const steps = [`Analyzing: "${task}"`, 'Breaking into subtasks', 'Executing data collection', 'Processing results', 'Finalizing'];
  return {
    success: true, model: 'mock',
    plan: steps,
    execution: steps.map((s, i) => ({ step: s, action: `Step ${i+1}`, result: 'Completed', status: 'success' })),
    summary: `TaskFlow completed: "${task}"`
  };
}


app.listen(PORT, () => console.log(`TaskFlow: http://localhost:${PORT}`));
