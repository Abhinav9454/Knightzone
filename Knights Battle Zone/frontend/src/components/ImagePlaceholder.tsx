import React from 'react'
import { ImageService } from '@/lib/images'

interface ImagePlaceholderProps {
  src?: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  rounded?: boolean
  gradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  opacity?: number
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  rounded = true,
  gradient = false,
  gradientColor1 = '#3b82f6',
  gradientColor2 = '#8b5cf6',
  opacity = 1,
}) => {
  const imageSrc = src || ImageService.gradient(width, height, gradientColor1.replace('#', ''), gradientColor2.replace('#', ''))

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 ${
        rounded ? 'rounded-lg' : ''
      } ${className}`}
      style={{
        width,
        height,
        opacity,
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback to gradient if image fails
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    </div>
  )
}

interface HeroImageProps {
  title: string
  subtitle?: string
  imageUrl?: string
  imagePosition?: 'left' | 'right' | 'background'
  height?: string
  gradient?: boolean
}

export const HeroImage: React.FC<HeroImageProps> = ({
  title,
  subtitle,
  imageUrl,
  imagePosition = 'right',
  height = 'h-96',
  gradient = true,
}) => {
  const bgGradient = gradient
    ? 'bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20'
    : 'bg-slate-900'

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-primary/20 p-8 md:p-12 ${bgGradient} ${height}`}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-20 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-2 items-center">
        {/* Text Content */}
        <div className={imagePosition === 'right' ? 'order-1' : 'order-2'}>
          <h1 className="text-4xl font-bold md:text-5xl text-white mb-4">{title}</h1>
          {subtitle && <p className="text-lg text-slate-300">{subtitle}</p>}
        </div>

        {/* Hero Image */}
        {imageUrl && imagePosition !== 'background' && (
          <div className={imagePosition === 'right' ? 'order-2' : 'order-1'}>
            <ImagePlaceholder
              src={imageUrl}
              alt={title}
              width={400}
              height={300}
              rounded
              className="shadow-2xl"
            />
          </div>
        )}

        {/* Background Image */}
        {imageUrl && imagePosition === 'background' && (
          <div className="absolute inset-0 opacity-30 rounded-2xl overflow-hidden">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardImageProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  imageUrl?: string
  color?: string
}

export const StatCardWithImage: React.FC<StatCardImageProps> = ({
  label,
  value,
  icon,
  imageUrl,
  color = 'from-blue-500 to-purple-600',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-6 text-white shadow-lg`}>
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0 opacity-20">
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <span className="text-sm font-semibold opacity-90">{label}</span>
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  )
}

export default ImagePlaceholder
