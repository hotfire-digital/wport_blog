import { getCoverImageUrls, type CoverImageContext } from "@/lib/cover-image";

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  context?: CoverImageContext;
  loading?: "lazy" | "eager";
}

export default function CoverImage({ src, alt, className, style, context = "card", loading = "lazy" }: Props) {
  const cover = getCoverImageUrls(src, context);

  return (
    <img
      src={cover.default}
      srcSet={cover.srcset}
      sizes={cover.sizes}
      alt={alt}
      className={className}
      style={style}
      width={1600}
      height={900}
      loading={loading}
      decoding="async"
    />
  );
}
