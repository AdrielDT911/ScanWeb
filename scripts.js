let html5QrCode; // Para acceder globalmente
let scanned = false;
let ocrScanned = false;
let currentQrId = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get('qr_id');
  if (!qrId) {
    alert("QR_ID no encontrado en la URL.");
    return;
  }

  currentQrId = qrId;
  iniciarEscaneoDirecto(qrId);
});

function iniciarEscaneoDirecto(qrId) {
  const qrReader = document.getElementById("qr-reader");
  html5QrCode = new Html5QrCode("qr-reader");
  scanned = false;
  ocrScanned = false;

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: {
        width: 360,
        height: 200,
        drawOutline: true
      },
      aspectRatio: 1.0,
      disableFlip: true
    },
    (decodedText, decodedResult) => {
      if (scanned) return;
      scanned = true;
      qrReader.classList.add("scan-success");

      try {
        const qrUrl = new URL(decodedText);
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

        html5QrCode.stop().then(() => {
          console.log("Escáner detenido");
        });

      } catch (err) {
        console.error("Error procesando QR: ", err);
      }
    },
    (errorMessage) => {
      console.log("Error escaneo QR: ", errorMessage);
    }
  ).catch(err => {
    console.error("Error al iniciar cámara: ", err);
  });

  // OCR cada 3s
  setInterval(() => {
    if (!ocrScanned) detectarTextoOCR(qrId);
  }, 500);
}

function detectarTextoOCR(qrId) {
  const videoElement = document.querySelector('video');
  if (!videoElement || videoElement.readyState !== 4) return;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  Tesseract.recognize(canvas, 'spa', {
    logger: m => console.log(m)
  }).then(({ data: { text } }) => {
    console.log("Texto detectado OCR: ", text);

    // REGEX para 10 bloques de 4 dígitos
    const regex = /(\d{4}[\s-]?){9}\d{4}/g;
    const encontrado = text.match(regex);

    if (encontrado && encontrado[0] && !ocrScanned) {
      const cdcid = encontrado[0].replace(/[\s-]/g, '');
      alert("Código OCR detectado: " + cdcid);

      ocrScanned = true;

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
          alert("Código OCR guardado correctamente.");
        })
        .catch(err => {
          alert("Error al enviar código OCR: " + err.message);
        });
    }
  }).catch(err => {
    console.error("Error OCR: ", err);
  });
}

// 📱 Adaptar al girar pantalla
window.addEventListener("resize", () => {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      iniciarEscaneoDirecto(currentQrId);
    }).catch(err => {
      console.error("Error reiniciando cámara en resize:", err);
    });
  }
});
