'use client'

import { useState, useCallback, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { processInBodyImage } from '@/app/actions'
import Image from 'next/image'
import { toast } from "sonner"

type FileWithPreview = File & {
  preview: string
}

export function ImageUploader({ onUploadComplete }: { onUploadComplete: (data: any) => void }) {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;

    const fileWithPreview = Object.assign(acceptedFiles[0], {
      preview: URL.createObjectURL(acceptedFiles[0])
    });
    setFiles([fileWithPreview]);

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    startTransition(async () => {
      const result = await processInBodyImage(formData);

      if (result.success && result.data) {
        toast.success("InBodyシートの処理が完了しました！");
        onUploadComplete(result.data);
      } else {
        toast.error("エラーが発生しました。", {
          description: result.message || "予期せぬエラーが発生しました。",
        });
      }
      // Clean up the object URL to avoid memory leaks
      URL.revokeObjectURL(fileWithPreview.preview);
    });
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  const previews = files.map(file => (
    <div key={file.name} className="mt-4 relative w-48 h-48 mx-auto">
      <Image
        src={file.preview}
        alt={file.name}
        fill
        className="rounded-md object-cover"
      />
    </div>
  ))

  return (
    <div className="space-y-4 relative">
      <div
        {...getRootProps()}
        className={`p-10 border-2 border-dashed rounded-md text-center cursor-pointer
        ${isDragActive ? 'border-primary bg-muted' : 'border-muted-foreground'}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">
          体重計やInBodyの結果シートの画像をここにドロップするか、クリックしてファイルを選択してください。
        </p>
      </div>
      
      {previews.length > 0 && <aside>{previews}</aside>}

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">処理中...</p>
          </div>
        </div>
      )}
    </div>
  )
} 