import { create } from "zustand";

export type Certificate = {
  id: string;
  courseId: string;
  courseTitle: string;
  awardedAt: string;
};

type CertificatesState = {
  certificates: Certificate[];
  awardCertificate: (courseId: string, courseTitle: string) => void;
};

export const useCertificatesStore = create<CertificatesState>(set => ({
  certificates: [],
  awardCertificate: (courseId: string, courseTitle: string) =>
    set(state => {
      const exists = state.certificates.some(
        item => item.courseId === courseId
      );
      if (exists) {
        return state;
      }
      const awardedAt = new Date().toISOString();
      const certificate: Certificate = {
        id: `${courseId}-${Date.now()}`,
        courseId,
        courseTitle,
        awardedAt
      };
      return {
        certificates: [...state.certificates, certificate]
      };
    })
}));

