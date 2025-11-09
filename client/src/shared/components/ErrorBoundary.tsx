import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to error tracking service (Sentry, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Algo correu mal</h2>
            </div>

            <p className="text-gray-600">
              Desculpe, encontrámos um erro inesperado. Por favor, tente novamente.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-sm bg-gray-100 p-3 rounded">
                <summary className="cursor-pointer font-semibold">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 overflow-auto text-xs max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="flex-1"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error fallback for features
export function FeatureErrorFallback({
  feature,
  onReset
}: {
  feature: string;
  onReset?: () => void;
}) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2 text-red-700 mb-2">
        <AlertCircle className="w-5 h-5" />
        <h3 className="font-semibold">Erro ao carregar {feature}</h3>
      </div>
      <p className="text-red-600 text-sm mb-3">
        Não foi possível carregar este conteúdo. Por favor, tente novamente.
      </p>
      <Button size="sm" onClick={onReset || (() => window.location.reload())}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Recarregar
      </Button>
    </div>
  );
}

// Compact error fallback for widgets/cards
export function WidgetErrorFallback({
  widget,
  onReset
}: {
  widget: string;
  onReset?: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
      <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
      <p className="text-sm text-red-700 font-medium mb-1">
        Erro ao carregar {widget}
      </p>
      <p className="text-xs text-red-600 mb-2">
        Não foi possível carregar este widget
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={onReset || (() => window.location.reload())}
        className="text-xs"
      >
        Tentar novamente
      </Button>
    </div>
  );
}

// Inline error fallback for small components
export function InlineErrorFallback({
  message = "Erro ao carregar conteúdo",
  onReset
}: {
  message?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
      <span className="text-red-700 flex-1">{message}</span>
      {onReset && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          className="h-6 px-2 text-xs"
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
