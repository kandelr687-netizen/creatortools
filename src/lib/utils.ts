import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number): string {
  return points.toLocaleString()
}

export function formatCurrency(points: number): string {
  return `NPR ${points.toLocaleString()}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isGoogleDriveUrl(url: string): boolean {
  const patterns = [
    /drive\.google\.com/i,
    /docs\.google\.com\/file\/d\//i,
    /drive\.usercontent\.google\.com/i,
  ]
  return patterns.some(p => p.test(url))
}

export function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /youtube\.com\/shorts\//i,
  ]
  return patterns.some(p => p.test(url))
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
