# TaskForge

| Sprint       | Goals                                                                 | Tools / Notes                                      |
| ------------ | --------------------------------------------------------------------- | -------------------------------------------------- |
| **Sprint 1** | ✅ Setup project monorepo (frontend, backend, shared lib), Docker for MongoDB | Next.js, FastAPI, MongoDB (Docker Compose)         |
| **Sprint 2** | 🔁 Prompt → LLM → Task Tree (JSON), basic schema & backend endpoint   | GPT-4 API / placeholder, FastAPI                   |
| **Sprint 3** | 🖼️ Display task tree in UI, initial drag & drop board                 | Next.js, Zustand/Redux, Tailwind, dnd-kit          |
| **Sprint 4** | 🔁 WebSocket for board sync, real-time multi-user                     | FastAPI WebSockets or Socket.IO                    |
| **Sprint 5** | 🔗 Task dependency logic (graph), validate task start order           | `networkx` or custom logic                         |
| **Sprint 6** | ⏳ Time estimator (LLM), assign user logic, effort estimation          | GPT-4 API, add `estimated_time`, `assignee` fields |
| **Sprint 7** | 💾 Export board to Trello/Notion, save version snapshots              | Trello API, Notion API, versioning in MongoDB      |
| **Sprint 8** | 🔐 Auth (email login, session), polish UI/UX, deploy to Railway/Vercel| Auth.js (NextAuth), Tailwind polish                |
| **Sprint 9** | 🧠 Prompt tuning (few-shot), improve task quality, custom model option| GPT-4 Turbo or fine-tuned LLaMA (optional)         |

### Sprint 1 Checklist

| No. | Task Area         | Description                                         | Status |
|-----|-------------------|-----------------------------------------------------|--------|
| 1   | Project Structure | Create folder structure: `backend/`, `frontend/`, `shared/` | ✅      |
| 2   | MongoDB Docker    | Set up `docker-compose.yml` and run MongoDB         | ✅      |
| 3   | Backend Setup     | Initialize FastAPI and create `/ping` endpoint      | ✅      |
| 4   | Frontend Setup    | Initialize Next.js and install Tailwind CSS         | ✅      |
| 5   | GitHub            | Initialize Git repo and push to GitHub              | ✅      |