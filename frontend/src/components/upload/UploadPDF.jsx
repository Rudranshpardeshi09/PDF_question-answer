import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadPDF } from "@/api/client";
import { useApp } from "@/context/AppContext";

export default function UploadPDF() {
  const { setIndexed } = useApp();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    await uploadPDF(file, setProgress);
    setIndexed(true);
    setLoading(false);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upload PDF</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="block w-full text-sm"
        />

        {loading && (
          <div>
            <div className="h-2 rounded bg-muted">
              <div
                className="h-2 rounded bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs mt-2 text-muted-foreground">
              Indexing document… {progress}%
            </p>
          </div>
        )}

        {!loading && (
          <p className="text-sm text-muted-foreground">
            Upload a large PDF and start chatting with it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
