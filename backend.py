from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from openai import OpenAI
import uvicorn
import threading
import webbrowser
from google import genai

# GPT API 키 로드
with open('Student09.txt') as f:
    api_key = f.read().strip()

with open('genai-api-key', 'r') as f:
    API_KEY = f.read().strip()

client = OpenAI(api_key=api_key)

# Gemini API 초기화
gemini_client = genai.Client(api_key=API_KEY)

# FastAPI 앱 초기화
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 채팅 로그
chat_log = []  # [{"message": "Hi"}]

# ✅ Pydantic 모델 정의
class Message(BaseModel):
    message: str

class ModelMessage(Message):
    model: str  # "gpt" 또는 "gemini"

# ✅ 전체 메시지 반환
@app.get("/messages", response_model=List[Message])
def get_messages():
    return chat_log

# ✅ GPT 처리
@app.post("/messages", response_model=List[Message])
def post_gpt_message(user_input: Message):
    chat_log.append({"message": user_input.message})

    gpt_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            *[{"role": "user", "content": m["message"]} for i, m in enumerate(chat_log) if i % 2 == 0],
        ],
        max_tokens=100,
        temperature=0.7,
    )

    gpt_message = gpt_response.choices[0].message.content.strip()
    chat_log.append({"message": gpt_message})

    return chat_log

# ✅ Gemini 처리
@app.post("/gemini", response_model=List[Message])
def post_gemini_message(user_input: Message):
    chat_log.append({"message": user_input.message})

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_input.message
    )
    gemini_message = response.text.strip()

    chat_log.append({"message": gemini_message})
    return chat_log

# ✅ unified 처리 (gpt/gemini + @image)
@app.post("/unified", response_model=List[Message])
def post_unified_message(request: ModelMessage):
    chat_log.append({"message": request.message})

    # 이미지 요청 처리
    if request.message.startswith("@image"):
        prompt = request.message.replace("@image", "").strip()
        try:
            image_response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size="1024x1024"
            )
            image_url = image_response.data[0].url
            image_message = f"[이미지 생성됨] {prompt}\n{image_url}"
            chat_log.append({"message": image_message})
            return chat_log
        except Exception as e:
            chat_log.append({"message": f"❌ 이미지 생성 실패: {str(e)}"})
            return chat_log

    # GPT 처리
    if request.model.lower() == "gpt":
        prompt = request.message.replace("@image", "").strip()
        gpt_response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            n=1,
            size="1024x1024")
        image_url = gpt_response.data[0].url
        image_message = f"[이미지 생성됨] {prompt}\n{image_url}"
        chat_log.append({"message": image_message})
        return chat_log

    # Gemini 처리
    elif request.model.lower() == "gemini":
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=request.message
        )
        gemini_message = response.text.strip()
        chat_log.append({"message": gemini_message})
        return chat_log

    # 지원되지 않는 모델
    else:
        chat_log.append({"message": "❌ 지원하지 않는 모델입니다. (gpt/gemini)"})
        return chat_log

# ✅ 브라우저 자동 실행
def open_browser():
    webbrowser.open_new("http://localhost:8000/docs")

# ✅ 앱 실행
if __name__ == "__main__":
    threading.Timer(1.0, open_browser).start()
    uvicorn.run("backend:app", host="127.0.0.1", port=8000, reload=True)
