document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get('qr_id');
  const sessionId = params.get('session_id');

  if (!qrId || !sessionId) {
    alert("QR_ID o SESSION_ID no encontrado en la URL.");
    return;
  }

  iniciarEscaneoDirecto(qrId, sessionId);
  iniciarEscaneoTexto(qrId, sessionId);
});

function iniciarEscaneoDirecto(qrId, sessionId) {
  const qrReader = document.getElementById("qr-reader");
  const codeReader = new ZXing.BrowserMultiFormatReader();

  let scanned = false;

  const constraints = {
    video: {
      facingMode: { exact: "environment" }
    }
  };

  codeReader.decodeFromConstraints({ video: constraints }, "qr-reader", (result, err) => {
    if (result && !scanned) {
      scanned = true;
      qrReader.classList.add("scan-success");

      try {
        const qrUrl = new URL(result.getText());
        const cdcid = qrUrl.searchParams.get("Id");

        if (!cdcid || !qrId || !sessionId) {
          alert("No se encontró un ID, qr_id o session_id válido.");
          return;
        }

        console.log("ID capturado: " + cdcid);

        fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cdc_id: cdcid,
            qr_id: parseInt(qrId),
            session_id: sessionId
          })
        })
          .then(res => res.json())
          .then(data => {
            alert("ID guardado y enviado correctamente.");
          })
          .catch(err => {
            alert("Error al enviar el ID: " + err.message);
          });

        codeReader.reset();
      } catch (e) {
        alert("URL no válida: " + e.message);
      }
    }
  }).catch(err => {
    console.error("Error al iniciar cámara:", err);
    alert("Error al acceder a la cámara: " + err.message);
  });
}

function iniciarEscaneoTexto(qrId, sessionId) {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.style.display = 'none';
  document.body.appendChild(video);

  let cdcEnviado = false;

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const interval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && !cdcEnviado) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/png');

          Tesseract.recognize(
            imageData,
            'spa',
            { logger: m => console.log(m) }
          ).then(({ data: { text } }) => {
            const match = text.match(/CDC:\s*([\d\s]+)/i);
            if (match) {
              const cdcid = match[1].replace(/\s+/g, '');
              if (cdcEnviado) return;
              cdcEnviado = true;

              console.log("Código CDC detectado: " + cdcid);

              fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  cdc_id: cdcid,
                  qr_id: parseInt(qrId),
                  session_id: sessionId
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
      }, 1000);
    })
    .catch(err => {
      alert("Error al acceder a la cámara para OCR: " + err.message);
    });
}

function getAspectRatio() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return width > height ? width / height : height / width;
}
