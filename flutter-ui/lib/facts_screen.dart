import 'package:flutter/material.dart';

import 'models.dart';

class FactsScreen extends StatelessWidget {
  final TotalInformationState? totalInformationState;

  const FactsScreen({super.key, required this.totalInformationState});

  @override
  Widget build(BuildContext context) {
    final facts = totalInformationState?.dialogGameboard.facts ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Facts Collected',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
            child: ListView.builder(
          itemCount: facts.length,
          itemBuilder: (context, index) {
            final fact = facts[index];
            return ListTile(
              title: Text(fact.proposition ?? ''),
            );
          },
        )),
      ],
    );
  }
}
