# NecroCode 👻⚡

**NecroCode** is an AI-powered diagnostic tool designed to analyze and resurrect abandoned or inactive open-source GitHub repositories. By examining commit histories, dependency graphs, and code snippets, NecroCode summons a spectral AI entity that diagnoses cause of death, generates actionable resurrection rituals, and provides interactive technical guidance.

Built for the **Hacktoberfest AI Challenge**.

---

## 🌟 Key Features

- **Spectral Repository Analysis:** Evaluates repository staleness, commit timestamps, and dependency state using authenticated GitHub API calls.
- **Open-Weight AI Intelligence:** Powered by `openai/gpt-oss-120b` via Groq for open-weight, Hacktoberfest-compliant analysis.
- **Resurrection Rituals & Patches:** Delivers step-by-step terminal restoration commands and code patch previews.
- **Interactive Séance Chat:** Real-time, multi-turn conversation with the repository's specter to debug issues, understand legacy decisions, and refactor code.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS (Hosted on Bolt.new)
- **Backend:** Node.js, Express, CORS (Hosted on Render)
- **AI Provider:** Groq SDK (`openai/gpt-oss-120b`)
- **Integrations:** GitHub REST API (`octokit` / REST endpoints)

---

## 🚀 Environment Variables

To run the backend locally or deploy to Render, configure the following environment variables:

| Variable | Description |
| :--- | :--- |
| `PORT` | Web server port (defaults to `10000` on Render) |
| `GROQ_API_KEY` | API Key for Groq AI inference |
| `GITHUB_TOKEN` | GitHub Personal Access Token (prevents REST API rate-limiting) |

---

## 💻 Local Setup & Development

1. Clone the repository:
   git clone https://github.com/Oasis-blue/necro-code.git
   cd necro-code

2. Install dependencies:
   npm install

3. Start the server:
   node server.js

---

## 📜 License

MIT License. Built with 💀 for Hacktoberfest.
