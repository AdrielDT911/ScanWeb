document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get('qr_id');
  const sessionId = params.get('session_id');

  if (!qrId || !sessionId) {
    alert("QR_ID o SESSION_ID no encontrado en la URL.");
    return;
  }

  const input = document.getElementById("cameraInput");

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      const imageData = reader.result;

      Tesseract.recognize(imageData, 'spa', { logger: m => console.log(m) })
        .then(({ data: { text } }) => {
          const match = text.match(/CDC:\s*([\d\s]+)/i);
          if (match) {
            const cdcid = match[1].replace(/\s+/g, '');
            console.log("CDC detectado:", cdcid);

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
          } else {
            alert("No se detectó ningún CDC en la imagen.");
          }
        })
        .catch(err => console.error("Error OCR:", err));
    };
    reader.readAsDataURL(file);
  });
});
