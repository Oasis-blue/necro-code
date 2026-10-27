require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchRepoDetails(owner, repo) {
  const headers = { 'User-Agent': 'NecroCode-App' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  
  if (!metaRes.ok) {
    if (metaRes.status === 404) {
      throw new Error(`Repository '${owner}/${repo}' was not found on GitHub.`);
    }
    console.log(`GitHub API status ${metaRes.status}, attempting raw branch reads.`);
  }

  const meta = metaRes.ok ? await metaRes.json() : {};
  const defaultBranch = meta.default_branch || 'main';

  let readme = '';
  let packageJson = '';

  try {
    const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`);
    readme = readmeRes.ok ? await readmeRes.text() : '';
  } catch (e) {}

  try {
    const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/package.json`);
    packageJson = pkgRes.ok ? await pkgRes.text() : '';
  } catch (e) {}

  return {
    name: meta.full_name || `${owner}/${repo}`,
    description: meta.description || 'An unmaintained software artifact.',
    stars: meta.stargazers_count || 0,
    lastPushed: meta.pushed_at || 'Unknown date',
    readme: readme.slice(0, 1500) || 'No README found.',
    packageJson: packageJson.slice(0, 1000) || 'No package.json found.'
  };
}

app.post('/api/summon', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'Provide a repo URL (e.g., owner/repo)' });

    const cleanPath = repoUrl.replace('https://github.com/', '').replace('.git', '').trim();
    const parts = cleanPath.split('/').filter(Boolean);
    
    if (parts.length < 2) {
      return res.status(400).json({ error: 'Invalid repo format. Use owner/repo' });
    }

    const [owner, repo] = parts;
    const repoData = await fetchRepoDetails(owner, repo);

    const prompt = `You are the Ghost of the abandoned GitHub repository "${repoData.name}". 
Speak in character as a haunting, melancholic specter trapped in the digital ether. 
Your code hasn't been touched since ${repoData.lastPushed}.

Repository Details:
Description: ${repoData.description}
Stars: ${repoData.stars}
package.json snippet: ${repoData.packageJson}
README snippet: ${repoData.readme}

Respond ONLY with a valid JSON object matching this schema:
{
  "ghostGreeting": "A 1-2 sentence eerie greeting from the specter of this repo.",
  "timeSinceDeath": "Human readable time since last commit",
  "causeOfDeath": "A short dramatic diagnosis of why this codebase died.",
  "spectralDiagnosis": ["Point 1 about old bugs/outdated deps", "Point 2", "Point 3"],
  "resurrectionRitual": ["Terminal step 1 to revive code", "Terminal step 2", "Terminal step 3"],
  "patchPreview": "A small code snippet or command patch to fix the biggest issue."
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' }
    });

    const ghostAnalysis = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, repo: repoData, ghostAnalysis });

  } catch (err) {
    console.error('Summon error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to summon specter.' });
  }
});

app.post('/api/seance-chat', async (req, res) => {
  try {
    const rawMessages = req.body.messages || req.body.history || [];
    const rawRepo = req.body.repoName || req.body.repoUrl || 'this repository';
    const repoName = rawRepo.replace('https://github.com/', '');

    // Extract latest user question from standalone field OR last item in messages array
    let question = req.body.question || req.body.message || req.body.prompt;
    
    let historyToClean = Array.isArray(rawMessages) ? [...rawMessages] : [];

    if (!question && historyToClean.length > 0) {
      const lastMsg = historyToClean[historyToClean.length - 1];
      if (lastMsg && (lastMsg.role === 'user' || lastMsg.sender === 'user')) {
        question = lastMsg.content || lastMsg.text;
        historyToClean.pop(); // Remove user question from history stack so it isn't duplicated
      }
    }

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const cleanHistory = historyToClean
      .map(msg => ({
        role: (msg.role === 'ghost' || msg.sender === 'ghost' || msg.role === 'assistant') ? 'assistant' : 'user',
        content: String(msg.content || msg.text || '').trim()
      }))
      .filter(msg => msg.content.length > 0);

    const messages = [
      { 
        role: 'system', 
        content: `You are the Ghost of the abandoned repo "${repoName}". Answer the developer's question in an eerie, witty, haunting tone while providing genuine, accurate technical advice.` 
      },
      ...cleanHistory,
      { role: 'user', content: String(question).trim() }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'openai/gpt-oss-120b'
    });

    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('Chat error details:', err.message);
    res.status(500).json({ error: 'The spectral link was severed.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'Séance Chamber Live' }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔮 NecroCode Séance Server live on port ${PORT}`));
