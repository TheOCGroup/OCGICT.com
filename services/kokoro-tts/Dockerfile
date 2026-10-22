# OCG Kokoro TTS service — independently deployable, no other OCG service
# depends on its image. Model files are downloaded at build time from the
# kokoro-onnx model-files release (Apache-2.0 model weights, Kokoro-82M).
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ADD https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx /app/kokoro-v1.0.onnx
ADD https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin /app/voices-v1.0.bin

COPY app.py .
ENV KOKORO_MODEL=/app/kokoro-v1.0.onnx KOKORO_VOICES=/app/voices-v1.0.bin PORT=8020
EXPOSE 8020
# OCG_KOKORO_TTS_KEY must be supplied at run time; the service refuses to
# start without it. Run behind TLS (reverse proxy / platform ingress).
CMD ["python", "app.py"]
