import QrScanner from "https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js";

QrScanner.WORKER_PATH = 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner-worker.min.js';

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('qr-video');

    const qrScanner = new QrScanner(video, result => {
        console.log('QR detectado:', result);
        procesarQr(result);
        qrScanner.stop();
    }, {
        returnDetailedScanResult: true
    });

    qrScanner.start().catch(err => {
        console.error("Error al iniciar el escáner:", err);
    });
});

function procesarQr(decodedText) {
    try {
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
