function iniciarEscaneoDirecto(qrId) {
  const qrReader = document.getElementById("qr-reader");
  const html5QrCode = new Html5Qrcode("qr-reader");

  let scanned = false;

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: {
        width: 200,
        height: 200,
        drawOutline: true
      },
      aspectRatio: 1.0,
      disableFlip: true
    },
    (decodedText, decodedResult) => {
      if (scanned) return; // evitar múltiples lecturas
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
      // Aquí entra el OCR para detectar números
      capturarTextoOCR();
    }
  ).catch(err => {
    console.error("Error al iniciar cámara: ", err);
  });
}

function capturarTextoOCR() {
  const videoElement = document.querySelector("video");
  
  if (!videoElement) {
    alert("No se puede capturar la imagen de la cámara.");
    return;
  }

  // Tomamos una foto de la pantalla de la cámara
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Usamos Tesseract.js para reconocer el texto en la imagen
  Tesseract.recognize(
    canvas,
    'eng', // Puedes cambiar 'eng' por otro idioma si es necesario
    {
      logger: (m) => console.log(m) // Opcional, muestra el progreso del OCR
    }
  ).then(({ data: { text } }) => {
    console.log("Texto detectado: ", text);
    const regex = /\b\d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4}\b/g; // Regex para el formato de ejemplo
    const match = text.match(regex);

    if (match) {
      alert("Código detectado: " + match[0]);
      // Aquí puedes procesar el código encontrado
    } else {
      alert("No se detectó un código válido.");
    }
  }).catch((err) => {
    console.error("Error al realizar OCR: ", err);
    alert("Error al intentar detectar el texto.");
  });
}
