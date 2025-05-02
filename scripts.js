import QrScanner from './qr-scanner.min.js';

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('qr-video');
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (!qrId) {
        alert("No se encontró un qr_id válido en la URL.");
        return;
    }

    QrScanner.hasCamera().then(hasCamera => {
        if (!hasCamera) {
            alert("No se encontró una cámara en este dispositivo.");
            return;
        }

        const qrScanner = new QrScanner(video, result => {
            try {
                const qrUrl = new URL(result);
                const cdcid = qrUrl.searchParams.get("Id");

                if (!cdcid) {
                    alert("No se encontró un ID válido en el código QR.");
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

                qrScanner.stop();
            } catch (e) {
                alert("Error al procesar el QR: " + e.message);
            }
        });

        qrScanner.start();
    });
});
