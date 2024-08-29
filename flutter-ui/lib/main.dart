import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:url_strategy/url_strategy.dart';

import 'conversation_screen.dart';
import 'player_screen.dart';

void main() async {
  const String environment =
      String.fromEnvironment('ENV', defaultValue: 'prod');
  print("Detected Environment: $environment");
  await dotenv.load(fileName: 'assets/config.$environment');

  WidgetsFlutterBinding.ensureInitialized();
  setPathUrlStrategy();
  runApp(const LanguageGameApp());
}

final GoRouter _router = GoRouter(
  routes: <RouteBase>[
    ShellRoute(
      builder: (_, GoRouterState state, child) {
        return Stack(
          children: [
            Row(children: [
              const NavRail(),
              const VerticalDivider(thickness: 1, width: 1),
              Expanded(child: child),
            ]),
          ],
        );
      },
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          builder: (BuildContext context, GoRouterState state) {
            return const ConversationScreen();
          },
        ),
        GoRoute(
          path: '/create/ai',
          builder: (BuildContext context, GoRouterState state) {
            return const PlayerScreen();
          },
        ),
      ],
    ),
  ],
);

class LanguageGameApp extends StatelessWidget {
  const LanguageGameApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
        routerConfig: _router,
        theme: ThemeData(brightness: Brightness.dark, useMaterial3: true));
  }
}

class NavRail extends StatefulWidget {
  const NavRail({super.key});

  @override
  State<NavRail> createState() => _NavRailState();
}

class _NavRailState extends State<NavRail> {
  final List<String> _routes = ['/', '/create/ai'];
  int _selectedIndex = 0;
  NavigationRailLabelType labelType = NavigationRailLabelType.all;
  bool showLeading = false;
  bool showTrailing = false;
  double groupAlignment = -1.0;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        NavigationRail(
          selectedIndex: _selectedIndex,
          groupAlignment: groupAlignment,
          onDestinationSelected: (int index) {
            setState(() {
              _selectedIndex = index;
            });
            context.go(_routes[index]);
          },
          labelType: labelType,
          leading: showLeading
              ? FloatingActionButton(
                  elevation: 0,
                  onPressed: () {},
                  child: const Icon(Icons.add),
                )
              : const SizedBox(),
          trailing: showTrailing
              ? IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.more_horiz_rounded),
                )
              : const SizedBox(),
          destinations: const <NavigationRailDestination>[
            NavigationRailDestination(
              icon: Icon(Icons.keyboard),
              selectedIcon: Icon(Icons.keyboard_alt_outlined),
              label: Text('Chat'),
            ),
            NavigationRailDestination(
              icon: Icon(Icons.person_2),
              selectedIcon: Icon(Icons.person_2_outlined),
              label: Text('Create AI Player'),
            ),
          ],
        ),
        const VerticalDivider(thickness: 1, width: 1),
      ],
    );
  }
}
