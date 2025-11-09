import React, { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Property } from '../types';
import { PropertyCard } from './PropertyCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PropertyListVirtualizedProps {
  properties: Property[];
  isLoading?: boolean;
  error?: Error | null;
  onPropertyView?: (property: Property) => void;
  onPropertyEdit?: (property: Property) => void;
}

export const PropertyListVirtualized = memo<PropertyListVirtualizedProps>(({
  properties,
  isLoading,
  error,
  onPropertyView,
  onPropertyEdit,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: properties.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 380, // Estimated card height in pixels (image 192px + content ~188px)
    overscan: 3, // Render 3 extra items above/below viewport
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-muted h-48 rounded-t-lg" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-8 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar propriedades: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">
          Nenhuma propriedade encontrada
        </div>
        <p className="text-sm text-muted-foreground">
          Tente ajustar os filtros ou adicionar uma nova propriedade.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[800px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const property = properties[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: '24px', // Gap between cards
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PropertyCard
                  property={property}
                  onView={onPropertyView}
                  onEdit={onPropertyEdit}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

PropertyListVirtualized.displayName = 'PropertyListVirtualized';
