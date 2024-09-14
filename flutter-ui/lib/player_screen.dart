import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'client.dart';
import 'models.dart';

var playerId = generateId();
var playerName = "";
var modelName = "vertexai/gemini-1.5-flash";

var client = Client();
String defaultGoals = dotenv.env['DEFAULT_GOALS']!;
String defaultBeliefs = dotenv.env['DEFAULT_BELIEFS']!;
String defaultPlayerName = dotenv.env['DEFAULT_PLAYER_NAME']!;

String generateId() {
  final random = Random();
  final firstPart = List.generate(4, (_) => random.nextInt(10)).join('');
  final secondPart = List.generate(3, (_) => random.nextInt(10)).join('');
  return 'J-$firstPart-$secondPart';
}

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  final TextEditingController _goalsController =
      TextEditingController(text: defaultGoals);
  final TextEditingController _playerNameController =
      TextEditingController(text: defaultPlayerName);
  final TextEditingController _beliefsController =
      TextEditingController(text: defaultBeliefs);

  void _handleSubmit(BuildContext context) async {
    String goals = _goalsController.text;
    playerName = _playerNameController.text;
    String beliefs = _beliefsController.text;
    if (goals.isEmpty || playerName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields.')),
      );
      return;
    }

    var dgb = GameBoard(name: "Default");
    var privateInformationState = PrivateInformationState(
        genre: "Default", goals: goals, beliefs: beliefs);
    var totalInformationState = TotalInformationState(
        dialogGameBoard: dgb, privateInformationState: privateInformationState);
    var createRequest = CreatePlayerRequest(
        playerId: playerId,
        name: playerName,
        totalInformationState: totalInformationState);

    BuildContext? dialogContext;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        dialogContext = context;
        return const Center(
          child: CircularProgressIndicator(),
        );
      },
    );

    try {
      await client.createPlayer(createRequest);
      if (dialogContext != null) {
        Navigator.of(dialogContext!).pop();
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('AI Player Created')),
        );
      }
    } catch (e) {
      if (dialogContext != null) {
        Navigator.of(dialogContext!).pop();
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create AI Player')),
        );
      }
      print(e);
    }
  }

  @override
  void dispose() {
    _goalsController.dispose();
    _playerNameController.dispose();
    _beliefsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Create AI Player")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Align(
          alignment: Alignment.center,
          child: Container(
            height: MediaQuery.of(context).size.height * .7,
            width: MediaQuery.of(context).size.width / 2,
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Column(
              children: [
                const Text(
                  "Player Info",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Text(
                      "Player ID: ",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(playerId),
                  ],
                ),
                const SizedBox(height: 30),
                TextField(
                  controller: _playerNameController,
                  decoration: const InputDecoration(labelText: "Player Name"),
                ),
                // Divider
                const SizedBox(
                  height: 30,
                ),
                const Text(
                  "Private Information State",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                TextField(
                  controller: _goalsController,
                  decoration: const InputDecoration(labelText: "Goals"),
                  maxLines: 5,
                ),
                TextField(
                  controller: _beliefsController,
                  decoration: const InputDecoration(labelText: "Beliefs"),
                  maxLines: 5,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    _handleSubmit(context);
                  },
                  child: const Text("Submit"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
