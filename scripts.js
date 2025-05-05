document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get('qr_id');
  if (!qrId) {
    alert("QR_ID no encontrado en la URL.");
    return;
  }

  iniciarEscaneoDirecto(qrId);
  iniciarEscaneoTexto(qrId); // 👈 OCR agregado
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
        width: 370,
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
}

// 🆕 OCR para detectar texto como "CDC: ..."
function iniciarEscaneoTexto(qrId) {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.style.display = 'none';
  document.body.appendChild(video);

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const interval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/png');

          Tesseract.recognize(
            imageData,
            'spa', // idioma español
            { logger: m => console.log(m) }
          ).then(({ data: { text } }) => {
            const match = text.match(/CDC:\s*([\d\s]+)/i);
            if (match) {
              const cdcid = match[1].replace(/\s+/g, '');
              alert("Código CDC detectado: " + cdcid);

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
                alert("CDC guardado correctamente.");
              })
              .catch(err => {
                alert("Error al enviar el CDC: " + err.message);
              });

              clearInterval(interval);
              stream.getTracks().forEach(track => track.stop());
              video.remove();
            }
          }).catch(err => console.error("OCR error:", err));
        }
      }, 2000); // analiza cada 2 segundos
    })
    .catch(err => {
      alert("Error al acceder a la cámara para OCR: " + err.message);
    });
}
