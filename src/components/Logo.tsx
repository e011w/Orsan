import { Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ className, showText = true, variant = 'dark' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex flex-col items-end">
        {showText && (
          <>
            <h1 className={cn('text-2xl font-bold tracking-wider leading-none', variant === 'light' ? 'text-white' : 'text-black')}>
              ORSAN
            </h1>
            <div className={cn('h-[2px] w-full mt-1 mb-1', variant === 'light' ? 'bg-white' : 'bg-gold')} />
            <p className={cn('text-[10px] font-medium whitespace-nowrap', variant === 'light' ? 'text-white/80' : 'text-black-soft')}>
              خدماتك في مكان واحد
            </p>
          </>
        )}
      </div>
      <div className="w-12 h-12 gold-gradient rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
        <Building2 className="w-8 h-8 text-black relative z-10" strokeWidth={1.5} />
        <div className="absolute inset-0 bg-white/10 opacity-50" />
      </div>
    </div>
  );
}
