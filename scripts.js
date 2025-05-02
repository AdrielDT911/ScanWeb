document.addEventListener("DOMContentLoaded", () => {
    // Obtener solo el parámetro qr_id
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    // Mostrar solo qr_id
    document.querySelector('#app-info').textContent = `QR ID: ${qrId ?? 'No disponible'}`;

    // Abrir cámara automáticamente
    abrirCamara();
});

let html5QrCode = null;

// Abrir el modal y escanear
function abrirCamara() {
    const modal = document.getElementById("cameraModal");
    mostrarModal(modal);

    html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0, disableFlip: true },
        (decodedText) => {
            console.log("QR detectado:", decodedText);
            procesarQr(decodedText, html5QrCode);
        },
        (errorMessage) => {
            console.log("Error en el escaneo:", errorMessage);
        }
    ).catch((err) => {
        console.error("Error iniciando escáner:", err);
    });
}

function mostrarModal(modal) {
    modal.classList.add("show");
}

function cerrarCamara() {
    const modal = document.getElementById("cameraModal");
    modal.classList.remove("show");

    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log("Escáner detenido");
        }).catch((err) => {
            console.error("Error al detener escáner:", err);
        });
    }
}

function procesarQr(decodedText, html5QrCode) {
    try {
        const qrUrl = new URL(decodedText);
        const cdcid = qrUrl.searchParams.get("Id");

        const currentParams = new URLSearchParams(window.location.search);
        const qrId = currentParams.get("qr_id");

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

        html5QrCode.stop().then(() => cerrarCamara());
    } catch (e) {
        alert("Error al procesar el QR: " + e.message);
    }
}
