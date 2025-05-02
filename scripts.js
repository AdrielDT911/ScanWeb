import QrScanner from "https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js";

// Configurar el Worker Path para la librería
QrScanner.WORKER_PATH = 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner-worker.min.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Intentamos obtener la cámara y pedir los permisos
    const videoElement = document.getElementById('qr-video');

    try {
        // Intentar acceder a la cámara y obtener permisos
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoElement.srcObject = stream;

        // Iniciar el escaneo del QR
        const qrScanner = new QrScanner(videoElement, result => {
            console.log('QR detectado:', result);
            procesarQr(result);
            qrScanner.stop();
        }, {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true
        });

        // Iniciar el escáner
        qrScanner.start().catch(err => {
            console.error("Error al iniciar el escáner:", err);
        });

    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("Se requiere permiso para acceder a la cámara.");
    }
});

function procesarQr(decodedText) {
    try {
        // Asegúrate de que el QR sea una URL válida
        const qrUrl = new URL(decodedText);
        const cdcid = qrUrl.searchParams.get("Id");
        const qrId = qrUrl.searchParams.get("qr_id");

        if (!cdcid || !qrId) {
            alert("No se encontró un ID o qr_id válido.");
            return;
        }

        alert("ID capturado: " + cdcid);

        fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cdc_id: cdcid,
                qr_id: parseInt(qrId)
            })
        })
        .then(res => res.json())
        .then(data => {
            alert("ID guardado y enviado correctamente.");
        })
        .catch(err => {
            alert("Error al enviar el ID: " + err.message);
        });
    } catch (e) {
        alert("Error al procesar el QR: " + e.message);
    }
}
