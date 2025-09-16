"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { detectPlatform, isValidUrl } from "@/lib/scraping";

export default function LandingClient() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestRecipe, setGuestRecipe] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  function getErrorMessage(value: unknown): string {
    if (value instanceof Error) return value.message;
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch { return Object.prototype.toString.call(value); }
  }

  async function parseJsonSafe(res: Response) {
    const text = await res.text();
    if (!text) return {} as any;
    try { return JSON.parse(text); } catch { return { error: text } as any; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setGuestRecipe(null);

    if (!isValidUrl(url)) {
      setMessage("Please paste a valid video URL.");
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      setMessage("URL must be from YouTube, Instagram, or TikTok");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, platform, userId }),
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        const msg = (data?.error as string) || "Request failed";
        setMessage(msg);
        return;
      }

      if (data?.mode === 'guest' && data?.recipe) {
        setGuestRecipe(data.recipe);
        setIsModalOpen(true);
        setMessage(null);
        return;
      }

      if (data?.jobId || data?.recipeId) {
        setMessage((data?.message || 'Job created.') + ' View it on your dashboard.');
        return;
      }

      setMessage(data?.message || "Great! We'll generate your recipe next.");
    } catch (err) {
      setMessage(`Something went wrong: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pt-24 sm:pt-28 pb-24 text-center">
        <div className="mx-auto mb-10 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100/70">
          <LogoMark className="h-4 w-4 text-rose-400" />
        </div>

        <h1 className="font-extrabold tracking-tight leading-tight text-4xl sm:text-6xl md:text-7xl">
          <span className="block text-green-800">Paste Your Video Link</span>
          <span className="block text-green-800 mt-2">YouTube, Instagram, TikTok.</span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-12 mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="Add recipe link here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-lg shadow-sm outline-none ring-emerald-600/20 focus:border-emerald-600 focus:ring-4 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-black text-white px-6 md:px-8 text-base font-semibold shadow-md hover:opacity-95 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Working…" : "Generate Recipe"}
            </button>
          </div>

          {message && (
            <p className="mt-4 text-sm text-gray-600">{message}</p>
          )}
        </form>
      </section>

      {isModalOpen && guestRecipe && (
        <RecipeModal
          recipe={guestRecipe}
          url={url}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4l8 14H4L12 4z" />
    </svg>
  );
}

function RecipeModal({ recipe, url, onClose }: { recipe: any; url: string; onClose: () => void }) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-green-800 truncate pr-6">{recipe.title || 'Recipe preview'}</h2>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-gray-50" aria-label="Close">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 8.586l4.95-4.95 1.414 1.414L11.414 10l4.95 4.95-1.414 1.414L10 11.414l-4.95 4.95-1.414-1.414L8.586 10 3.636 5.05 5.05 3.636 10 8.586z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {recipe.image && (
              <img src={recipe.image} alt={recipe.title || 'Recipe thumbnail'} className="w-28 h-28 object-cover rounded-xl border" />
            )}
            <div className="min-w-0 flex-1">
              {recipe.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{recipe.description}</p>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-1">Ingredients</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5 max-h-40 overflow-auto">
                    {(recipe.ingredients || []).slice(0, 16).map((it: any, idx: number) => (
                      <li key={idx} className="truncate">{typeof it === 'string' ? it : it?.text || JSON.stringify(it)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-1">Instructions</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-0.5 max-h-40 overflow-auto">
                    {(recipe.instructions || []).slice(0, 12).map((it: any, idx: number) => (
                      <li key={idx} className="truncate">{typeof it === 'string' ? it : it?.text || JSON.stringify(it)}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              try {
                if (typeof window !== 'undefined') {
                  if (recipe?.url) localStorage.setItem('pendingSaveUrl', recipe.url)
                  else if (url) localStorage.setItem('pendingSaveUrl', url)
                }
              } catch {}
              window.location.href = '/signup'
            }}
            className="inline-flex items-center rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 transition-colors"
          >
            Save to account
          </button>
          <a href="/login" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
            Log in
          </a>
          {recipe.url && (
            <a href={recipe.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
              View source
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


