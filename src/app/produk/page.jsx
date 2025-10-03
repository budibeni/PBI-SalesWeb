"use client";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ItemPicker from "@/app/produk/MyItemPicker";

export default function FormBarang() {
  const [barang, setBarang] = React.useState(null);
  const [qty, setQty] = React.useState(1);

  const submit = (e) => {
    e.preventDefault();
    // kirim ke server, misalnya:
    // await fetch("/api/po-detail", { method:"POST", body: JSON.stringify({ barang, qty }) })
    console.log({ barang, qty });
  };

  return (
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Barang</label>
          <ItemPicker value={barang} onChange={setBarang} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Qty</label>
          <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs">
          <pre>{JSON.stringify({ barang, qty }, null, 2)}</pre>
        </div>

        <Button type="submit">Simpan</Button>
      </form>
  );
}
