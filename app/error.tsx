'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fdfbf7] p-8 text-center">
      <h2 className="text-2xl font-light mb-4">Something went wrong</h2>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-[#5a5a40] text-white rounded-full uppercase tracking-widest text-sm"
      >
        Try again
      </button>
    </div>
  );
}
