import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px',
          background: '#f9fafb'
        }}>
          <div style={{
            background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
            padding: '32px', maxWidth: '600px', width: '100%'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>⚠️ App Error</h2>
            <pre style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '16px', fontSize: '13px', overflowX: 'auto', color: '#991b1b',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
