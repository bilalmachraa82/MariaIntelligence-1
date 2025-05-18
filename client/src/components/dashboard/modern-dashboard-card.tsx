import React from "react";
import { cn } from "@/lib/utils";

interface ModernDashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export function ModernDashboardCard({
  title,
  subtitle,
  children,
  className,
  highlight = false,
  icon,
  headerAction
}: ModernDashboardCardProps) {
  return (
    <div className={cn(
      highlight ? "modern-card-highlight" : "modern-card",
      "overflow-hidden",
      className
    )}>
      <div className="px-5 py-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-white/70">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold uppercase text-white/80 tracking-wider">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-white/50">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {headerAction && (
          <div>
            {headerAction}
          </div>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
  highlightColor?: 'blue' | 'pink' | 'purple' | 'teal' | 'orange' | 'green';
}

export function ModernStatCard({
  title,
  value,
  icon,
  trend,
  className,
  iconClassName,
  valueClassName,
  highlightColor = 'teal'
}: StatCardProps) {
  const colorMap = {
    blue: 'var(--highlight-blue)',
    pink: 'var(--highlight-pink)',
    purple: 'var(--highlight-purple)',
    teal: 'var(--highlight-teal)',
    orange: 'var(--highlight-orange)',
    green: '#67e880'
  };
  
  const color = colorMap[highlightColor];
  
  return (
    <div className={cn(
      "modern-card p-5 flex flex-col",
      className
    )}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xs font-medium uppercase text-white/60 tracking-wide">
          {title}
        </h3>
        {icon && (
          <div 
            className={cn(
              "text-white/70",
              iconClassName
            )}
            style={{ color }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div 
          className={cn(
            "text-2xl md:text-3xl font-bold",
            valueClassName
          )}
          style={{ color }}
        >
          {value}
        </div>
        
        {trend !== undefined && (
          <div className="flex items-center mt-2 text-xs">
            <span 
              className={
                trend > 0 
                ? "text-green-400 flex items-center" 
                : trend < 0 
                  ? "text-red-400 flex items-center" 
                  : "text-white/50 flex items-center"
              }
            >
              {trend > 0 && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {trend < 0 && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {trend === 0 && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
              {Math.abs(trend)}% em relação ao mês anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ModernMetricRow({
  title,
  value,
  icon,
  className
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10",
      className
    )}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-white/70">
            {icon}
          </div>
        )}
        <span className="text-sm text-white/80">{title}</span>
      </div>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}