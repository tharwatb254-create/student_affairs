import 'package:flutter/material.dart';

class LanguageService {
  // Global reactive language notifier ('ar' = Arabic, 'en' = English)
  static final ValueNotifier<String> languageNotifier = ValueNotifier<String>('ar');

  static bool get isArabic => languageNotifier.value == 'ar';

  static void toggleLanguage() {
    languageNotifier.value = languageNotifier.value == 'ar' ? 'en' : 'ar';
  }

  // Reactive translation helper
  static String get(String ar, String en) {
    return isArabic ? ar : en;
  }
}
