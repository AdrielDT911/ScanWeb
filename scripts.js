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
  const video = document.getElementById("video");
  const canvasElement = document.createElement("canvas");
  const canvas = canvasElement.getContext("2d");

  let scanning = false;

  // Acceder a la cámara
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // Requerido para que funcione en iOS

      video.play();
      requestAnimationFrame(scanQRCode);
    })
    .catch(err => {
      console.error("Error al acceder a la cámara: ", err);
    });

  function scanQRCode() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const qrCode = jsQR(imageData.data, canvasElement.width, canvasElement.height);

      if (qrCode && !scanning) {
        scanning = true;
        const qrUrl = new URL(qrCode.data);
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

        video.srcObject.getTracks().forEach(track => track.stop()); // Detener la cámara
      }
    }
    requestAnimationFrame(scanQRCode);
  }
}
