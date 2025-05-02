document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (!qrId) {
        alert("qr_id no proporcionado en la URL.");
        return;
    }

    const html5QrCode = new Html5Qrcode("qr-reader");

    const config = {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
            let minEdgePercentage = 0.7;
            let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return { width: qrboxSize, height: qrboxSize };
        },
        videoConstraints: {
            facingMode: { exact: "environment" },
            aspectRatio: window.innerWidth / window.innerHeight
        }
    };

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log("Código detectado:", decodedText);
        html5QrCode.stop().then(() => {
            procesarCodigo(decodedText, qrId);
        }).catch(err => {
            console.error("Error al detener el escáner:", err);
        });
    };

    const onScanFailure = (error) => {
        // Puedes manejar errores de escaneo aquí si lo deseas
    };

    html5QrCode.start(
        { facingMode: { exact: "environment" } },
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Error al iniciar el escáner:", err);
    });
});

function procesarCodigo(decodedText, qrId) {
    let cdcId = null;

    try {
        const url = new URL(decodedText);
        cdcId = url.searchParams.get("Id");
    } catch (e) {
        // No es una URL, intentar extraer CDC de texto plano
        const cdcMatch = decodedText.match(/CDC[:\s]*([\d\s]{44,})/i);
        if (cdcMatch) {
            cdcId = cdcMatch[1].replace(/\s+/g, '');
        }
    }

    if (!cdcId) {
        alert("No se pudo extraer el CDC del código escaneado.");
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
        alert("CDC guardado y enviado correctamente.");
    })
    .catch(err => {
        alert("Error al enviar el CDC: " + err.message);
    });
}
