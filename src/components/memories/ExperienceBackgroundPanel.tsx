import { useRef, useState } from 'react'
import { X, Image, Upload, Trash2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { fileToBase64 } from '@/utils/file'
import { compressImages } from '@/utils/image'

interface ExperienceBackgroundPanelProps {
  background: { type: 'url' | 'base64' | null; value: string }
  onSet: (type: 'url' | 'base64', value: string) => void
  onClear: () => void
  onClose: () => void
}

export function ExperienceBackgroundPanel({
  background,
  onSet,
  onClear,
  onClose,
}: ExperienceBackgroundPanelProps) {
  const [mode, setMode] = useState<'url' | 'upload'>(background.type === 'base64' ? 'upload' : 'url')
  const [urlInput, setUrlInput] = useState(background.type === 'url' ? background.value : '')
  const [uploadPreview, setUploadPreview] = useState(background.type === 'base64' ? background.value : '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const compressed = await compressImages(Array.from(files))
      const base64 = await fileToBase64(compressed[0])
      setUploadPreview(base64)
      setMode('upload')
    } finally {
      setUploading(false)
    }
  }

  const handleApply = () => {
    if (mode === 'url' && urlInput.trim()) {
      onSet('url', urlInput.trim())
    } else if (mode === 'upload' && uploadPreview) {
      onSet('base64', uploadPreview)
    }
  }

  const preview = mode === 'url' ? urlInput : uploadPreview

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-full z-50 mt-3 w-80 rounded-2xl border border-white/10 bg-[#151025] p-5 shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-white">设置 Experience 背景</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex gap-2 rounded-xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-colors ${
            mode === 'url' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <Image className="h-3.5 w-3.5" />
          路径
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-colors ${
            mode === 'upload' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          上传
        </button>
      </div>

      {mode === 'url' ? (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-white/60">public 文件夹中的图片路径</label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="例如 /experience-bg.png"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
          />
          <p className="mt-1.5 text-[10px] text-white/40">
            把图片放到 public 文件夹，然后填写 /文件名.png
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                处理中…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                选择图片
              </>
            )}
          </button>
          {uploadPreview ? (
            <p className="text-xs text-white/50">已选择，点击应用生效</p>
          ) : (
            <p className="text-xs text-white/40">图片会压缩后存在浏览器本地</p>
          )}
        </div>
      )}

      {preview && (
        <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <img
            src={preview}
            alt="预览"
            className="h-28 w-full object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="flex gap-2">
        {background.type && (
          <button
            type="button"
            onClick={onClear}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-sm text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清除
          </button>
        )}
        <button
          type="button"
          onClick={handleApply}
          disabled={!preview}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-love-gradient py-2 text-sm font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          应用
        </button>
      </div>
    </motion.div>
  )
}
