const express = require('express');
const path = require('path');
const { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } = require('@google/adk');

const app = express();
const PORT = process.env.PORT || 3002;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-3.5-flash';
const MODEL_LABEL = 'Gemini 3.5 Flash + ADK';
const APP_NAME = 'taskflow';
const USER_ID = 'taskflow-user';

app.use(express.static('public'));
app.use(express.json());

const adkRunner = GOOGLE_KEY
  ? new InMemoryRunner({
      appName: APP_NAME,
      agent: new LlmAgent({
        name: 'TaskFlow',
        model: MODEL_NAME,
        instruction: [
          'You are TaskFlow, an autonomous workflow agent.',
          'Break the task into practical steps, describe what each step does, and summarize the result.',
          'Return strict JSON only with this shape:',
          '{"plan":["step 1","step 2"],"execution":[{"step":"step 1","action":"what you did","result":"outcome","status":"success"}],"summary":"what was accomplished"}',
          'Do not use markdown, backticks, or commentary outside the JSON object.'
        ].join(' ')
      })
    })
  : null;

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/api/execute', async (req, res) => {
  const task = typeof req.body?.task === 'string' ? req.body.task.trim() : '';
  if (!task) {
    return res.status(400).json({ error: 'No task provided' });
  }

  if (!adkRunner) {
    return res.json(executeMock(task));
  }

  try {
    const rawText = await runTaskFlow(task);
    const parsed = parseAgentResponse(rawText, task);
    return res.json({ success: true, ...parsed, model: MODEL_LABEL });
  } catch (error) {
    console.error(error?.message || error);
    return res.json(executeMock(task));
  }
});

async function runTaskFlow(task) {
  let finalText = '';

  for await (const event of adkRunner.runEphemeral({
    userId: USER_ID,
    newMessage: {
      role: 'user',
      parts: [{ text: task }]
    }
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event).trim();
    }
  }

  if (!finalText) {
    throw new Error('TaskFlow did not return a final response.');
  }

  return finalText;
}

function parseAgentResponse(text, task) {
  const cleaned = stripCodeFences(text);
  const parsed = JSON.parse(cleaned);

  return normalizeResult(parsed, task);
}

function normalizeResult(result, task) {
  const plan = Array.isArray(result.plan) ? result.plan.map(toText) : [];
  const execution = Array.isArray(result.execution)
    ? result.execution.map((item, index) => ({
        step: toText(item.step || plan[index] || `Step ${index + 1}`),
        action: toText(item.action || ''),
        result: toText(item.result || ''),
        status: toText(item.status || 'success') || 'success'
      }))
    : [];

  return {
    success: true,
    plan: plan.length ? plan : [`Review: ${task}`],
    execution: execution.length
      ? execution
      : [
          {
            step: `Review: ${task}`,
            action: 'Parsed the model response',
            result: toText(result.summary || 'No execution details returned.'),
            status: 'success'
          }
        ],
    summary: toText(result.summary || `TaskFlow completed: "${task}"`)
  };
}

function stripCodeFences(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function toText(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function executeMock(task) {
  const steps = [`Analyzing: "${task}"`, 'Breaking into subtasks', 'Executing data collection', 'Processing results', 'Finalizing'];
  return {
    success: true,
    model: 'mock',
    plan: steps,
    execution: steps.map((step, index) => ({ step, action: `Step ${index + 1}`, result: 'Completed', status: 'success' })),
    summary: `TaskFlow completed: "${task}"`
  };
}

app.listen(PORT, '0.0.0.0', () => console.log(`TaskFlow: http://localhost:${PORT}`));
