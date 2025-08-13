import MarkdownIt from "markdown-it";
import Image from "@11ty/eleventy-img";
import htmlmin from "html-minifier-terser";
import fs from "node:fs";
import path from "node:path";

export default function(eleventyConfig) {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true
  });

  eleventyConfig.addFilter("markdown", (value) => {
    return md.render(value || "");
  });

  eleventyConfig.addFilter("datoNorsk", (value) => {
    if (!value) return "";

    const d = new Date(value);
    const idag = new Date();

    d.setHours(0, 0, 0, 0);
    idag.setHours(0, 0, 0, 0);

    const diffMs = idag - d;
    const diffDager = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDager === 0) {
      return "i dag";
    } else if (diffDager === 1) {
      return "i går";
    } else if (diffDager > 1 && diffDager < 14) {
      return `for ${diffDager} dager sidan`;
    } else {
      const dag = String(d.getDate()).padStart(2, "0");
      const mnd = String(d.getMonth() + 1).padStart(2, "0");
      const år = d.getFullYear();
      return `${dag}.${mnd}.${år}`;
    }
  });

  // Register responsive image shortcode
  eleventyConfig.addNunjucksAsyncShortcode("image", async function(src, alt = "", sizes = "100vw", className = "") {
    if (!src) {
      return "";
    }

    const options = {
      widths: [320, 640, 960, 1280, 1920],
      formats: ["avif", "webp", "jpeg", "png"],
      outputDir: "./dist/img/",
      urlPath: "/img/"
    };

    let imageSrc = src;
    try {
      // Map "/static/..." web paths to filesystem source files
      if (typeof src === "string" && src.startsWith("/static/")) {
        const fileRelative = src.replace("/static/", "");
        imageSrc = path.join(process.cwd(), "src", "static", fileRelative);
      }

      const metadata = await Image(imageSrc, options);
      const attrs = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
        class: className
      };
      return Image.generateHTML(metadata, attrs);
    } catch (e) {
      // Fallback to plain img if processing fails
      const safeAlt = alt ? String(alt).replace(/"/g, "&quot;") : "";
      return `<img src="${src}" alt="${safeAlt}" loading="lazy" decoding="async" ${className ? `class="${className}"` : ""}>`;
    }
  });

  eleventyConfig.addPassthroughCopy("src/static");

  // Minify HTML output in production
  eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
    const isHtml = outputPath && outputPath.endsWith(".html");
    const isProd = process.env.ELEVENTY_ENV === "production" || process.env.NODE_ENV === "production";
    if (isHtml && isProd) {
      return await htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
        sortAttributes: true,
        sortClassName: true
      });
    }
    return content;
  });

  // After build, minify CSS that was passed through
  eleventyConfig.on("afterBuild", async () => {
    try {
      const cssPath = path.join(process.cwd(), "dist", "static", "styles.css");
      if (fs.existsSync(cssPath)) {
        const { transform } = await import("lightningcss");
        const input = fs.readFileSync(cssPath);
        const { code } = transform({
          filename: "styles.css",
          code: input,
          minify: true
        });
        fs.writeFileSync(cssPath, Buffer.from(code));
      }
    } catch (e) {
      console.warn("CSS minify failed:", e?.message || e);
    }
  });

  return {
    dir: {
      input: "src",
      output: "dist"
    }
  };
}
