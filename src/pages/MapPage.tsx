import { useState, useRef, useMemo } from 'react'
import { MapPin, X, Image as ImageIcon, Video, Upload, Loader2, Footprints } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaticChinaMap } from '@/components/map/StaticChinaMap'
import { ProvinceCityMap } from '@/components/map/ProvinceCityMap'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { useFootprints } from '@/hooks/useFootprints'
import { provinceToCities } from '@/data/cityProvinceMap'
import type { FootprintCity } from '@/types'

interface MediaFile {
  file: File
  type: 'image' | 'video'
  preview: string
}

function TripMemoryModal({
  city,
  onClose,
  onSave,
  onUnlight,
  saving,
  unlighting,
}: {
  city: FootprintCity
  onClose: () => void
  onSave: (input: { note: string; newFiles: File[]; keptMedia: { url: string; type: 'image' | 'video' }[] }) => Promise<void>
  onUnlight: () => Promise<void>
  saving: boolean
  unlighting: boolean
}) {
  const [note, setNote] = useState(city.memory_note || '')
  const [existingMedia, setExistingMedia] = useState<{ url: string; type: 'image' | 'video' }[]>(city.memory_media || [])
  const [newFiles, setNewFiles] = useState<MediaFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (added: File[]) => {
    added.forEach((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      const url = URL.createObjectURL(file)
      setNewFiles((prev) => [...prev, { file, type, preview: url }])
    })
  }

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const removeExisting = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    await onSave({ note, newFiles: newFiles.map((f) => f.file), keptMedia: existingMedia })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-abyss/70 p-4 backdrop-blur-glass"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg"
      >
        <GlassCard className="max-h-[80vh] overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-star-pink/20">
                <MapPin className="h-5 w-5 text-star-pink" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold italic text-white">{city.name}</h3>
                <p className="text-xs text-white/50">
                  {city.has_memory ? '已点亮' : '点击保存，点亮这座城市'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-white/80">旅行回忆</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="写下在这座城市的故事…"
              className="w-full rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/80">照片 / 视频</label>
            <div
              onDrop={(e) => {
                e.preventDefault()
                addFiles(Array.from(e.dataTransfer.files))
              }}
              onDragOver={(e) => e.preventDefault()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-glass-border bg-white/5 px-6 py-8 text-center transition-colors hover:bg-white/[0.07]"
            >
              <Upload className="mb-2 h-8 w-8 text-white/40" />
              <p className="text-sm font-medium text-white/80">拖拽照片或视频到这里</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                >
                  <ImageIcon className="h-4 w-4" />
                  图片
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                >
                  <Video className="h-4 w-4" />
                  视频
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
            </div>

            {(existingMedia.length > 0 || newFiles.length > 0) && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {existingMedia.map((m, i) => (
                  <div key={`e-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-glass-border">
                    {m.type === 'video' ? (
                      <video src={m.url} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-abyss/70 text-white/70 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {newFiles.map((f, i) => (
                  <div key={`n-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-glass-border">
                    {f.type === 'video' ? (
                      <video src={f.preview} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={f.preview} alt="" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-abyss/70 text-white/70 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              取消
            </button>
            {city.has_memory && (
              <button
                onClick={onUnlight}
                disabled={unlighting}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-red-300/80 transition-colors hover:text-red-300 disabled:opacity-50"
              >
                {unlighting ? '取消中…' : '取消点亮'}
              </button>
            )}
            <GradientButton onClick={handleSave} disabled={saving} className="px-6">
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中
                </span>
              ) : (
                '保存并点亮'
              )}
            </GradientButton>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

export default function MapPage() {
  const { cities, loading, error, saveMemory, unlight } = useFootprints()
  const [view, setView] = useState<'country' | 'province'>('country')
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const [selected, setSelected] = useState<FootprintCity | null>(null)
  const [saving, setSaving] = useState(false)
  const [unlighting, setUnlighting] = useState(false)

  const memoryCities = useMemo(() => cities.filter((c) => c.has_memory).length, [cities])

  const handleProvinceClick = (id: string) => {
    const names = provinceToCities[id] || []
    if (names.length === 0) return
    if (names.length === 1) {
      const city = cities.find((c) => c.name === names[0])
      if (city) {
        setSelected(city)
        return
      }
    }
    setProvinceId(id)
    setView('province')
  }

  const handleBackToCountry = () => {
    setView('country')
    setProvinceId(null)
  }

  const handleCityClick = (city: FootprintCity) => {
    setSelected(city)
  }

  const handleSave = async (input: { note: string; newFiles: File[]; keptMedia: { url: string; type: 'image' | 'video' }[] }) => {
    if (!selected) return
    setSaving(true)
    try {
      await saveMemory(selected, input)
    } finally {
      setSaving(false)
    }
  }

  const handleUnlight = async () => {
    if (!selected) return
    setUnlighting(true)
    try {
      await unlight(selected)
      setSelected(null)
    } finally {
      setUnlighting(false)
    }
  }

  return (
    <section className="page-container mx-auto max-w-7xl pt-24">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-sm tracking-widest text-star-pink/80 uppercase">Trip</p>
          <h1 className="section-title">足迹地图</h1>
          <p className="mt-2 text-white/60">
            已点亮{' '}
            <span className="font-serif text-2xl font-bold italic text-white">{memoryCities}</span>{' '}
            / {cities.length} 座城市
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Footprints className="h-4 w-4" />
          <span>{view === 'country' ? '点击省份查看城市' : '点击城市记录旅行回忆'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="relative h-[60vh] min-h-[420px] md:h-[70vh]">
        {view === 'country' ? (
          <StaticChinaMap
            cities={cities}
            selectedId={selected?.id}
            onProvinceClick={handleProvinceClick}
            className="h-full w-full"
          />
        ) : (
          provinceId && (
            <ProvinceCityMap
              provinceId={provinceId}
              cities={cities}
              onCityClick={handleCityClick}
              onBack={handleBackToCountry}
            />
          )
        )}

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-abyss/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              加载足迹中…
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {cities
          .filter((c) => c.has_memory)
          .map((city) => (
            <button
              key={city.id}
              onClick={() => setSelected(city)}
              className="flex items-center gap-2 rounded-xl border border-star-pink/30 bg-star-pink/10 px-3 py-2 text-left transition-colors hover:bg-star-pink/20"
            >
              <MapPin className="h-4 w-4 text-star-pink" />
              <span className="text-sm font-medium text-white">{city.name}</span>
            </button>
          ))}
      </div>

      <AnimatePresence>
        {selected && (
          <TripMemoryModal
            city={selected}
            onClose={() => setSelected(null)}
            onSave={handleSave}
            onUnlight={handleUnlight}
            saving={saving}
            unlighting={unlighting}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
