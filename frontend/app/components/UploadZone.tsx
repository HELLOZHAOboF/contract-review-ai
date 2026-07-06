"use client";

import { useState } from "react";
import { analyzeContractFile } from "@/lib/api";

export default function UploadZone() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFile = async (file: File) => {
    setLoading(true);

    try {
      const { analysis } = await analyzeContractFile(file);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      alert("上传失败");
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: 30 }}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        style={{
          border: "2px dashed #aaa",
          padding: 40,
          borderRadius: 10,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <input
          type="file"
          hidden
          id="fileInput"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
          拖拽 CTA 文件到这里，或点击上传
        </label>
      </div>

      {loading && <p style={{ marginTop: 20 }}>正在分析 CTA...</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>分析结果</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
