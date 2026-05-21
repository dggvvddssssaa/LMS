import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDev = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') || 
                    (typeof import.meta !== 'undefined' && import.meta.env?.DEV);

      if (this.props.compact || this.props.variant === 'compact') {
        return (
          <div style={{
            padding: '24px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            textAlign: 'center',
            color: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            margin: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px', color: '#f8fafc' }}>Đã xảy ra lỗi</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.5' }}>
              {this.state.error?.message || "Không thể tải hoặc hiển thị nội dung này."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
              }}
            >
              🔄 Thử lại
            </button>
          </div>
        );
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '24px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '48px 40px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            <h1 style={{
              color: '#f8fafc',
              fontSize: '24px',
              fontWeight: '800',
              margin: '0 0 12px'
            }}>
              Đã xảy ra lỗi
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '15px',
              lineHeight: '1.6',
              margin: '0 0 24px'
            }}>
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang hoặc quay về trang chủ.
            </p>

            {isDev && this.state.error && (
              <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <p style={{ color: '#f87171', fontSize: '13px', fontFamily: 'monospace', margin: '0 0 8px', fontWeight: '600' }}>
                  {this.state.error.toString()}
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>
                  Route: {window.location.pathname}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace', margin: '8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                }}
                onMouseOver={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'; }}
                onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'; }}
              >
                🔄 Tải lại trang
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  padding: '12px 28px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.target.style.background = '#334155'; e.target.style.color = '#e2e8f0'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}
              >
                🏠 Về trang chủ
              </button>
            </div>

            <p style={{
              color: '#475569',
              fontSize: '12px',
              margin: '24px 0 0'
            }}>
              Route hiện tại: <code style={{ color: '#64748b' }}>{window.location.pathname}</code>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
