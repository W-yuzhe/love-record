import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapPin,
  Crosshair,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Moon,
  Smile,
  Frown,
  Meh,
  Heart,
  Upload,
  Image as ImageIcon,
  Video,
  Check,
  Loader2,
  X,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Chip } from '@/components/ui/Chip'
import { useAuth } from '@/contexts/AuthContext'
import { createMemory } from '@/api/memories'
import { isSupabaseConfigured } from '@/lib/supabase'
import { compressImages } from '@/utils/image'
import type { MemoryMood } from '@/types'

const weatherOptions = [
  { key: 'sunny', label: '晴天', icon: <Sun className="h-3.5 w-3.5" /> },
  { key: 'cloudy', label: '多云', icon: <Cloud className="h-3.5 w-3.5" /> },
  { key: 'rainy', label: '雨天', icon: <CloudRain className="h-3.5 w-3.5" /> },
  { key: 'snowy', label: '下雪', icon: <CloudSnow className="h-3.5 w-3.5" /> },
  { key: 'night', label: '夜晚', icon: <Moon className="h-3.5 w-3.5" /> },
]

const moodOptions = [
  { key: 'happy', label: '开心', icon: <Smile className="h-3.5 w-3.5" /> },
  { key: 'romantic', label: '浪漫', icon: <Heart className="h-3.5 w-3.5" /> },
  { key: 'calm', label: '平静', icon: <Meh className="h-3.5 w-3.5" /> },
  { key: 'sad', label: '难过', icon: <Frown className="h-3.5 w-3.5" /> },
]

const locationSuggestions = [
  { name: '西湖断桥', address: '浙江省杭州市西湖区', district: '西湖区', city: '杭州' },
  { name: '灵隐寺', address: '浙江省杭州市西湖区灵隐路', district: '西湖区', city: '杭州' },
  { name: '大理古城', address: '云南省大理市', district: '大理市', city: '大理' },
]

interface MediaFile {
  file: File
  type: 'image' | 'video'
  preview: string
}

