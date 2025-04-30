document.addEventListener("DOMContentLoaded", () => {
    // Obtener el parámetro qr_id de la URL
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (!qrId) {
        alert("No se encontró el qr_id en la URL.");
        return;
    }

    // Mostrar el mensaje de escaneo
    document.querySelector('#app-info').textContent = "Escanea el código QR de la factura electrónica";

    // Iniciar la cámara automáticamente al cargar la página
    abrirCamara(qrId);
});

let html5QrCode = null; // Declaramos esta variable globalmente

// Función para abrir la cámara y escanear el QR
function abrirCamara(qrId) {
    const qrReader = document.getElementById("qr-reader");

    html5QrCode = new Html5Qrcode("qr-reader"); // Inicializamos aquí

    // Inicia el escáner de QR
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0, disableFlip: true },
        (decodedText, decodedResult) => {
            console.log("QR detectado:", decodedText);
            procesarQr(decodedText, qrId);
        },
        (errorMessage) => {
            console.log("Error en el escaneo: ", errorMessage);
        }
    ).catch((err) => {
        console.error("Error iniciando escáner:", err);
    });
}

// Función para procesar el QR escaneado
function procesarQr(decodedText, qrId) {
    try {
        const qrUrl = new URL(decodedText);
        const cdcid = qrUrl.searchParams.get("Id");

        if (!cdcid || !qrId) {
            alert("No se encontró un ID válido en el QR.");
            return;
        }

        alert("ID capturado: " + cdcid);

        fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cdc_id: cdcid,
                qr_id: parseInt(qrId) // Enviar qr_id junto con cdc_id
            })
        })
        .then(res => res.json())
        .then(data => {
            alert("ID guardado y enviado correctamente.");
        })
        .catch(err => {
            alert("Error al enviar el ID: " + err.message);
        });

        html5QrCode.stop().then(() => {
            console.log("Escáner detenido");
        });
    } catch (e) {
        alert("Error al procesar el QR: " + e.message);
    }
}
