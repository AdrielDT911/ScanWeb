import { BrowserQRCodeReader } from '@zxing/browser';

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('app_id');
    const appUser = params.get('app_user');
    const appPageId = params.get('app_page_id');
    document.querySelector('#app-info').textContent = `ID de la app: ${appId}, Usuario: ${appUser}, Página: ${appPageId}`;

    document.getElementById('openCameraButton').addEventListener('click', abrirCamara);
    document.getElementById('cancelButton').addEventListener('click', cerrarCamara);
});

let qrReader = null;
let videoElement = null;

async function abrirCamara() {
    const modal = document.getElementById("cameraModal");
    videoElement = document.getElementById("video");
    mostrarModal(modal);

    qrReader = new BrowserQRCodeReader();

    try {
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (devices.length === 0) throw new Error("No se encontraron cámaras.");
        
        const selectedDeviceId = devices[0].deviceId;
        await qrReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
            if (result) {
                console.log("QR detectado:", result.getText());
                procesarQr(result.getText());
            }
        });
    } catch (err) {
        alert("Error accediendo a la cámara: " + err.message);
        cerrarCamara();
    }
}

function cerrarCamara() {
    const modal = document.getElementById("cameraModal");
    modal.classList.remove("show");

    if (qrReader) {
        qrReader.reset();
    }
}

function mostrarModal(modal) {
    modal.classList.add("show");
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
    }
}
