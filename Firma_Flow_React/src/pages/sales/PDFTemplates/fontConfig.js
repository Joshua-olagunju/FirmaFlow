import { Font } from "@react-pdf/renderer";

// Register fonts for PDF templates
// Using Google Fonts CDN for web fonts

// Register Open Sans (similar to Arial/Helvetica - sans-serif)
Font.register({
  family: "Open Sans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf",
      fontWeight: "semibold",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-italic.ttf",
      fontStyle: "italic",
    },
  ],
});

// Register Roboto (clean sans-serif alternative)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
      fontStyle: "italic",
    },
  ],
});

// Register Lora (serif font similar to Georgia/Times New Roman)
Font.register({
  family: "Lora",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqs.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkqs.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/lora/v32/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoq92nA.ttf",
      fontStyle: "italic",
    },
  ],
});

// Register Playfair Display (elegant serif font)
Font.register({
  family: "Playfair Display",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvULUbtXK-F2qC0s.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/playfairdisplay/v36/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2qA0s.ttf",
      fontStyle: "italic",
    },
  ],
});

// Font family mappings for templates
// These map the HTML font families to PDF font families
export const fontFamilyMap = {
  // Sans-serif fonts (Arial, Helvetica)
  "Arial, sans-serif": "Open Sans",
  "Helvetica, sans-serif": "Open Sans",
  "sans-serif": "Open Sans",
  Arial: "Open Sans",
  Helvetica: "Open Sans",

  // Serif fonts (Georgia, Times New Roman)
  "Georgia, serif": "Lora",
  "'Times New Roman', serif": "Playfair Display",
  "Times New Roman": "Playfair Display",
  Georgia: "Lora",
  serif: "Lora",
};

// Get PDF font family from HTML font family
export const getPDFFont = (htmlFont) => {
  return fontFamilyMap[htmlFont] || "Open Sans";
};

// Default font families for each template type
export const templateFonts = {
  modern: {
    primary: "Open Sans",
    bold: "Open Sans",
  },
  classic: {
    primary: "Lora",
    bold: "Lora",
  },
  minimal: {
    primary: "Open Sans",
    bold: "Open Sans",
  },
  professional: {
    primary: "Open Sans",
    bold: "Open Sans",
  },
  elegant: {
    primary: "Playfair Display",
    bold: "Playfair Display",
  },
};

export default fontFamilyMap;
