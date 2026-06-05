import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
};

/** Browser-style frame for wide app screenshots on the marketing site. */
export function DesktopScreenshotFrame({ src, alt, caption, className = "" }: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallback = src.endsWith(".png") ? src.replace(/\.png$/, ".svg") : undefined;

  return (
    <figure className={`mx-auto w-full max-w-5xl ${className}`}>
      <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-slate-100 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 sm:rounded-xl sm:shadow-2xl">
        <div className="flex h-8 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2 sm:h-9 sm:gap-2 sm:px-3" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-1 flex-1 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-500 sm:ml-2 sm:px-3 sm:py-1 sm:text-[11px]">
            bikrikhata.com/app/dashboard
          </span>
        </div>
        <div className="bg-slate-50">
          <img
            src={imgSrc}
            alt={alt}
            width={1280}
            height={800}
            className="block w-full object-cover object-top"
            loading="lazy"
            decoding="async"
            onError={() => {
              if (fallback && imgSrc !== fallback) setImgSrc(fallback);
            }}
          />
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-4 text-center text-sm font-medium text-slate-600">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
