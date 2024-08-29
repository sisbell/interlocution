import 'package:chat_bubbles/bubbles/bubble_special_three.dart';
import 'package:flutter/material.dart';

import 'client.dart';
import 'models.dart';
import 'player_screen.dart';

var client = Client();
final List<StatelessWidget> _messages = [];

class ChatScreen extends StatefulWidget {
  final ValueChanged<TotalInformationState> onUpdateTotalInformationState;

  const ChatScreen({super.key, required this.onUpdateTotalInformationState});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _addMessage(TotalInformationState totalInformationState) {
    setState(() {
      _messages.clear();
    });
    var moves = totalInformationState.dialogGameboard.moves!;
    for (var move in moves) {
      bool isActive = totalInformationState
          .dialogGameboard.activeDiscourse!.entryIds
          .contains(move.discourseEntryId);
      var widget = IllocutionaryMetaWidget(move: move, isActive: isActive);
      setState(() {
        _messages.add(widget);
      });
    }
    widget.onUpdateTotalInformationState(totalInformationState);
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToEnd());
  }

  void _scrollToEnd() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            controller: _scrollController,
            child: Column(
              children: _messages,
            ),
          ),
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: BottomChatInput(
            onMessageSent: (TotalInformationState totalInformationState) {
              _addMessage(totalInformationState);
            },
          ),
        ),
      ],
    );
  }
}

class BottomChatInput extends StatefulWidget {
  final ValueChanged<TotalInformationState> onMessageSent;

  const BottomChatInput({Key? key, required this.onMessageSent})
      : super(key: key);

  @override
  State<BottomChatInput> createState() => _BottomChatInputState();
}

class _BottomChatInputState extends State<BottomChatInput> {
  final TextEditingController _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        margin: const EdgeInsets.only(bottom: 50),
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        width: MediaQuery.of(context).size.width / 2,
        decoration: BoxDecoration(
          color: Colors.grey[850],
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              blurRadius: 8,
              color: Colors.black.withOpacity(0.25),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                maxLines: null,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: TextStyle(color: Colors.grey[500]),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(10),
                ),
                onChanged: (text) {
                  setState(() {});
                },
              ),
            ),
            IconButton(
              icon: const Icon(Icons.send, color: Colors.white),
              onPressed: () async {
                if (playerName.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('You must create an AI Player')),
                  );
                }
                final messageText = _controller.text;
                if (messageText.trim().isEmpty) {
                  print('Empty message.');
                  return;
                }
                _controller.clear();
                try {
                  MakeUtteranceResponse? response =
                      await client.makeUtterance(playerId, "You", messageText);
                  print('Message sent: $messageText');
                  print(response?.toJson());
                  widget.onMessageSent(response!.totalInformationState);
                } catch (e) {
                  print(e);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to send message')),
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class IllocutionaryMetaWidget extends StatelessWidget {
  final IllocutionaryProposition move;

  final bool isActive;

  const IllocutionaryMetaWidget(
      {super.key, required this.move, required this.isActive});

  @override
  Widget build(BuildContext context) {
    final isContact = move.speaker == playerName;
    final backgroundColor = isContact ? Colors.cyan : Colors.greenAccent;
    return Container(
        color: backgroundColor,
        padding: const EdgeInsets.all(10.0),
        child: Column(
          children: [
            Builder(
              builder: (context) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(move.discourseEntryId.toString(),
                        style: const TextStyle(color: Colors.black)),
                    Icon(
                      isActive ? Icons.check : Icons.close,
                      color: isActive ? Colors.green : Colors.red,
                    ),
                  ],
                );
              },
            ),
            Text(move.illocutionaryRelation.name,
                style: const TextStyle(color: Colors.black)),
            const SizedBox(height: 10),
            Text(
              move.meaning != null && move.meaning!.isNotEmpty
                  ? move.meaning!
                  : '',
              style: const TextStyle(color: Colors.black),
            ),
            const SizedBox(height: 10),
            createChatBubble(move),
            const SizedBox(height: 10),
          ],
        ));
  }
}

StatelessWidget createChatBubble(IllocutionaryProposition move) {
  final isContact = move.speaker == playerName;
  if (isContact) {
    return BubbleSpecialThree(
      text: move.utterance!,
      color: const Color(0xFF4FD1C5),
      tail: true,
      textStyle: const TextStyle(color: Colors.black, fontSize: 16),
      isSender: false,
    );
  } else {
    return BubbleSpecialThree(
      text: move.utterance!,
      color: const Color(0xFF778CA3),
      tail: false,
      isSender: true,
      textStyle: const TextStyle(color: Colors.black54, fontSize: 16),
    );
  }
}
