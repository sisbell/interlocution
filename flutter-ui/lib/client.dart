import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'models.dart';

String serverUrl = dotenv.env['SERVER_URL']!;

class Client {
  final dio = Dio();

  Future<void> createPlayer(CreatePlayerRequest request) async {
    var data = request.toJson();
    try {
      final response = await dio.post(
        "$serverUrl/aiplayer/create",
        data: data,
        options: Options(headers: {
          'Content-Type': 'application/json',
        }),
      );
    } catch (e) {
      print('Exception: $e');
    }
  }

  Future<MakeUtteranceResponse?> makeUtterance(
      String playerId, String name, String utterance) async {
    final data = {"playerId": playerId, "name": name, "utterance": utterance};

    try {
      final response = await dio.post(
        "$serverUrl/game/play",
        data: data,
        options: Options(headers: {
          'Content-Type': 'application/json',
        }),
      );
      if (response.statusCode == 200) {
        return MakeUtteranceResponse.fromJson(response.data);
      } else {
        print('Error: ${response.statusCode}');
      }
    } catch (e) {
      print('Exception: $e');
    }
  }
}
