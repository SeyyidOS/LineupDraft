# LineupDraft

This project contains a React frontend and a FastAPI backend. By default the frontend expects the API server to run on `http://localhost:8000`. To deploy the application publicly you can build the frontend and host it on a static hosting provider and run the backend on any cloud service.

## Building the frontend

```
cd frontend
npm install
npm run build
```

The production files will be located in `frontend/build`. You can deploy this directory to services like Netlify, Vercel or any static web host.

Set the API base URL by defining `REACT_APP_API_URL` before building or in an `.env` file. See `.env.example` for a template.

## Running the backend

```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Deploy the backend using a provider that supports Python web services (e.g. Render, DigitalOcean, Railway).

Ensure the `REACT_APP_API_URL` in the frontend points to the public URL of your backend.
