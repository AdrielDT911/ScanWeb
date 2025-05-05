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

  let scanned = false;
  let textoEnviado = false;

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: {
        width: 350,
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
    },
    (errorMessage) => {
      console.log("Error escaneo: ", errorMessage);
    }
  ).catch(err => {
    console.error("Error al iniciar cámara: ", err);
  });

  // OCR cada 3 segundos
  setInterval(() => {
    if (textoEnviado) return;
    detectarTextoOCR(qrId, () => { textoEnviado = true; });
  }, 3000);
}

function detectarTextoOCR(qrId, onSuccess) {
  const video = document.querySelector("video");
  if (!video) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  Tesseract.recognize(
    canvas,
    "spa",
    {
      logger: (m) => console.log(m)
    }
  ).then(({ data: { text } }) => {
    console.log("Texto OCR:", text);

    // Limpiar texto y buscar número CDC completo (puede tener saltos o espacios)
    const limpio = text.replace(/\s+/g, " ").trim();

    const regex = /(CDC[:\-]?\s*)?(\d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4})/;
    const match = limpio.match(regex);

    if (match && match[2]) {
      const cdcTexto = match[2].replace(/\s/g, "");
      alert("CDC detectado: " + cdcTexto);

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
          alert("CDC enviado correctamente.");
          if (typeof onSuccess === "function") onSuccess();
        })
        .catch(err => {
          alert("Error al enviar el CDC: " + err.message);
        });
    }
  }).catch(err => {
    console.error("Error en OCR: ", err);
  });
}
