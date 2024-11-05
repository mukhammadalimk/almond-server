export enum SuspensionReason {
  InappropriateContent = "inappropriateContent",
  TermsViolation = "termsViolation",
  FraudulentActivity = "fraudulentActivity",
}

export const SUSPENSION_REASONS = {
  [SuspensionReason.InappropriateContent]: {
    en: "Inappropriate content",
    uz: "Noqonuniy kantent",
    ru: "Неприемлемый контент",
  },
  [SuspensionReason.TermsViolation]: {
    en: "Violation of terms of service",
    uz: "Xizmat ko'rsatish shartlarini buzish",
    ru: "Нарушение условий обслуживания",
  },
  [SuspensionReason.FraudulentActivity]: {
    en: "Fraudulent activity",
    uz: "Firibgarlik faoliyati",
    ru: "Мошенническая деятельность",
  },
};
