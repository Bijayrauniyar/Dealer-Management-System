import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  /** Bills need contain so the full invoice fits inside the frame */
  imageFit?: "cover" | "contain";
};

/** Phone frame for product screenshots on the marketing site. */
export function MobileScreenshotFrame({
  src,
  alt,
  caption,
  className = "",
  imageFit = "cover",
}: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallback = src.endsWith(".png") ? src.replace(/\.png$/, ".svg") : undefined;

  return (
    <figure className={`mx-auto w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px] ${className}`}>
      <div className="rounded-[2.75rem] border-[11px] border-slate-800 bg-slate-800 p-1 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5">
        <div className="overflow-hidden rounded-[2.1rem] bg-white">
          <div className="flex h-7 items-center justify-center bg-slate-100" aria-hidden>
            <div className="h-1 w-20 rounded-full bg-slate-300" />
          </div>
          <div
            className={`flex aspect-[390/780] w-full items-start justify-center ${
              imageFit === "contain" ? "bg-slate-100" : "bg-gradient-to-b from-slate-50 to-white"
            }`}
          >
            <img
              src={imgSrc}
              alt={alt}
              width={390}
              height={780}
              className={`block h-full w-full ${
                imageFit === "contain" ? "object-contain object-top" : "object-cover object-top"
              }`}
              loading="lazy"
              decoding="async"
              onError={() => {
                if (fallback && imgSrc !== fallback) setImgSrc(fallback);
              }}
            />
          </div>
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-4 text-center text-sm font-medium text-slate-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
