import { NavLink } from 'react-router-dom'
import { Zap } from 'lucide-react'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white flex flex-col justify-between p-8 lg:p-16">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl">Creators Point</span>
        </NavLink>
        <div>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-4">
            Create. Submit. Earn.
          </h1>
          <p className="text-white/80 text-lg max-w-md mb-8">
            Create original content, submit your video link, and earn points
            when your content is approved. 1 point = NPR 1.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3 backdrop-blur">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium">Create original content</p>
                <p className="text-sm text-white/70">Follow campaign instructions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3 backdrop-blur">
              <span className="text-2xl">📤</span>
              <div>
                <p className="font-medium">Submit your video</p>
                <p className="text-sm text-white/70">Paste your Google Drive link</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3 backdrop-blur">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-medium">Earn and withdraw</p>
                <p className="text-sm text-white/70">Minimum withdrawal: 100 points</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Creators Point</p>
      </div>

      {/* Right form panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}