require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

// Enable full CORS for all origins and headers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchRepoDetails(owner, repo) {
  try {
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!metaRes.ok) throw new Error('Repository not found in the mortal realm');
    const meta = await metaRes.json();

    let readme = '';
    let packageJson = '';

    try {
      const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
      readme = readmeRes.ok ? await readmeRes.text() : '';
    } catch (e) {}

    try {
      const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
      packageJson = pkgRes.ok ? await pkgRes.text() : '';
    } catch (e) {}

    return {
      name: meta.full_name,
      description: meta.description || 'No description left behind.',
      stars: meta.stargazers_count,
      lastPushed: meta.pushed_at,
      readme: readme.slice(0, 1500),
      packageJson: packageJson.slice(0, 1000)
    };
  } catch (err) {
    throw err;
  }
}

app.post('/api/summon', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'Provide a repo URL (e.g., owner/repo)' });

    const cleanPath = repoUrl.replace('https://github.com/', '').replace('.git', '').trim();
    const [owner, repo] = cleanPath.split('/');

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repo format. Use owner/repo' });
    }

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
      model: 'gemma2-9b-it',
      response_format: { type: 'json_object' }
    });

    const ghostAnalysis = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, repo: repoData, ghostAnalysis });

  } catch (err) {
    console.error('Summon error:', err);
    res.status(500).json({ error: err.message || 'Failed to summon specter.' });
  }
});

app.post('/api/seance-chat', async (req, res) => {
  try {
    const { repoName, question, history = [] } = req.body;
    
    const messages = [
      { 
        role: 'system', 
        content: `You are the Ghost of the abandoned repo "${repoName}". Answer the developer's question in an eerie, witty, haunting tone while providing genuine, accurate technical advice.` 
      },
      ...history,
      { role: 'user', content: question }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'gemma2-9b-it'
    });

    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'The spectral link was severed.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'Séance Chamber Live' }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔮 NecroCode Séance Server live on port ${PORT}`));
