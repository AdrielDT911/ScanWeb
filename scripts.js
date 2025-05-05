document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get('qr_id');
  if (!qrId) {
    alert("QR_ID no encontrado en la URL.");
    return;
  }

  iniciarEscaneoDirecto(qrId);
});

function iniciarEscaneoDirecto(qrId) {
  const scanner = new Instascan.Scanner({ video: document.getElementById('qr-reader') });

  scanner.addListener('scan', function (content) {
    const qrUrl = new URL(content);
    const cdcid = qrUrl.searchParams.get("Id");

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
  });

  Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
      scanner.start(cameras[0]);
    } else {
      alert("No se encontró una cámara.");
    }
  }).catch(function (e) {
    alert("Error al iniciar cámara: " + e);
  });
}
