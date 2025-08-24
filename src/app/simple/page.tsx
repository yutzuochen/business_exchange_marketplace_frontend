'use client';

export default function SimplePage() {
  const handleClick = () => {
    alert('JavaScript is working!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <button onClick={handleClick} style={{ padding: '10px', fontSize: '16px' }}>
        Click me to test JavaScript
      </button>
      <p>If this button works, JavaScript is executing properly.</p>
    </div>
  );
}