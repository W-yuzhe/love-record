export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: 'image/jpeg' | 'image/webp' | 'image/png'
}

/**
 * 使用 canvas 压缩图片，返回新的 File。
 * 视频/音频文件会原样返回。
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  // 只压缩图片
  if (!file.type.startsWith('image/')) {
    return file
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    type = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 canvas context'))
        return
      }

      // 透明通道图片保留 png，否则统一 jpeg
      const outputType = file.type === 'image/png' && type !== 'image/jpeg' ? 'image/png' : type
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('canvas 压缩失败'))
            return
          }
          const ext = outputType.split('/')[1]
          const compressed = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          })
          resolve(compressed)
        },
        outputType,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 批量压缩图片文件
 */
export async function compressImages(files: FileList | File[]): Promise<File[]> {
  const list = files instanceof FileList ? Array.from(files) : files
  return Promise.all(list.map((file) => compressImage(file)))
}
