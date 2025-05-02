import { BrowserQRCodeReader } from 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.1/+esm';

let qrReader;
let videoInputDeviceId;

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('app_id');
    const appUser = params.get('app_user');
    const appPageId = params.get('app_page_id');
    document.querySelector('#app-info').textContent = `ID de la app: ${appId}, Usuario: ${appUser}, Página: ${appPageId}`;

    document.getElementById('openCameraButton').addEventListener('click', abrirCamara);
    document.getElementById('cancelButton').addEventListener('click', cerrarCamara);
});

async function abrirCamara() {
    const modal = document.getElementById("cameraModal");
    mostrarModal(modal);

    qrReader = new BrowserQRCodeReader();

    try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        videoInputDeviceId = videoInputDevices[0].deviceId;

        const videoElement = document.getElementById('video');
        const result = await qrReader.decodeOnceFromVideoDevice(videoInputDeviceId, videoElement);

        console.log("QR detectado:", result.text);
        procesarQr(result.text);
    } catch (err) {
        alert("Error al escanear QR: " + err.message);
        cerrarCamara();
    }
}

function mostrarModal(modal) {
    modal.classList.add("show");
}

function cerrarCamara() {
    const modal = document.getElementById("cameraModal");
    modal.classList.remove("show");

    if (qrReader) {
        qrReader.reset();
    }
}

function procesarQr(decodedText) {
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

        cerrarCamara();
    } catch (e) {
        alert("Error al procesar el QR: " + e.message);
        cerrarCamara();
    }
}
