import { StyleSheet } from '@react-pdf/renderer';

const colors = {
  primary: '#0d9488',       // teal-600
  primaryLight: '#ccfbf1',  // teal-100
  text: '#1e293b',          // slate-800
  muted: '#64748b',         // slate-500
  border: '#e2e8f0',        // slate-200
  warning: '#b91c1c',       // red-700
  warningBg: '#fef2f2',     // red-50
  warningBorder: '#fecaca', // red-200
  white: '#ffffff',
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: colors.text,
    fontFamily: 'DM Sans',
  },
  pageKorean: {
    padding: 40,
    fontSize: 10,
    color: colors.text,
    fontFamily: 'Noto Sans KR',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 6,
    marginTop: 16,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 12,
  },
  warningBox: {
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 4,
    padding: 10,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.warning,
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 10,
    color: colors.warning,
    marginBottom: 2,
  },
  medItem: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 8,
    marginBottom: 8,
  },
  medName: {
    fontSize: 10,
    fontWeight: 700,
  },
  medInstructions: {
    fontSize: 9,
    color: colors.muted,
  },
  followUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  followUpDate: {
    fontSize: 9,
    color: colors.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
    textAlign: 'center',
  },
  flagBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  flagTerm: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  flagDetail: {
    fontSize: 9,
    color: colors.muted,
  },
});
