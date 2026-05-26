'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, background: '#0a0a0a', color: '#e4e4e7' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
                    <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>An unexpected error occurred. Please try again.</p>
                    <button
                        onClick={() => reset()}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
