/**
 * MediVault AI - Language Toggle Component
 * Toggle button for switching between English and Bangla
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';
import { LANGUAGES, changeLanguage, getCurrentLanguage, LanguageCode } from '../../localization';

interface LanguageToggleProps {
  size?: 'small' | 'medium';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ size = 'medium' }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getCurrentLanguage());
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    setCurrentLang(i18n.language as LanguageCode);
  }, [i18n.language]);

  const handleToggle = async (lang: LanguageCode) => {
    if (lang === currentLang) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    await changeLanguage(lang);
    setCurrentLang(lang);
  };

  const isSmall = size === 'small';

  return (
    <Animated.View 
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* English Option */}
      <TouchableOpacity
        style={[
          styles.option,
          isSmall && styles.optionSmall,
          currentLang === 'en' && styles.optionActive,
        ]}
        onPress={() => handleToggle('en')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.optionText,
            isSmall && styles.optionTextSmall,
            currentLang === 'en' && styles.optionTextActive,
          ]}
        >
          {LANGUAGES.en.nativeName}
        </Text>
      </TouchableOpacity>

      {/* Bangla Option */}
      <TouchableOpacity
        style={[
          styles.option,
          isSmall && styles.optionSmall,
          currentLang === 'bn' && styles.optionActive,
        ]}
        onPress={() => handleToggle('bn')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.optionText,
            styles.banglaText,
            isSmall && styles.optionTextSmall,
            currentLang === 'bn' && styles.optionTextActive,
          ]}
        >
          {LANGUAGES.bn.nativeName}
        </Text>
      </TouchableOpacity>

      {/* Online indicator */}
      <View style={styles.indicator} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['1'],
    gap: spacing['1'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  containerSmall: {
    padding: spacing['0.5'] || 2,
    borderRadius: borderRadius.xl,
  },
  option: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: borderRadius.xl,
    backgroundColor: 'transparent',
  },
  optionSmall: {
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1.5'] || 6,
  },
  optionActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  optionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.gray[400],
  },
  optionTextSmall: {
    fontSize: fontSize.xs,
  },
  optionTextActive: {
    color: colors.primary[600],
  },
  banglaText: {
    // Bangla text might need slightly different styling
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald[500],
    marginLeft: spacing['2'],
    marginRight: spacing['1'],
  },
});

export default LanguageToggle;
