import QrScanner from "https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js";

// Configurar el Worker Path para la librería
QrScanner.WORKER_PATH = 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner-worker.min.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Mostramos el modal cuando la página esté lista
    openModal();

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
            closeModal();
        }, {
            returnDetailedScanResult: true,
            highlightScanRegion: false, // Quitamos el recuadro verde
            highlightCodeOutline: false // Quitamos el recuadro verde
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

function openModal() {
    const modal = document.getElementById('camera-modal');
    modal.style.display = "flex"; // Mostrar el modal
}

function closeModal() {
    const modal = document.getElementById('camera-modal');
    modal.style.display = "none"; // Cerrar el modal
}

function procesarQr(decodedText) {
    try {
        // Verificamos que el texto escaneado sea una URL válida
        const qrUrl = new URL(decodedText);

        // Extraemos los parámetros
        const cdcid = qrUrl.searchParams.get("Id");
        const qrId = qrUrl.searchParams.get("qr_id");

        if (!cdcid || !qrId) {
            alert("El código QR no contiene parámetros válidos.");
            return;
        }

        alert("ID capturado: " + cdcid);

        // Enviar el ID al servidor
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
