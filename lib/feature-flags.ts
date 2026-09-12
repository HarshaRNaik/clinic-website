export type FeatureFlags = {
  nlpExtractionEnabled: boolean;
  chatbotEnabled: boolean;
  chatbotAppointmentToolsEnabled: boolean;
  demoMode: boolean;
};

export const featureFlags: FeatureFlags = {
  nlpExtractionEnabled: process.env.NLP_EXTRACTION_ENABLED === "true",
  chatbotEnabled: process.env.CHATBOT_ENABLED === "true",
  chatbotAppointmentToolsEnabled: process.env.CHATBOT_APPOINTMENT_TOOLS_ENABLED === "true",
  demoMode: process.env.DEMO_MODE === "true"
};

export function assertDemoModeAllowed(): void {
  if (!featureFlags.demoMode) {
    throw new Error("DEMO_MODE must be enabled before the demo route can be used.");
  }
}
