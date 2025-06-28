from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


# # Allow React dev server on localhost:3000
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.on_event("startup")
# def on_startup():
#     database.Base.metadata.create_all(bind=database.engine)


# @app.get("/health")
# def health_check():
#     return {"status": "ok"}
