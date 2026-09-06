import type { Memory, Wish, FootprintCity, DailyQA, User, Couple } from '@/types'

export const siteConfig = {
  name: import.meta.env.VITE_SITE_NAME || '恋爱记录',
  partnerA: import.meta.env.VITE_PARTNER_A_NICKNAME || '小A',
  partnerB: import.meta.env.VITE_PARTNER_B_NICKNAME || '小B',
  startDate: import.meta.env.VITE_LOVE_START_DATE || '2025-09-10',
}

export function daysTogether(): number {
  const start = new Date(siteConfig.startDate)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

export function nextAnniversary(): { daysLeft: number; label: string } {
  const start = new Date(siteConfig.startDate)
  const now = new Date()
  const currentYear = now.getFullYear()
  let anniv = new Date(currentYear, start.getMonth(), start.getDate())
  if (anniv < now) {
    anniv = new Date(currentYear + 1, start.getMonth(), start.getDate())
  }
  const daysLeft = Math.floor((anniv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const yearDiff = anniv.getFullYear() - new Date(siteConfig.startDate).getFullYear()
  return { daysLeft, label: `${yearDiff} 周年倒计时` }
}

export const currentUser: User = {
  id: 'user-a',
  email: 'a@example.com',
  nickname: siteConfig.partnerA,
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A',
  created_at: new Date().toISOString(),
}

export const couple: Couple = {
  id: 'couple-1',
  partner_a_id: 'user-a',
  partner_b_id: 'user-b',
  start_date: siteConfig.startDate,
  couple_name: siteConfig.name,
  created_at: new Date().toISOString(),
}

export const mockMemories: Memory[] = [
  {
    id: 'm1',
    title: '云南大理，洱海边的日落',
    date: '2024-11-15',
    description: '风很大，但你的外套很暖。我们在磻溪村租了单车，沿着生态廊道骑到日落。',
    mood: 'sunny',
    weather: '晴',
    visibility: 'public',
    created_by: 'user-a',
    created_at: '2024-11-15T20:00:00Z',
    updated_at: '2024-11-15T20:00:00Z',
    locations: [
      {
        id: 'loc-1',
        memory_id: 'm1',
        name: '洱海生态廊道',
        address: '云南省大理市',
        lat: 25.82,
        lng: 100.18,
        district: '大理市',
        city: '大理',
      },
    ],
    media: [
      {
        id: 'media-1',
        memory_id: 'm1',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        type: 'image',
        sort_order: 0,
      },
    ],
    tags: ['旅行', '日落'],
    completeness: 10,
    partner_status: 'both',
  },
  {
    id: 'm2',
    title: '毕业展那天，你穿了白裙子',
    date: '2024-06-18',
    description: '展馆里人很多，但你一出现我就找到了焦点。',
    mood: 'sunny',
    weather: '多云',
    visibility: 'public',
    created_by: 'user-b',
    created_at: '2024-06-18T18:00:00Z',
    updated_at: '2024-06-18T18:00:00Z',
    locations: [
      {
        id: 'loc-2',
        memory_id: 'm2',
        name: '中国美术学院象山校区',
        address: '浙江省杭州市西湖区转塘街道',
        lat: 30.15,
        lng: 120.08,
        district: '西湖区',
        city: '杭州',
      },
    ],
    media: [
      {
        id: 'media-2',
        memory_id: 'm2',
        url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',
        type: 'image',
        sort_order: 0,
      },
    ],
    tags: ['校园', '重要时刻'],
    completeness: 7,
    partner_status: 'both',
  },
  {
    id: 'm3',
    title: '第一次一起做饭',
    date: '2024-03-22',
    description: '番茄炒蛋盐放多了，但米饭刚好。',
    mood: 'cloudy',
    weather: '小雨',
    visibility: 'public',
    created_by: 'user-a',
    created_at: '2024-03-22T19:30:00Z',
    updated_at: '2024-03-22T19:30:00Z',
    locations: [
      {
        id: 'loc-3',
        memory_id: 'm3',
        name: '家里',
        address: '杭州市拱墅区',
        lat: 30.28,
        lng: 120.16,
        district: '拱墅区',
        city: '杭州',
      },
    ],
    media: [],
    tags: ['日常'],
    completeness: 6,
    partner_status: 'waiting_for_partner',
  },
]

export const mockWishes: Wish[] = [
  {
    id: 'w1',
    title: '一起去冰岛看极光',
    category: 'travel',
    description: '躺在温泉里抬头看绿色极光。',
    is_achieved: false,
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 'w2',
    title: '养一只橘猫',
    category: 'life',
    description: '名字都想好了，叫年糕。',
    is_achieved: false,
    created_at: '2024-02-14T00:00:00Z',
  },
  {
    id: 'w3',
    title: '去迪士尼看烟花',
    category: 'travel',
    description: '2024 年万圣节实现啦！',
    is_achieved: true,
    achieved_date: '2024-10-31',
    related_memory_id: 'm1',
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'w4',
    title: '学做提拉米苏',
    category: 'food',
    description: '手指饼干要泡够咖啡。',
    is_achieved: true,
    achieved_date: '2024-05-20',
    created_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 'w5',
    title: '跑一次半马',
    category: 'growth',
    description: '互相监督早起训练。',
    is_achieved: false,
    created_at: '2024-04-01T00:00:00Z',
  },
  {
    id: 'w6',
    title: '去看五月天演唱会',
    category: 'life',
    description: '山顶票也没关系。',
    is_achieved: false,
    created_at: '2024-06-01T00:00:00Z',
  },
]

export const mockFootprintCities: FootprintCity[] = [
  { id: 'f1', name: '杭州', visit_count: 5, memory_count: 12, lat: 30.27, lng: 120.15 },
  { id: 'f2', name: '大理', visit_count: 1, memory_count: 3, lat: 25.61, lng: 100.27 },
  { id: 'f3', name: '上海', visit_count: 3, memory_count: 5, lat: 31.23, lng: 121.47 },
  { id: 'f4', name: '厦门', visit_count: 2, memory_count: 4, lat: 24.48, lng: 118.18 },
  { id: 'f5', name: '成都', visit_count: 1, memory_count: 2, lat: 30.57, lng: 104.06 },
  { id: 'f6', name: '青岛', visit_count: 1, memory_count: 2, lat: 36.07, lng: 120.38 },
  { id: 'f7', name: '西安', visit_count: 1, memory_count: 1, lat: 34.34, lng: 108.93 },
]

export const mockQA: DailyQA[] = [
  {
    id: 'q1',
    question: '今天最让你开心的小瞬间是什么？',
    partner_a_answer: '下班路上买到的糖炒栗子很甜。',
    partner_b_answer: '你突然发来的那只猫的视频。',
    date: '2024-12-01',
  },
  {
    id: 'q2',
    question: '如果可以瞬间学会一项技能，你想学什么？',
    partner_a_answer: '弹钢琴，给你弹《City of Stars》。',
    partner_b_answer: '做蛋糕，生日给你做草莓千层。',
    date: '2024-12-02',
  },
  {
    id: 'q3',
    question: '本周最想和对方一起做的小事？',
    partner_a_answer: '周末去逛早市，吃豆腐脑。',
    partner_b_answer: '还没想好，想听你的。',
    date: '2024-12-03',
  },
]
