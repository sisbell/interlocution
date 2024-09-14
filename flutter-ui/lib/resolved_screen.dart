import 'package:flutter/material.dart';

import 'models.dart';

class ResolvedScreen extends StatelessWidget {
  final TotalInformationState? totalInformationState;

  const ResolvedScreen({super.key, required this.totalInformationState});

  @override
  Widget build(BuildContext context) {
    final resolvedDiscourses =
        totalInformationState?.dialogGameBoard.resolvedDiscourses ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Resolved Questions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: resolvedDiscourses.length,
            itemBuilder: (context, index) {
              final resolved = resolvedDiscourses[index];
              return ListTile(
                title: Text(resolved ?? ''),
              );
            },
          ),
        ),
      ],
    );
  }
}
