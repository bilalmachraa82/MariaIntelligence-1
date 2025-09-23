import React, { lazy } from 'react';
import { Route } from 'wouter';
import { LazyWrapper } from '@/shared/components/LazyWrapper';

// Lazy load feature pages
const PropertiesFeature = lazy(() => import('@/features/properties/pages/PropertiesPage'));
const PropertyDetailFeature = lazy(() => import('@/features/properties/pages/PropertyDetailPage'));
const ReservationsFeature = lazy(() => import('@/features/reservations/pages/ReservationsPage'));
const ReservationDetailFeature = lazy(() => import('@/features/reservations/pages/ReservationDetailPage'));
const DashboardFeature = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const AssistantFeature = lazy(() => import('@/features/ai-assistant/pages/AssistantPage'));

export const FeatureRoutes: React.FC = () => {
  return (
    <>
      {/* Dashboard Feature */}
      <Route path="/dashboard-feature">
        <LazyWrapper>
          <DashboardFeature />
        </LazyWrapper>
      </Route>

      {/* Properties Feature */}
      <Route path="/properties-feature">
        <LazyWrapper>
          <PropertiesFeature />
        </LazyWrapper>
      </Route>

      <Route path="/properties-feature/:id">
        {(params) => (
          <LazyWrapper>
            <PropertyDetailFeature propertyId={params.id} />
          </LazyWrapper>
        )}
      </Route>

      {/* Reservations Feature */}
      <Route path="/reservations-feature">
        <LazyWrapper>
          <ReservationsFeature />
        </LazyWrapper>
      </Route>

      <Route path="/reservations-feature/:id">
        {(params) => (
          <LazyWrapper>
            <ReservationDetailFeature reservationId={params.id} />
          </LazyWrapper>
        )}
      </Route>

      {/* AI Assistant Feature */}
      <Route path="/assistant-feature">
        <LazyWrapper>
          <AssistantFeature />
        </LazyWrapper>
      </Route>
    </>
  );
};