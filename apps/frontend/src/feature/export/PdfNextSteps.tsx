import { municipality } from '@/config/municipality';
import { pdfTheme } from '@/config/pdfTheme';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import { pdf } from './pdfStyles';

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  step: {
    gap: 4,
  },
  stepDescription: {
    lineHeight: 1,
  },
  link: {
    fontSize: 10,
    color: pdfTheme.colors.primary,
  },
});

export function PdfNextSteps() {
  const STEPS = [
    {
      title: i18next.t('energyCalculation:nextSteps.step1.title'),
      description: i18next.t('energyCalculation:nextSteps.step1.description'),
      link: municipality.energyAdvice.url,
      contact: municipality.energyAdvice.contact,
    },
    {
      title: i18next.t('energyCalculation:nextSteps.step2.title'),
      description: i18next.t('energyCalculation:nextSteps.step2.description'),
    },
    {
      title: i18next.t('energyCalculation:nextSteps.step3.title'),
      description: i18next.t('energyCalculation:nextSteps.step3.description'),
    },
    {
      title: i18next.t('energyCalculation:nextSteps.step4.title'),
      description: i18next.t('energyCalculation:nextSteps.step4.description'),
    },
  ];

  return (
    <View style={styles.content}>
      <Text style={pdf.sectionHeader}>
        {i18next.t('energyCalculation:nextSteps.sectionTitle')}
      </Text>
      {STEPS.map((step, index) => (
        <View key={index} wrap={false} style={styles.step}>
          <Text style={pdf.h3}>
            {index + 1}. {step.title}
          </Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
          {step.link && (
            <Link src={step.link} style={styles.link}>
              {step.link}
            </Link>
          )}
          {step.contact && (
            <Text style={styles.stepDescription}>{step.contact}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
