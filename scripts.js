document.addEventListener("DOMContentLoaded", () => {
    // Obtener el parámetro de la URL
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');
    if (!qrId) {
        alert("QR_ID no encontrado en la URL.");
        return;
    }

    // Iniciar la cámara automáticamente
    abrirCamara();
});

let html5QrCode = null; // Declaramos esta variable globalmente

// Función para abrir el modal y mostrar la cámara
function abrirCamara() {
    const modal = document.getElementById("cameraModal");
    const qrReader = document.getElementById("qr-reader");
    mostrarModal(modal);

    html5QrCode = new Html5Qrcode("qr-reader"); // Inicializamos aquí

    // Inicia el escáner de QR
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 300 }, aspectRatio: 1.0, disableFlip: true},
        (decodedText, decodedResult) => {
            console.log("QR detectado:", decodedText);
            procesarQr(decodedText, html5QrCode);
        },
        (errorMessage) => {
            console.log("Error en el escaneo: ", errorMessage);
        }
    ).catch((err) => {
        console.error("Error iniciando escáner:", err);
    });
}

// Función para mostrar el modal
function mostrarModal(modal) {
    modal.classList.add("show");
}

// Función para ocultar el modal y detener el escáner de QR
function cerrarCamara() {
    const modal = document.getElementById("cameraModal");
    modal.classList.remove("show");

    // Detenemos el escáner y la cámara
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log("Escáner detenido");
        }).catch((err) => {
            console.error("Error al detener el escáner:", err);
        });
    }
}

// Función para procesar el QR
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
            cerrarCamara();
        });
    } catch (e) {
        alert("Error al procesar el QR: " + e.message);
    }
}
