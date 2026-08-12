import os
import sys

import requests

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

API_KEY = os.environ.get("OPENROUTER_API_KEY")
url = "https://openrouter.ai/api/v1/chat/completions"

if not API_KEY:
    sys.exit("Falta configurar la variable de entorno OPENROUTER_API_KEY.")

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Prueba de API",
}

data = {
    "model": "deepseek/deepseek-chat",
    "messages": [
        {"role": "user", "content": "Hola, responde brevemente si la API funciona correctamente."}
    ]
}

try:
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()

    result = response.json()
    content = result["choices"][0]["message"]["content"]

    print("✅ Conexión exitosa. Respuesta del modelo:\n")
    print(content)

except requests.exceptions.HTTPError as err:
    print(f"❌ Error HTTP {err.response.status_code}: {err.response.text}")
except Exception as e:
    print(f"❌ Error inesperado: {e}")
