'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useImageKitUpload } from '@/hooks/use-imagekit'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageKitImage } from '@/components/ui/imagekit-image'

interface ImageKitUploadResult {
  url: string
  fileId: string
  name: string
  size: number
  filePath: string
  tags?: string[]
  isPrivateFile?: boolean
  customCoordinates?: string
  fileType: string
}

interface ImageKitUploadProps {
  onUploadSuccess?: (result: ImageKitUploadResult) => void
  onUploadError?: (error: string) => void
  folder?: string
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedFileTypes?: string[]
  className?: string
  multiple?: boolean
  showPreview?: boolean
}

interface UploadedFile {
  id: string
  name: string
  url: string
  fileId: string
  size: number
}

export function ImageKitUpload({
  onUploadSuccess,
  onUploadError,
  folder = 'products',
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  multiple = true,
  showPreview = true
}: ImageKitUploadProps) {
  const { uploadFile, isUploading, progress, error } = useImageKitUpload()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filesToUpload = multiple 
      ? acceptedFiles.slice(0, maxFiles - uploadedFiles.length)
      : [acceptedFiles[0]]

    for (const file of filesToUpload) {
      if (file.size > maxSize) {
        onUploadError?.(`Dosya boyutu çok büyük: ${file.name}`)
        continue
      }

      try {
        await uploadFile(file, {
          folder,
          onSuccess: (result) => {
            const newFile: UploadedFile = {
              id: result.fileId,
              name: result.name,
              url: result.url,
              fileId: result.fileId,
              size: file.size
            }
            
            setUploadedFiles(prev => multiple ? [...prev, newFile] : [newFile])
            onUploadSuccess?.(result)
          },
          onError: (error) => {
            onUploadError?.(error)
          }
        })
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : 'Upload failed')
      }
    }
  }, [uploadFile, folder, maxFiles, maxSize, multiple, uploadedFiles.length, onUploadSuccess, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          
          {isDragActive ? (
            <p className="text-sm text-gray-600">
              Dosyaları buraya bırakın...
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Dosyaları sürükleyip bırakın veya seçmek için tıklayın
              </p>
              <p className="text-xs text-gray-400">
                Maksimum {maxFiles} dosya, her biri {formatFileSize(maxSize)} boyutunda
              </p>
              <p className="text-xs text-gray-400">
                Desteklenen formatlar: {acceptedFileTypes.map(type => type.split('/')[1]).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Yükleniyor...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Yüklenen Dosyalar ({uploadedFiles.length})</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <ImageKitImage
                    src={file.url}
                    alt={file.name}
                    preset="thumbnail"
                    className="w-full h-full"
                  />
                </div>
                
                {/* File Info */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
          <span>{uploadedFiles.length} dosya yüklendi</span>
          {multiple && uploadedFiles.length < maxFiles && (
            <span>Daha {maxFiles - uploadedFiles.length} dosya ekleyebilirsiniz</span>
          )}
        </div>
      )}
    </div>
  )
}

// Simple file upload button component
interface SimpleImageKitUploadProps {
  onUploadSuccess?: (result: ImageKitUploadResult) => void
  onUploadError?: (error: string) => void
  folder?: string
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function SimpleImageKitUpload({
  onUploadSuccess,
  onUploadError,
  folder = 'products',
  buttonText = 'Resim Yükle',
  buttonVariant = 'outline',
  className
}: SimpleImageKitUploadProps) {
  const { uploadFile, isUploading, progress } = useImageKitUpload()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadFile(file, {
        folder,
        onSuccess: onUploadSuccess,
        onError: onUploadError
      })
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant={buttonVariant}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Yükleniyor... {progress}%</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4" />
            <span>{buttonText}</span>
          </div>
        )}
      </Button>
    </div>
  )
}


