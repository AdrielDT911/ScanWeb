document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (!qrId) {
        alert("QR_ID no encontrado en la URL.");
        return;
    }

    const video = document.getElementById('qr-video');
    const scanner = new QrScanner(video, result => {
        console.log("QR detectado:", result);
        procesarQr(result, qrId);
        scanner.stop();
    });

    scanner.start().catch(err => {
        console.error("Error al iniciar el escáner:", err);
    });
});

function procesarQr(decodedText, qrId) {
    try {
        const qrUrl = new URL(decodedText);
        const cdcid = qrUrl.searchParams.get("Id");

        if (!cdcid) {
            alert("No se encontró un ID válido en el QR.");
            return;
        }

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
