import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arogya Chikitsalaya",
    short_name: "Arogya",
    description: "Patient and clinic appointment portal",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0F766E",
    lang: "en"
  };
}
