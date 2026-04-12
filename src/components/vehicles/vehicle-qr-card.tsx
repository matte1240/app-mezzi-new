"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";
import Image from "next/image";

export function VehicleQrCard({ vehicleId, plate }: { vehicleId: string; plate: string }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));

  const qrPayload = useMemo(() => {
    if (!origin) {
      return `/viaggi?vehicleId=${encodeURIComponent(vehicleId)}`;
    }
    return `${origin}/viaggi?vehicleId=${encodeURIComponent(vehicleId)}`;
  }, [origin, vehicleId]);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 240,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => {
        if (mounted) setQrDataUrl("");
      });

    return () => {
      mounted = false;
    };
  }, [qrPayload]);

  function printQr() {
    if (!qrDataUrl) return;

    const w = window.open("", "_blank", "width=420,height=620");
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>QR Mezzo ${plate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; }
            .card { border: 1px solid #ddd; border-radius: 12px; padding: 20px; text-align: center; }
            .plate { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .hint { color: #444; font-size: 14px; margin-bottom: 16px; }
            .payload { font-family: monospace; font-size: 12px; color: #555; margin-top: 12px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="plate">${plate}</div>
            <div class="hint">Scansiona per aprire subito la schermata viaggio</div>
            <img src="${qrDataUrl}" width="240" height="240" />
            <div class="payload">${qrPayload}</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">QR Viaggio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt={`QR ${plate}`}
            width={112}
            height={112}
            unoptimized
            className="h-28 w-28 rounded border"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded border text-xs text-muted-foreground">
            Generazione...
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={printQr} disabled={!qrDataUrl}>
          <Printer className="mr-2 h-4 w-4" />
          Stampa QR
        </Button>
        <p className="text-xs text-muted-foreground">Il QR apre direttamente la pagina Viaggi del mezzo selezionato.</p>
      </CardContent>
    </Card>
  );
}
