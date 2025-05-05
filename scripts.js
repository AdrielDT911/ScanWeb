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

  // Inicia QRScanner
  QRScanner.prepare(function (err, status) {
    if (err) {
      alert("Error al preparar el escáner: " + err);
      return;
    }

    // Comienza a escanear
    QRScanner.scan(function (result) {
      const qrUrl = new URL(result);
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

      QRScanner.destroy();
    }, function (error) {
      console.log("Error escaneo: ", error);
    });

    QRScanner.show();
  });
}
