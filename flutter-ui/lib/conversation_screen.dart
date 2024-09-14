import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:url_launcher/url_launcher.dart';

import 'chat_screen.dart';
import 'facts_screen.dart';
import 'models.dart';
import 'resolved_screen.dart';

class ConversationScreen extends StatefulWidget {
  const ConversationScreen({super.key});

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  TotalInformationState? totalInformationState;

  void _updateTotalInformationState(TotalInformationState newState) {
    setState(() {
      totalInformationState = newState;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            InkWell(
              onTap: () {
                launchUrl(
                    Uri.parse('https://github.com/sisbell/interlocution'));
              },
              child: Image.asset(
                "assets/github.png",
                width: 32,
                height: 32,
              ),
            ),
            const SizedBox(width: 20),
            const Text(
              'interlocution.ai',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text(
              ' - A Research Project Exploring Spoken Conversations with the use of LLMs',
              style: TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
      body: Row(
        children: [
          Expanded(
            child: ChatScreen(
              onUpdateTotalInformationState: _updateTotalInformationState,
            ),
          ),
          const VerticalDivider(
            width: 1,
            thickness: 1,
            color: Colors.grey,
          ),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: Markdown(
                      data: totalInformationState
                                  ?.privateInformationState.planInfo !=
                              null
                          ? totalInformationState!.privateInformationState.planInfo!.plan
                          : "N/A"),
                ),
                const Divider(
                  height: 1,
                  thickness: 1,
                  color: Colors.grey,
                ),
                Expanded(
                  child: FactsScreen(
                    totalInformationState: totalInformationState,
                  ),
                ),
                const Divider(
                  height: 1,
                  thickness: 1,
                  color: Colors.grey,
                ),
                Expanded(
                  child: ResolvedScreen(
                    totalInformationState: totalInformationState,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