export default function CreateMemory() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from') || 'nav'
  const monthKey = searchParams.get('month') || ''
  const isAlbumMode = from === 'album'
  const { user, couple, authReady, authError } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const supabaseConfigured = isSupabaseConfigured

  const defaultDate = useMemo(() => {
    if (isAlbumMode && monthKey) {
      return `${monthKey}-01`
    }
    return new Date().toISOString().split('T')[0]
  }, [isAlbumMode, monthKey])

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [suggestions, setSuggestions] = useState(locationSuggestions)
  const [selectedLocation, setSelectedLocation] = useState<(typeof locationSuggestions)[0] | null>(null)
  const [weather, setWeather] = useState<string | null>(null)
  const [mood, setMood] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [status, setStatus] = useState('准备记录')
  const [isLocating, setIsLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('create-memory-warnings') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    sessionStorage.setItem('create-memory-warnings', JSON.stringify(dismissedWarnings))
  }, [dismissedWarnings])

  const addFiles = async (newFiles: File[]) => {
    const compressed = await compressImages(newFiles)
    compressed.forEach((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      const url = URL.createObjectURL(file)
      setMediaFiles((prev) => [...prev, { file, type, preview: url }])
    })
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    await addFiles(Array.from(e.dataTransfer.files))
  }, [])

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(Array.from(e.target.files || []))
  }

  const onVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(Array.from(e.target.files || []))
  }

  const removeFile = (index: number) => {
    setMediaFiles((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const handleLocationSearch = (value: string) => {
    setLocation(value)
    if (!value) {
      setSuggestions(locationSuggestions)
      return
    }
    setSuggestions(
      locationSuggestions.filter(
        (s) => s.name.includes(value) || s.address.includes(value) || s.city.includes(value),
      ),
    )
  }

  const handleLocate = () => {
    setIsLocating(true)
    setStatus('正在读取当前位置…')
    setTimeout(() => {
      setIsLocating(false)
      setLocation('当前位置：杭州市西湖区文三路')
      setSelectedLocation({ name: '当前位置', address: '杭州市西湖区文三路', district: '西湖区', city: '杭州' })
      setStatus('坐标已保存 区县：西湖区 城市：杭州')
    }, 1200)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return

    // 如果配置了 Supabase 但认证还没就绪，给出明确提示
    if (supabaseConfigured && !authReady) {
      setErrorMsg('Supabase 认证初始化中，请稍后再试，或检查 Anonymous 登录是否已启用。')
      setStatus('等待认证')
      return
    }

    setSubmitting(true)
    setStatus('正在保存记忆…')
    setErrorMsg(null)

    try {
      await createMemory(
        {
          title,
          date,
          description,
          mood: (mood as MemoryMood) || undefined,
          weather: weather || undefined,
          visibility: 'public',
          locations: selectedLocation
            ? [
                {
                  name: selectedLocation.name,
                  address: selectedLocation.address,
                  district: selectedLocation.district,
                  city: selectedLocation.city,
                },
              ]
            : [],
          tags,
          files: mediaFiles.map((m) => m.file),
        },
        user?.id || 'local-user',
        couple?.id || 'local-couple',
      )
      setStatus('已保存')
      navigate(isAlbumMode && monthKey ? `/album/${monthKey}` : '/memories')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.message || '保存失败，请检查网络或配置')
      setStatus('保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-container mx-auto max-w-3xl pt-24">
      <div className="mb-8 text-center">
        <p className="mb-1 text-sm tracking-widest text-star-pink/80 uppercase">
          {isAlbumMode ? 'New Moment' : 'New Memory'}
        </p>
        <h1 className="section-title">{isAlbumMode ? '记录这一刻' : '记一件小事'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard>
          {/* Title + Date */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">事件名称</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：第一次一起做饭"
                className="w-full rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">日期</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-white outline-none ring-star-pink/30 transition-all focus:ring-2"
              />
            </div>
          </div>

          {!isAlbumMode && (
            <>
              {/* Location */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-white/80">地点</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    placeholder="搜索地点，或读取当前位置"
                    className="w-full rounded-xl border border-glass-border bg-white/5 py-3 pl-12 pr-12 text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={handleLocate}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {suggestions.length > 0 && location && (
                  <div className="mt-2 space-y-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setLocation(s.name)
                          setSelectedLocation(s)
                          setStatus(`坐标已保存 区县：${s.district} 城市：${s.city}`)
                          setSuggestions([])
                        }}
                        className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
                      >
                        <MapPin className="h-4 w-4 text-star-pink" />
                        <div>
                          <p className="text-sm font-medium text-white">{s.name}</p>
                          <p className="text-xs text-white/50">{s.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedLocation && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span>坐标已保存 区县：{selectedLocation.district} · 城市：{selectedLocation.city}</span>
                  </div>
                )}
              </div>

              {/* Weather & Mood */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">天气</label>
              <div className="flex flex-wrap gap-2">
                {weatherOptions.map((w) => (
                  <Chip
                    key={w.key}
                    label={w.label}
                    icon={w.icon}
                    active={weather === w.key}
                    onClick={() => setWeather(w.key)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">心情</label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((m) => (
                  <Chip
                    key={m.key}
                    label={m.label}
                    icon={m.icon}
                    active={mood === m.key}
                    onClick={() => setMood(m.key)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/80">标签</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="输入标签后按回车"
                className="flex-1 rounded-xl border border-glass-border bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
              >
                添加
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-star-pink/15 px-3 py-1 text-xs text-star-pink"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
            </>
          )}

          {/* Description */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/80">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="那天的细节、想说的话…"
              className="w-full rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
            />
          </div>

          {/* Media upload */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/80">照片 / 视频</label>
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-glass-border bg-white/5 px-6 py-10 text-center transition-colors hover:bg-white/[0.07]"
            >
              <Upload className="mb-3 h-10 w-10 text-white/40" />
              <p className="text-sm font-medium text-white/80">拖拽照片或视频到这里</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                >
                  <ImageIcon className="h-4 w-4" />
                  选择图片
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                >
                  <Video className="h-4 w-4" />
                  选择视频
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">支持 JPG、PNG、WebP、MP4</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onImageChange}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={onVideoChange}
              />
            </div>
            {mediaFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {mediaFiles.map((m, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-glass-border">
                    {m.type === 'video' ? (
                      <video src={m.preview} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={m.preview} alt="uploaded" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-abyss/70 text-white/70 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="mb-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">
            状态：<span className="text-star-pink">{status}</span>
          </div>

          {supabaseConfigured && authError && !dismissedWarnings.includes('auth') && (
            <div className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">Supabase 匿名登录失败</p>
                  <p className="mt-1 text-amber-200/80">
                    错误：{authError.message}。请前往 Supabase 控制台 → Authentication → Providers → 启用
                    Anonymous。当前数据会暂存到浏览器本地。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedWarnings((prev) => [...prev, 'auth'])}
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-amber-200/70 hover:bg-amber-500/10 hover:text-amber-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {supabaseConfigured && authReady && !couple && !dismissedWarnings.includes('couple') && (
            <div className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">伴侣关系尚未初始化完成</p>
                  <p className="mt-1 text-amber-200/80">
                    请确认 schema.sql 已执行，且 couples 表已创建。当前数据会暂存到浏览器本地。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedWarnings((prev) => [...prev, 'couple'])}
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-amber-200/70 hover:bg-amber-500/10 hover:text-amber-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(isAlbumMode && monthKey ? `/album/${monthKey}` : '/memories')}
              className="rounded-full px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              取消
            </button>
            <GradientButton type="submit" className="px-12" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中
                </span>
              ) : (
                isAlbumMode ? '保存这一刻' : '保存记忆'
              )}
            </GradientButton>
          </div>
        </GlassCard>
      </form>
    </section>
  )
}
