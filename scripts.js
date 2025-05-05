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

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: {
        width: 280,
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
    }
  ).catch(err => {
    console.error("Error al iniciar cámara: ", err);
  });

  // Añadir detección de texto (OCR)
  function detectarTextoOCR() {
    const videoElement = document.querySelector('video'); // Elemento de video de la cámara
    if (videoElement) {
      // Capturamos un frame de la cámara
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Usamos Tesseract.js para detectar texto
      Tesseract.recognize(
        canvas, 
        'spa', // Idioma español
        {
          logger: (m) => console.log(m)
        }
      ).then(({ data: { text } }) => {
        // Aquí puedes procesar el texto detectado
        console.log("Texto detectado: ", text);

        // Si encontramos una cadena numérica (el código CDC), puedes hacer algo con ella
        const regex = /\d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4}/g;
        const encontrado = text.match(regex);
        
        if (encontrado) {
          alert("Código detectado: " + encontrado[0]);
        }
      }).catch(err => {
        console.error("Error en el OCR: ", err);
      });
    }
  }

  // Llamar a la función de OCR cada 2 segundos (o el tiempo que desees)
  setInterval(detectarTextoOCR, 2000);
}
