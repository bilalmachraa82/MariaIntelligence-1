import React, { memo } from 'react';
import { Property } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Bed, Bath, Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onView?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  className?: string;
}

export const PropertyCard = memo<PropertyCardProps>(({
  property,
  onView,
  onEdit,
  className,
}) => {
  const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];

  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt || property.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Sem imagem</span>
          </div>
        )}

        {/* Status Badge */}
        <Badge
          variant={property.status === 'active' ? 'default' : 'secondary'}
          className="absolute top-2 left-2"
        >
          {property.status}
        </Badge>
      </div>

      <CardContent className="p-4">
        {/* Property Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">
            {property.location.city}, {property.location.state}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{property.maxGuests}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <span className="text-lg font-bold text-primary">
            €{property.pricePerNight}
          </span>
          <span className="text-sm text-muted-foreground">/noite</span>
        </div>

        {/* Description Preview */}
        {property.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {property.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView?.(property)}
          className="flex-1 mr-2"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver detalhes
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onEdit?.(property)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
});

PropertyCard.displayName = 'PropertyCard';