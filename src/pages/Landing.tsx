import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Users,
  BarChart3,
  Shield,
  Globe,
  Quote,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LineWaves from '@/components/custom/LineWaves';
import GooeyNav from '@/components/custom/GooeyNav';
import BlurText from '@/components/custom/BlurText';
import BorderGlow from '@/components/custom/BorderGlow';
import SplashCursor from '@/components/custom/SplashCursor';

const features = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Organize projects with customizable Kanban boards, timelines, and team workspaces.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: ListChecks,
    title: 'Task Tracking',
    description: 'Create, assign, and track tasks with priorities, due dates, and custom workflows.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with real-time updates, mentions, and shared dashboards.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track velocity, burn-down charts, and team performance with beautiful visualizations.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SSO, audit logs, and advanced permissions to keep your data safe and compliant.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Access your projects from anywhere with our responsive web and mobile applications.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'TechStart Inc.',
    content: 'TaskFlow transformed how our engineering team operates. We shipped 40% more features in the first quarter.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Rivera',
    role: 'Product Lead',
    company: 'Design Labs',
    content: 'The most intuitive project management tool we have ever used. Our team adopted it within days.',
    avatar: 'MR',
  },
  {
    name: 'Emily Watson',
    role: 'Engineering Manager',
    company: 'CloudScale',
    content: 'Finally a tool that engineers actually want to use. Clean, fast, and incredibly powerful.',
    avatar: 'EW',
  },
];

const stats = [
  { value: '10K+', label: 'Active Teams' },
  { value: '2M+', label: 'Tasks Completed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9/5', label: 'User Rating' },
];

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* SplashCursor fluid effect */}
      <SplashCursor />

      {/* Full-page LineWaves Background */}
      <div className="fixed inset-0 z-0">
        <LineWaves
          speed={0.3}
          innerLineCount={32}
          outerLineCount={36}
          warpIntensity={1.0}
          rotation={-45}
          edgeFadeWidth={0.0}
          colorCycleSpeed={1.0}
          brightness={0.2}
          color1="#3b82f6"
          color2="#8b5cf6"
          color3="#06b6d4"
          enableMouseInteraction={true}
          mouseInfluence={2.0}
        />
        {/* Dark overlay to tone down brightness */}
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Navigation — Dynamic Island style */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-full px-6 h-14 flex items-center justify-between shadow-lg shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base">TaskFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <GooeyNav
              items={[
                { label: 'Features', href: '#features', onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Testimonials', href: '#testimonials', onClick: () => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Pricing', href: '#pricing', onClick: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) },
              ]}
              particleCount={12}
              particleDistances={[70, 10]}
              particleR={80}
              initialActiveIndex={0}
              animationTime={500}
              timeVariance={250}
              colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-0 overflow-hidden z-10">
        {/* Hero gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background/30 z-10" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Introducing TaskFlow 2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight mb-6"
          >
            <BlurText
              text="The future of team"
              delay={120}
              animateBy="words"
              direction="top"
              className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight justify-center"
              stepDuration={0.4}
            />
            <BlurText
              text="productivity is here"
              delay={120}
              animateBy="words"
              direction="top"
              className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight justify-center text-gradient"
              stepDuration={0.4}
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Beautiful project management for modern teams.
            Plan, track, and ship products your team loves.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-xl shadow-blue-500/25"
            >
              Start for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => window.open('https://www.youtube.com', '_blank')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors"
            >
              <Target className="w-5 h-5" />
              Watch demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center p-4 rounded-2xl bg-[#0c1222]/90 backdrop-blur-xl border border-white/[0.15]"
              >
                <p className="text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-cyan-500/30 rounded-3xl blur-xl" />
            <div className="relative rounded-2xl bg-[#0a0f1e] border border-white/[0.15] overflow-hidden shadow-2xl shadow-black/60">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-md mx-auto h-7 rounded-lg bg-white/[0.05] flex items-center px-3">
                    <span className="text-[10px] text-muted-foreground">app.taskflow.io/dashboard</span>
                  </div>
                </div>
              </div>
              {/* Dashboard preview content */}
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Projects', value: '12', color: 'text-blue-400' },
                    { label: 'Tasks Done', value: '248', color: 'text-emerald-400' },
                    { label: 'In Progress', value: '36', color: 'text-amber-400' },
                    { label: 'Team', value: '8', color: 'text-violet-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl bg-white/[0.08] border border-white/[0.14]">
                      <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 p-4 rounded-xl bg-white/[0.08] border border-white/[0.14] h-40">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-4 w-24 bg-white/[0.12] rounded" />
                      <div className="h-4 w-16 bg-white/[0.08] rounded" />
                    </div>
                    <div className="flex items-end gap-2 h-20">
                      {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-lg bg-blue-500/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.08] border border-white/[0.14]">
                    <div className="h-4 w-20 bg-white/[0.12] rounded mb-4" />
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/[0.1]" />
                          <div className="flex-1">
                            <div className="h-3 w-20 bg-white/[0.12] rounded" />
                            <div className="h-2 w-12 bg-white/[0.08] rounded mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="pt-12 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Everything your team <span className="text-gradient">needs</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help your team ship faster and collaborate better.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BorderGlow
                    backgroundColor="rgba(10, 15, 30, 0.6)"
                    borderRadius={20}
                    glowRadius={30}
                    glowIntensity={0.8}
                    edgeSensitivity={25}
                    glowColor="220 80 60"
                    colors={['#3b82f6', '#8b5cf6', '#06b6d4']}
                    className="h-full backdrop-blur-md"
                  >
                    <div className="p-5">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', feature.bg)}>
                        <Icon className={cn('w-5 h-5', feature.color)} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 relative overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Loved by <span className="text-gradient">teams</span> worldwide
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what industry leaders say about TaskFlow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <BorderGlow
                  backgroundColor="rgba(10, 15, 30, 0.6)"
                  borderRadius={20}
                  glowRadius={30}
                  glowIntensity={0.8}
                  edgeSensitivity={25}
                  glowColor="260 70 65"
                  colors={['#8b5cf6', '#3b82f6', '#06b6d4']}
                  className="h-full backdrop-blur-md"
                >
                  <div className="p-5">
                    <Quote className="w-8 h-8 text-blue-400/30 mb-4" />
                    <p className="text-foreground leading-relaxed mb-6">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-sm font-bold text-blue-300">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}, {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </BorderGlow>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-500/20" />
            <div className="absolute inset-0 bg-[#0a0e1a]/40 backdrop-blur-md" />
            <div className="relative px-8 py-16 sm:px-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                Ready to <span className="text-gradient">supercharge</span> your team?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Join thousands of teams already using TaskFlow to ship better products faster.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="group inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-xl shadow-blue-500/25"
                >
                  Get started for free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8">
                {[
                  'No credit card required',
                  'Free forever plan',
                  'Set up in 2 minutes',
                ].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold">TaskFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 TaskFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
