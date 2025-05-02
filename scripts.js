const qrId = parseInt(new URLSearchParams(window.location.search).get('qr_id'));
const resultBox = document.getElementById('result');

const qrScanner = new Html5Qrcode("qr-reader");

// Escaneo de QR
qrScanner.start(
    { facingMode: "environment" },
    {
        fps: 10,
        qrbox: { width: 400, height: 400 }
    },
    (decodedText) => {
        qrScanner.stop(); // detener después de primer escaneo
        guardarEnServidor(decodedText, 'qr');
    },
    (error) => {
        // silencioso
    }
).catch(err => {
    console.error("Error iniciando cámara:", err);
});

// OCR de CDC impreso
document.getElementById('scan-cdc-btn').addEventListener('click', async () => {
    const video = document.querySelector("video");
    if (!video) return alert("Cámara no disponible.");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    resultBox.innerText = "Leyendo CDC, por favor espera...";

    const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        tessedit_char_whitelist: '0123456789'
    });

    const match = text.match(/CDC[:\s]*([\d\s]{40,})/i);
    if (!match) {
        resultBox.innerText = "No se detectó CDC. Intenta enfocar mejor.";
        return;
    }

    const cdcId = match[1].replace(/\s+/g, '');
    guardarEnServidor(cdcId, 'cdc');
});

function guardarEnServidor(value, tipo) {
    const body = {
        qr_id: qrId,
        cdc_id: tipo === 'cdc' ? value : undefined
    };

    fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
        resultBox.innerText = `✅ ${tipo.toUpperCase()} guardado correctamente.`;
    })
    .catch(err => {
        resultBox.innerText = `❌ Error al guardar ${tipo.toUpperCase()}: ` + err.message;
    });
}
