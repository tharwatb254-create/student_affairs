import 'package:flutter/material.dart';
import 'screens/welcome_screen.dart';
import 'services/language_service.dart';

void main() {
  runApp(const BISApp());
}

class BISApp extends StatelessWidget {
  const BISApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.languageNotifier,
      builder: (context, lang, _) {
        return MaterialApp(
          title: 'BIS Student Affairs',
          debugShowCheckedModeBanner: false,
          builder: (context, child) {
            return Directionality(
              textDirection: lang == 'ar' ? TextDirection.rtl : TextDirection.ltr,
              child: child!,
            );
          },
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF004AAD), // Professional Blue
              primary: const Color(0xFF004AAD),
              secondary: const Color(0xFF00B14F), // Professional Green
              background: Colors.white,
              surface: Colors.white,
            ),
            scaffoldBackgroundColor: const Color(0xFFF8F9FA),
            useMaterial3: true,
            fontFamily: lang == 'ar' ? 'Tahoma' : 'Roboto', // Arabic / English friendly fonts
          ),
          home: const WelcomeScreen(),
        );
      },
    );
  }
}
