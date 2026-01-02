import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-gradient-primary text-white',
  secondary: 'bg-gradient-secondary text-white',
  success: 'bg-gradient-success text-white',
  warning: 'bg-warning/10',
};

const iconStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-white/20 text-white',
  secondary: 'bg-white/20 text-white',
  success: 'bg-white/20 text-white',
  warning: 'bg-warning/20 text-warning',
};

export function StatCard({ title, value, trend, icon: Icon, variant = 'default' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-6 rounded-2xl shadow-soft card-hover",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
          )}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold">
            {value}
          </p>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend >= 0 ? 'text-success' : 'text-destructive',
              variant !== 'default' && (trend >= 0 ? 'text-green-200' : 'text-red-200')
            )}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
              <span className={cn(
                "text-xs",
                variant === 'default' ? 'text-muted-foreground' : 'text-white/60'
              )}>vs mês passado</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}
