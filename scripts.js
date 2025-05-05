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
  const qrReader = document.getElementById("qr-reader");
  const html5QrCode = new Html5Qrcode("qr-reader");

  let scannedQR = false;
  let scannedTexto = false;

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: {
        width: 320,
        height: 200,
        drawOutline: true
      },
      aspectRatio: 1.0,
      disableFlip: true
    },
    (decodedText, decodedResult) => {
      if (scannedQR) return;
      scannedQR = true;
      qrReader.classList.add("scan-success");

      const qrUrl = new URL(decodedText);
      const cdcid = qrUrl.searchParams.get("Id");

      if (!cdcid || !qrId) {
        alert("No se encontró un ID o qr_id válido en el QR.");
        return;
      }

      alert("ID capturado (QR): " + cdcid);

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
          alert("ID del QR enviado correctamente.");
        })
        .catch(err => {
          alert("Error al enviar ID del QR: " + err.message);
        });

      html5QrCode.stop().then(() => {
        console.log("Escáner detenido tras escanear QR.");
      });
    },
    (errorMessage) => {
      console.log("Error escaneo QR: ", errorMessage);
    }
  ).catch(err => {
    console.error("Error al iniciar cámara: ", err);
  });

  // OCR: detectar texto en frame de video
  function detectarTextoOCR() {
    const videoElement = document.querySelector('video');
    if (!videoElement || scannedTexto) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    Tesseract.recognize(canvas, 'spa', {
      logger: m => console.log(m)
    }).then(({ data: { text } }) => {
      console.log("Texto detectado (OCR): ", text);

      // Buscar código CDC (22 bloques de 4 dígitos)
      const regex = /(\d{4}[\s-]?){10,}/g;
      const coincidencias = text.match(regex);

      if (coincidencias && coincidencias.length > 0) {
        const cdcTexto = coincidencias[0].replace(/[\s-]+/g, ''); // quitar espacios/guiones
        if (cdcTexto.length >= 40) {
          scannedTexto = true;
          alert("Código impreso detectado: " + cdcTexto);

          fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cdc_id: cdcTexto,
              qr_id: parseInt(qrId)
            })
          })
            .then(res => res.json())
            .then(data => {
              alert("Código impreso enviado correctamente.");
            })
            .catch(err => {
              alert("Error al enviar código impreso: " + err.message);
            });
        }
      }
    }).catch(err => {
      console.error("Error OCR: ", err);
    });
  }

  // Ejecutar OCR cada 3 segundos
  setInterval(detectarTextoOCR, 1000);
}
