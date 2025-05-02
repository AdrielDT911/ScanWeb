import { BrowserMultiFormatReader } from 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/esm/index.min.js';

document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const codeReader = new BrowserMultiFormatReader();
    
    try {
        const devices = await codeReader.listVideoInputDevices();
        const selectedDeviceId = devices[0].deviceId;

        await codeReader.decodeFromVideoDevice(selectedDeviceId, video, (result, err) => {
            if (result) {
                const qrContent = result.getText();
                console.log("QR detectado:", qrContent);

                const url = new URL(window.location.href);
                const qrId = url.searchParams.get("qr_id");
                const cdcid = new URL(qrContent).searchParams.get("Id");

                if (!qrId || !cdcid) {
                    alert("QR inválido o sin ID.");
                    return;
                }

                fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cdc_id: cdcid, qr_id: parseInt(qrId) })
                })
                .then(res => res.json())
                .then(data => {
                    alert("ID capturado y enviado.");
                    codeReader.reset(); // Detiene el escáner
                })
                .catch(err => {
                    alert("Error al enviar el ID: " + err.message);
                });
            }
        });
    } catch (e) {
        alert("Error iniciando cámara: " + e.message);
    }
});
