import React, { useState, useEffect } from 'react'
import ImageService from '@/lib/images'

interface UserAvatarProps {
  userId?: string | number
  username?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  imageUrl?: string
  className?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  username,
  size = 'md',
  imageUrl,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl',
  }

  const avatarSeed = username || `user-${userId}` || 'anonymous'
  const avatarUrl = imageUrl || ImageService.avatar(avatarSeed, parseInt(sizeMap[size].match(/\d+/)?.[0] || '12'))

  return (
    <div
      className={`rounded-full overflow-hidden border-2 border-primary flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 ${sizeMap[size]} ${className}`}
    >
      <img
        src={avatarUrl}
        alt={username || 'User avatar'}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = ImageService.placeholder(24, 24)
        }}
      />
    </div>
  )
}

interface LeaderboardBadgeProps {
  rank: number
  variant?: 'medal' | 'badge'
}

export const LeaderboardBadge: React.FC<LeaderboardBadgeProps> = ({ rank, variant = 'medal' }) => {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (variant === 'medal') {
    const emoji = getMedalEmoji(rank)
    if (!emoji) return null
    return <span className="text-2xl">{emoji}</span>
  }

  const colors = {
    1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    2: 'bg-slate-400/20 text-slate-300 border-slate-400/50',
    3: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  }

  const baseColor = rank <= 3 ? colors[rank as keyof typeof colors] : 'bg-slate-700/20 text-slate-300 border-slate-700/50'

  return (
    <div className={`px-3 py-1 rounded-full border text-sm font-semibold ${baseColor}`}>
      #{rank}
    </div>
  )
}

interface AchievementBadgeProps {
  title: string
  description?: string
  icon: string | React.ReactNode
  color?: 'gold' | 'silver' | 'bronze' | 'purple'
  unlocked?: boolean
  progress?: number
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  color = 'gold',
  unlocked = true,
  progress,
}) => {
  const colorMap = {
    gold: 'from-yellow-500/40 to-amber-500/40 border-yellow-500/50 text-yellow-100',
    silver: 'from-slate-400/40 to-slate-500/40 border-slate-400/50 text-slate-100',
    bronze: 'from-orange-500/40 to-amber-400/40 border-orange-500/50 text-orange-100',
    purple: 'from-purple-500/40 to-pink-500/40 border-purple-500/50 text-purple-100',
  }

  return (
    <div
      className={`relative w-24 h-24 rounded-lg border flex flex-col items-center justify-center p-2 text-center transition-all ${
        unlocked
          ? `bg-gradient-to-br ${colorMap[color]}`
          : 'bg-slate-700/20 border-slate-700/50 text-slate-400 opacity-50'
      }`}
    >
      {typeof icon === 'string' ? (
        <div className="text-3xl mb-1">{icon}</div>
      ) : (
        <div className="text-2xl mb-1">{icon}</div>
      )}
      <div className="text-xs font-semibold">{title}</div>
      {progress !== undefined && (
        <div className="mt-1 w-full bg-slate-700/30 rounded-full h-1">
          <div
            className="bg-current h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface GameModeCardProps {
  title: string
  description: string
  icon: string | React.ReactNode
  image?: string
  stats?: { label: string; value: string }[]
  onClick?: () => void
  disabled?: boolean
}

export const GameModeCard: React.FC<GameModeCardProps> = ({
  title,
  description,
  icon,
  image,
  stats,
  onClick,
  disabled = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 cursor-pointer transition-all h-full ${
        disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-primary hover:shadow-lg hover:shadow-primary/20'
      }`}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Background Image */}
      {image && (
        <div className="absolute inset-0 opacity-10 rounded-xl overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-3xl">{typeof icon === 'string' ? icon : icon}</div>
          {stats && stats.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-slate-400">{stats[0].label}</div>
              <div className="text-sm font-bold text-primary">{stats[0].value}</div>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-300 mb-3">{description}</p>

        {stats && stats.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {stats.slice(1).map((stat) => (
              <div key={stat.label} className="text-xs bg-slate-700/30 px-2 py-1 rounded">
                <span className="text-slate-400">{stat.label}</span>
                <span className="ml-1 text-primary font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!disabled && <div className="absolute bottom-2 right-2 text-primary text-sm font-bold">→</div>}
    </div>
  )
}

export default UserAvatar
