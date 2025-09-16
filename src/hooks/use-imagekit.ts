'use client'

import { useState, useCallback } from 'react'
import { imagekitConfig } from '@/lib/imagekit'

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

interface ImageKitAuthParams {
  signature: string
  expire: number
  token: string
}

interface UploadOptions {
  folder?: string
  onProgress?: (progress: number) => void
  onSuccess?: (result: ImageKitUploadResult) => void
  onError?: (error: string) => void
}

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

export function useImageKitUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  })

  const uploadFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ) => {
    const { folder = 'products', onProgress, onSuccess, onError } = options

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadState(prev => ({ ...prev, progress }))
          onProgress?.(progress)
        }
      })

      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          setUploadState({
            isUploading: false,
            progress: 100,
            error: null
          })
          onSuccess?.(result.data)
        } else {
          const error = 'Upload failed'
          setUploadState({
            isUploading: false,
            progress: 0,
            error
          })
          onError?.(error)
        }
      })

      // Handle upload error
      xhr.addEventListener('error', () => {
        const error = 'Upload failed'
        setUploadState({
          isUploading: false,
          progress: 0,
          error
        })
        onError?.(error)
      })

      // Start upload
      xhr.open('POST', '/api/imagekit/upload')
      xhr.send(formData)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage
      })
      onError?.(errorMessage)
    }
  }, [])

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null
    })
  }, [])

  return {
    uploadFile,
    resetUploadState,
    ...uploadState
  }
}

// Hook for ImageKit authentication
export function useImageKitAuth() {
  const [authParams, setAuthParams] = useState<ImageKitAuthParams | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthParams = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/imagekit/auth')
      if (!response.ok) {
        throw new Error('Failed to get authentication parameters')
      }
      
      const params = await response.json()
      setAuthParams(params)
      return params
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    authParams,
    getAuthParams,
    isLoading,
    error
  }
}

// Hook for ImageKit configuration
export function useImageKitConfig() {
  return imagekitConfig
}


