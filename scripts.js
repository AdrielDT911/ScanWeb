document.addEventListener("DOMContentLoaded", () => {
    // Obtener los parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');
    const appSession = params.get('app_session');

    if (!qrId || !appSession) {
        alert("Faltan parámetros en la URL (qr_id o app_session).");
        return;
    }

    // Mostrar los datos en el HTML
    document.querySelector('#app-info').textContent = `QR_ID: ${qrId} | Session: ${appSession}`;

    // Iniciar la cámara automáticamente
    abrirCamara();
});

let html5QrCode = null; // Variable global para el escáner

function abrirCamara() {
    const modal = document.getElementById("cameraModal");
    const qrReader = document.getElementById("qr-reader");
    mostrarModal(modal);

    html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0, disableFlip: true },
        (decodedText, decodedResult) => {
            console.log("QR detectado:", decodedText);
            procesarQr(decodedText);
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
            console.error("Error al detener el escáner:", err);
        });
    }
}

function procesarQr(decodedText) {
    try {
        const qrUrl = new URL(decodedText);
        const cdcid = qrUrl.searchParams.get("Id");

        const currentParams = new URLSearchParams(window.location.search);
        const qrId = currentParams.get("qr_id");
        const appSession = currentParams.get("app_session");

        if (!cdcid || !qrId || !appSession) {
            alert("Faltan datos requeridos (Id, qr_id o app_session).");
            return;
        }

        alert("ID capturado: " + cdcid);

        fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cdc_id: cdcid,
                qr_id: qrId,
                app_session: appSession
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
