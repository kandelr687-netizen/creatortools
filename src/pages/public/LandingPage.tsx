import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Video,
  Upload,
  ClipboardCheck,
  Coins,
  Wallet,
  ArrowRight,
  AlertTriangle,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">Creators Point</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 py-20 lg:py-28 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Coins className="h-4 w-4" />
              1 Point = NPR 1
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-4">
              Create. Submit. <span className="text-primary">Earn.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Create original content, submit your video, and earn points when
              your content is approved. Withdraw your earnings anytime.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2">
                  <Play className="h-4 w-4" /> See How It Works
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20"
          >
            <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { icon: Video, title: 'Create', desc: 'Create original content' },
                { icon: Upload, title: 'Submit', desc: 'Submit your video link' },
                { icon: ClipboardCheck, title: 'Review', desc: 'Admin reviews it' },
                { icon: Coins, title: 'Earn', desc: 'Get points when approved' },
                { icon: Wallet, title: 'Withdraw', desc: 'Cash out your earnings' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3 relative">
                    <step.icon className="h-8 w-8 text-primary" />
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Point system */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-center mb-10">Point System</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border p-8 text-center shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">1</p>
                <p className="font-medium">Point = NPR 1</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Every point is worth one Nepali rupee
                </p>
              </div>
              <div className="bg-white rounded-2xl border p-8 text-center shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">100</p>
                <p className="font-medium">Minimum Withdrawal</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Withdraw once you reach 100 points
                </p>
              </div>
              <div className="bg-white rounded-2xl border p-8 text-center shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">+</p>
                <p className="font-medium">Reward Points</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Earn points for every approved submission
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Notice */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Important Notice</h3>
              <p className="text-sm text-amber-800">
                Rewards and deductions are determined according to each
                campaign/category and admin review. Every submission is manually
                reviewed before points are awarded or deducted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-violet-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to start earning?</h2>
          <p className="text-white/80 mb-8">
            Join Creators Point today and turn your creativity into earnings.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Creators Point. All rights reserved.
        </div>
      </footer>
    </div>
  )
}