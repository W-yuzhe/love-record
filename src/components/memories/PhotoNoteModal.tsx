import { useEffect, useState } from 'react'
import {
  X,
  MapPin,
  Calendar,
  Heart,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Tag,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Memory, MemoryMedia } from '@/types'

interface PhotoNoteModalProps {
  memory: Memory
  media: MemoryMedia
  onClose: () => void
  onSaveNote: (note: string) => void | Promise<void>
  onLike: () => void
  onDelete: () => void
  onSetCover?: () => void
  onUpdateMeta?: (input: { date: string; tags: string[] }) => void | Promise<void>
  onAddFiles?: () => void
}

export function PhotoNoteModal({
  memory,
  media,
  onClose,
  onSaveNote,
  onLike,
  onDelete,
  onSetCover,
  onUpdateMeta,
  onAddFiles,
}: PhotoNoteModalProps) {
  const [note, setNote] = useState(media.note || '')
  const [date, setDate] = useState(memory.date)
  const [tags, setTags] = useState<string[]>(memory.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)

  useEffect(() => {
    setNote(media.note || '')
    setDate(memory.date)
    setTags(memory.tags || [])
  }, [media.note, memory.date, memory.tags])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveNote(note)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMeta = async () => {
    if (!onUpdateMeta) return
    setSavingMeta(true)
    try {
      await onUpdateMeta({ date, tags })
    } finally {
      setSavingMeta(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const isVideo =
    media.type === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(media.url)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#151025] shadow-2xl md:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left: media */}
          <div className="relative flex min-h-[40vh] w-full items-center justify-center bg-black md:w-1/2 md:min-h-full">
            {isVideo ? (
              <video
                src={media.url}
                controls
                className="max-h-[50vh] w-full object-contain md:max-h-[90vh]"
                playsInline
              />
            ) : (
              <img
                src={media.url}
                alt={memory.title}
                className="max-h-[50vh] w-full object-contain md:max-h-[90vh]"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
          </div>

          {/* Right: note & meta */}
          <div className="flex w-full flex-col p-6 md:w-1/2 md:p-8">
            <div className="mb-5">
              <h2 className="font-serif text-2xl font-semibold italic text-white md:text-3xl">
                {memory.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {memory.date}
                </span>
                {memory.locations[0] && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {memory.locations[0].name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Editable meta */}
              {onUpdateMeta && (
                <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/70">
                      <Calendar className="h-3.5 w-3.5" />
                      日期
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none ring-star-pink/30 transition-all focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/70">
                      <Tag className="h-3.5 w-3.5" />
                      分类 / 标签
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="输入标签后回车"
                        className="flex-1 rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
                      >
                        添加
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 rounded-full bg-star-pink/15 px-2.5 py-1 text-xs text-star-pink"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMeta}
                    disabled={savingMeta}
                    className="mt-4 w-full rounded-lg bg-white/10 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-60"
                  >
                    {savingMeta ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        保存中
                      </span>
                    ) : (
                      '保存日期/分类'
                    )}
                  </button>
                </div>
              )}

              <label className="mb-2 block text-sm font-medium text-white/70">便签</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                placeholder="写下这张照片的故事…"
                className="w-full resize-none rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
              />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onLike}
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-star-pink/20 hover:text-star-pink"
                >
                  <Heart
                    className={`h-4 w-4 ${(media.likes || 0) > 0 ? 'fill-star-pink text-star-pink' : ''}`}
                  />
                  <span>{media.likes || 0}</span>
                </button>

                {onSetCover && (
                  <button
                    type="button"
                    onClick={onSetCover}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {media.is_cover ? '已设为封面' : '设为封面'}
                  </button>
                )}

                {onAddFiles && (
                  <button
                    type="button"
                    onClick={onAddFiles}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    追加照片
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('确定删除这张照片吗？')) {
                      onDelete()
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-love-gradient px-5 py-2 text-sm font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中
                    </span>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
