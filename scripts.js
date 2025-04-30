document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (!qrId) {
        alert("No se encontró qr_id en la URL");
        return;
    }

    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText, decodedResult) => {
            console.log("Escaneado:", decodedText);
            procesarTexto(decodedText, qrId, html5QrCode);
        },
        (err) => {
            console.warn("Error escaneo:", err);
        }
    ).catch((err) => {
        console.error("Error al iniciar cámara:", err);
    });
});

function procesarTexto(texto, qrId, html5QrCode) {
    let cdcId = null;

    // Si es un link con ?Id=...
    try {
        const parsed = new URL(texto);
        cdcId = parsed.searchParams.get("Id");
    } catch (e) {
        // Si es texto plano, buscar CDC manualmente
        const match = texto.match(/CDC[:\s]*([\d\s]{44,})/i);
        if (match) {
            cdcId = match[1].replace(/\s/g, '');
        }
    }

    if (!cdcId || cdcId.length < 30) {
        alert("No se detectó un CDC válido.");
        return;
    }

    fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cdc_id: cdcId,
            qr_id: parseInt(qrId)
        })
    })
    .then(res => res.json())
    .then(data => {
        alert("CDC enviado correctamente.");
    })
    .catch(err => {
        alert("Error al enviar el CDC: " + err.message);
    });

    html5QrCode.stop().catch(() => {});
}
