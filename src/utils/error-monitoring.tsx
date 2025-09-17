import React from 'react';
import { supabase } from '../lib/supabase';

export interface ErrorLog {
  id?: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface AuditLog {
  id?: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  timestamp: Date;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class ErrorMonitoringService {
  private errorQueue: ErrorLog[] = [];
  private auditQueue: AuditLog[] = [];
  private isProcessing = false;
  private readonly maxQueueSize = 50;
  private readonly batchSize = 10;

  // Error logging
  logError(error: Error, context?: Record<string, any>, severity: ErrorLog['severity'] = 'medium') {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      severity,
      context,
    };

    this.errorQueue.push(errorLog);
    this.processQueue();
  }

  // Audit logging
  logAudit(action: string, resource: string, resourceId?: string, details?: Record<string, any>) {
    const auditLog: AuditLog = {
      action,
      resource,
      resourceId,
      timestamp: new Date(),
      details,
      userAgent: navigator.userAgent,
    };

    this.auditQueue.push(auditLog);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || (this.errorQueue.length === 0 && this.auditQueue.length === 0)) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process errors - temporarily disabled Supabase logging
      if (this.errorQueue.length > 0) {
        const errorsToProcess = this.errorQueue.splice(0, this.batchSize);
        console.log('Error logs (Supabase disabled):', errorsToProcess);
        // await this.sendErrorsToServer(errorsToProcess);
      }

      // Process audit logs - temporarily disabled Supabase logging
      if (this.auditQueue.length > 0) {
        const auditsToProcess = this.auditQueue.splice(0, this.batchSize);
        console.log('Audit logs (Supabase disabled):', auditsToProcess);
        // await this.sendAuditsToServer(auditsToProcess);
      }
    } catch (error) {
      console.error('Error processing monitoring queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendErrorsToServer(errors: ErrorLog[]) {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert(errors.map(error => ({
          message: error.message,
          stack: error.stack,
          url: error.url,
          user_agent: error.userAgent,
          user_id: error.userId,
          timestamp: error.timestamp.toISOString(),
          severity: error.severity,
          context: error.context,
        })));

      if (error) {
        console.error('Failed to send error logs to server:', error);
      }
    } catch (error) {
      console.error('Error sending error logs:', error);
    }
  }

  private async sendAuditsToServer(audits: AuditLog[]) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(audits.map(audit => ({
          action: audit.action,
          resource: audit.resource,
          resource_id: audit.resourceId,
          user_id: audit.userId,
          timestamp: audit.timestamp.toISOString(),
          details: audit.details,
          ip_address: audit.ipAddress,
          user_agent: audit.userAgent,
        })));

      if (error) {
        console.error('Failed to send audit logs to server:', error);
      }
    } catch (error) {
      console.error('Error sending audit logs:', error);
    }
  }

  // Clear queues if they get too large
  private checkQueueSize() {
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
    if (this.auditQueue.length > this.maxQueueSize) {
      this.auditQueue = this.auditQueue.slice(-this.maxQueueSize);
    }
  }
}

// Global instance - using function to avoid HMR issues
let errorMonitoringInstance: ErrorMonitoringService | null = null;

export const getErrorMonitoring = (): ErrorMonitoringService => {
  if (!errorMonitoringInstance) {
    errorMonitoringInstance = new ErrorMonitoringService();
  }
  return errorMonitoringInstance;
};

// For backward compatibility
export const errorMonitoring = getErrorMonitoring();

// React Error Boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorMonitoring.logError(error, {
      componentStack: errorInfo.componentStack,
    }, 'high');
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">Algo deu errado</h3>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recarregar Página
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Ir para Início
        </button>
      </div>
    </div>
  </div>
);

// Hook for error monitoring
export const useErrorMonitoring = () => {
  const logError = React.useCallback((error: Error, context?: Record<string, any>, severity?: ErrorLog['severity']) => {
    errorMonitoring.logError(error, context, severity);
  }, []);

  const logAudit = React.useCallback((action: string, resource: string, resourceId?: string, details?: Record<string, any>) => {
    errorMonitoring.logAudit(action, resource, resourceId, details);
  }, []);

  return { logError, logAudit };
};

// Global error handler
window.addEventListener('error', (event) => {
  errorMonitoring.logError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  }, 'medium');
});

window.addEventListener('unhandledrejection', (event) => {
  errorMonitoring.logError(new Error(event.reason), {
    type: 'unhandledrejection',
  }, 'high');
});
