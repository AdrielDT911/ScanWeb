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
        width: 300,
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

  // Captura y procesado de imagen para OCR
  async function detectTextoOCR(image) {
    const result = await Tesseract.recognize(
      image, 
      'spa', // idioma español (puedes cambiarlo a otro idioma si es necesario)
      {
        logger: (m) => console.log(m),
      }
    );
    
    const textoDetectado = result.text;
    console.log("Texto detectado:", textoDetectado);
    buscarCodigoEnTexto(textoDetectado);
  }

  // Función para buscar una serie de números en el texto
  function buscarCodigoEnTexto(texto) {
    const regex = /\d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{4}/g; // Buscar secuencias como "0180 0148 6810 4300 ..."
    const coincidencias = texto.match(regex);

    if (coincidencias) {
      console.log("Código detectado:", coincidencias[0]);
      alert("Código detectado: " + coincidencias[0]);
    } else {
      console.log("No se detectó código en el texto.");
    }
  }

  // Aquí puedes capturar las imágenes de la cámara (esto sería un ejemplo)
  // Aquí deberías implementar una función para capturar la imagen de la cámara en tiempo real
  // y enviarla a la función de OCR.
}
