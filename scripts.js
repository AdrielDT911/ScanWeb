document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (!qrId) {
        alert("Falta el parámetro qr_id en la URL");
        return;
    }

    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.777, disableFlip: true },
        (decodedText, decodedResult) => {
            console.log("Detectado:", decodedText);

            let cdcid = null;

            // Intentamos detectar CDC directo (CDC: + 44 dígitos)
            const cdcRegex = /CDC[:\s]*([\d]{44})/i;
            const match = decodedText.match(cdcRegex);

            if (match) {
                cdcid = match[1];
            } else {
                // Intentamos obtener el parámetro Id de la URL
                try {
                    const url = new URL(decodedText);
                    cdcid = url.searchParams.get("Id");
                } catch (e) {
                    console.error("No es URL válida:", decodedText);
                }
            }

            if (cdcid && cdcid.length === 44) {
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
                    alert("CDC capturado correctamente.");
                    html5QrCode.stop();
                })
                .catch(err => {
                    alert("Error al enviar el CDC: " + err.message);
                });
            } else {
                console.log("No se detectó CDC válido aún.");
            }
        },
        (errorMessage) => {
            console.log("Escaneo fallido:", errorMessage);
        }
    ).catch((err) => {
        console.error("Error iniciando escáner:", err);
    });
});
