import jsQR from "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.mjs";

const video = document.getElementById("qr-video");
const canvas = document.getElementById("qr-canvas");
const context = canvas.getContext("2d");

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        requestAnimationFrame(scanFrame);
    } catch (err) {
        alert("No se pudo acceder a la cámara: " + err.message);
    }
}

function scanFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

        if (code) {
            drawBox(code.location);
            const qrText = code.data;
            console.log("QR Detectado:", qrText);

            // Obtener el cdc_id de la URL del QR
            const qrUrl = new URL(qrText);
            const cdcId = qrUrl.searchParams.get("Id");
            const qrId = qrUrl.searchParams.get("qr_id");

            if (!cdcId || !qrId) {
                alert("QR inválido");
                return;
            }

            // Enviar a la API
            fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cdc_id: cdcId, qr_id: parseInt(qrId) })
            })
            .then(res => res.json())
            .then(data => {
                alert("Código leído y enviado correctamente.");
                window.location.href = "/"; // Redirige a home o a donde quieras
            })
            .catch(err => {
                alert("Error al enviar el QR: " + err.message);
            });

            return; // Detiene el loop tras escanear
        }
    }
    requestAnimationFrame(scanFrame);
}

function drawBox(location) {
    context.beginPath();
    context.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    context.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    context.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    context.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    context.closePath();
    context.lineWidth = 4;
    context.strokeStyle = "#00FF00";
    context.stroke();
}

window.addEventListener("DOMContentLoaded", startCamera);
