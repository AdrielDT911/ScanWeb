document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get('qr_id');
  const appSession = params.get('app_session');

  if (!qrId) {
  alert("Parámetro faltante: qr_id");
  return;
}

if (!appSession) {
  alert("Parámetro faltante: app_session");
  return;
}

  iniciarEscaneoDirecto(qrId, appSession);
  iniciarEscaneoTexto(qrId, appSession);
});

function iniciarEscaneoDirecto(qrId, appSession) {
  const qrReader = document.getElementById("qr-reader");
  const html5QrCode = new Html5Qrcode("qr-reader");

  let scanned = false;

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 370, height: 200, drawOutline: true },
      aspectRatio: getAspectRatio(),
      disableFlip: true
    },
    (decodedText, decodedResult) => {
      if (scanned) return;
      scanned = true;
      qrReader.classList.add("scan-success");

      const qrUrl = new URL(decodedText);
      const cdcid = qrUrl.searchParams.get("Id");

      if (!cdcid || !qrId || !appSession) {
        alert("Parámetros inválidos.");
        return;
      }

      console.log("ID capturado: " + cdcid);

      fetch("https://qr-api-production-adac.up.railway.app/qr/guardar-cdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cdc_id: cdcid,
          qr_id: qrId,
          app_session: appSession
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

  // Adaptar tamaño al girar pantalla
  window.addEventListener("orientationchange", () => {
    html5QrCode.stop().then(() => {
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 200, height: 200, drawOutline: true },
          aspectRatio: getAspectRatio(),
          disableFlip: true
        },
        () => {},
        () => {}
      );
    });
  });
}

function iniciarEscaneoTexto(qrId, appSession) {
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
                  qr_id: qrId,
                  app_session: appSession
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
      }, 3000);
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
