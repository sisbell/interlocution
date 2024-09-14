enum IllocutionaryRelation {
  ASK,
  ASK_INFLUENCE,
  ACCEPT,
  ASSERT,
  CHECK,
  CONFIRM,
  DENY,
  ENGAGE,
  DISENGAGE,
  INITIATING_SPEECH,
}

class CreatePlayerRequest {
  final String playerId;
  final String name;
  final TotalInformationState totalInformationState;

  CreatePlayerRequest(
      {required this.playerId,
      required this.name,
      required this.totalInformationState});

  Map<String, dynamic> toJson() => {
        'playerId': playerId,
        'name': name,
        "totalInformationState": totalInformationState.toJson()
      };
}

class MakeUtteranceResponse {
  final String playerName;
  final String playerUtterance;
  final TotalInformationState totalInformationState;

  MakeUtteranceResponse({
    required this.playerName,
    required this.playerUtterance,
    required this.totalInformationState,
  });

  factory MakeUtteranceResponse.fromJson(Map<String, dynamic> json) =>
      MakeUtteranceResponse(
        playerName: json['playerName'] as String,
        playerUtterance: json['playerUtterance'] as String,
        totalInformationState:
            TotalInformationState.fromJson(json['totalInformationState']),
      );

  Map<String, dynamic> toJson() => {
        'playerName': playerName,
        'playerUtterance': playerUtterance,
        "totalInformationState": totalInformationState.toJson()
      };
}

class Fact {
  final String proposition;
  final int discourseEntryIndex;

  Fact({
    required this.proposition,
    required this.discourseEntryIndex,
  });

  factory Fact.fromJson(Map<String, dynamic> json) => Fact(
        proposition: json['proposition'] as String,
        discourseEntryIndex: json['discourseEntryIndex'] as int,
      );

  Map<String, dynamic> toJson() => {
        'proposition': proposition,
        'discourseEntryIndex': discourseEntryIndex,
      };
}

class DiscourseEntry {
  final int id;
  final String tag;
  final String proposition;
  final int? linkedId;
  final String speaker;
  final String addressee;

  DiscourseEntry({
    required this.id,
    required this.tag,
    required this.proposition,
    this.linkedId,
    required this.speaker,
    required this.addressee,
  });

  factory DiscourseEntry.fromJson(Map<String, dynamic> json) => DiscourseEntry(
        id: json['id'] as int,
        tag: json['tag'] as String,
        proposition: json['proposition'] as String,
        linkedId: json['linkedId'] as int?,
        speaker: json['speaker'] as String,
        addressee: json['addressee'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'tag': tag,
        'proposition': proposition,
        'linkedId': linkedId,
        'speaker': speaker,
        'addressee': addressee,
      };
}

class DiscoursePool {
  final Map<String, DiscourseEntry> entries;

  DiscoursePool({
    required this.entries,
  });

  factory DiscoursePool.fromJson(Map<String, dynamic> json) => DiscoursePool(
        entries: (json['entries'] as Map<String, dynamic>).map(
          (key, value) => MapEntry(key, DiscourseEntry.fromJson(value)),
        ),
      );

  Map<String, dynamic> toJson() => {
        'entries': entries.map((key, value) => MapEntry(key, value.toJson())),
      };
}

class ActiveDiscourse {
  final List<int> entryIds;

  ActiveDiscourse({
    required this.entryIds,
  });

  factory ActiveDiscourse.fromJson(Map<String, dynamic> json) =>
      ActiveDiscourse(
        entryIds: List<int>.from(json['entryIds'] as List),
      );

  Map<String, dynamic> toJson() => {
        'entryIds': entryIds,
      };
}

class IllocutionaryProposition {
  final IllocutionaryRelation illocutionaryRelation;
  final String speaker;
  final String addressee;
  final String? utterance;
  final String? meaning;
  final int? discourseEntryId;

  IllocutionaryProposition({
    required this.illocutionaryRelation,
    required this.speaker,
    required this.addressee,
    this.utterance,
    this.meaning,
    this.discourseEntryId,
  });

  factory IllocutionaryProposition.fromJson(Map<String, dynamic> json) =>
      IllocutionaryProposition(
        illocutionaryRelation: IllocutionaryRelation.values.firstWhere(
          (e) =>
              e.toString() ==
              'IllocutionaryRelation.${json['illocutionaryRelation']}',
        ),
        speaker: json['speaker'] as String,
        addressee: json['addressee'] as String,
        utterance: json['utterance'] as String?,
        meaning: json['meaning'] as String?,
        discourseEntryId: json['discourseEntryId'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'illocutionaryRelation':
            illocutionaryRelation.toString().split('.').last,
        'speaker': speaker,
        'addressee': addressee,
        'utterance': utterance,
        'meaning': meaning,
        'discourseEntryId': discourseEntryId,
      };
}

class GameBoard {
  final String name;
  final List<IllocutionaryProposition>? moves;
  final DiscoursePool? discoursePool;
  final ActiveDiscourse? activeDiscourse;
  final List<Fact>? facts;

  final List<String>? resolvedDiscourses;

  GameBoard({
    required this.name,
    this.moves,
    this.discoursePool,
    this.activeDiscourse,
    this.resolvedDiscourses,
    this.facts,
  });

  factory GameBoard.fromJson(Map<String, dynamic> json) => GameBoard(
        name: json['name'] as String,
        moves: (json['moves'] as List?)
            ?.map((e) => IllocutionaryProposition.fromJson(e))
            .toList(),
        discoursePool: json['discoursePool'] != null
            ? DiscoursePool.fromJson(json['discoursePool'])
            : null,
        activeDiscourse: json['activeDiscourse'] != null
            ? ActiveDiscourse.fromJson(json['activeDiscourse'])
            : null,
        facts: (json['facts'] as List?)?.map((e) => Fact.fromJson(e)).toList(),
        resolvedDiscourses: (json['resolvedDiscourses'] as List?)
            ?.map((e) => e.toString())
            .toList(),
      );

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{
      'name': name,
    };
    if (moves != null) {
      data['moves'] = moves!.map((e) => e.toJson()).toList();
    }
    if (discoursePool != null) {
      data['discoursePool'] = discoursePool!.toJson();
    }
    if (activeDiscourse != null) {
      data['activeDiscourse'] = activeDiscourse!.toJson();
    }
    if (facts != null) {
      data['facts'] = facts!.map((e) => e.toJson()).toList();
    }
    if (resolvedDiscourses != null) {
      data['resolvedDiscourses'] =
          resolvedDiscourses!.map((e) => e.toString()).toList();
    }
    return data;
  }
}

class PlanInfo {
  final String plan;
  final String? stage;
  final String? reason;
  final List<String>? agenda;

  PlanInfo({required this.plan, this.stage, this.reason, this.agenda});

  factory PlanInfo.fromJson(Map<String, dynamic> json) => PlanInfo(
        plan: json['plan'] as String,
        stage: json['stage'] as String?,
        reason: json['reason'] as String?,
        agenda: (json['agenda'] as List?)?.map((e) => e as String).toList(),
      );

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{
      'plan': plan,
    };
    if (stage != null) {
      data['stage'] = stage;
    }
    if (reason != null) {
      data['reason'] = reason;
    }
    if (agenda != null) {
      data['agenda'] = agenda;
    }
    return data;
  }
}

class PrivateInformationState {
  final String genre;
  final String goals;
  final PlanInfo? planInfo;
  final String? beliefs;

  PrivateInformationState(
      {required this.genre, required this.goals, this.planInfo, this.beliefs});

  factory PrivateInformationState.fromJson(Map<String, dynamic> json) =>
      PrivateInformationState(
          genre: json['genre'] as String,
          goals: json['goals'] as String,
          planInfo: PlanInfo.fromJson(json['planInfo']),
          beliefs: json['beliefs'] as String?);

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{
      'genre': genre,
      'goals': goals
    };
    if (planInfo != null) {
      data['planInfo'] = planInfo!.toJson();
    }
    if (beliefs != null) {
      data['beliefs'] = beliefs;
    }
    return data;
  }
}

class TotalInformationState {
  final GameBoard dialogGameBoard;
  final PrivateInformationState privateInformationState;

  TotalInformationState({
    required this.dialogGameBoard,
    required this.privateInformationState,
  });

  factory TotalInformationState.fromJson(Map<String, dynamic> json) =>
      TotalInformationState(
        dialogGameBoard: GameBoard.fromJson(json['dialogGameBoard']),
        privateInformationState:
            PrivateInformationState.fromJson(json['privateInformationState']),
      );

  Map<String, dynamic> toJson() => {
        'dialogGameBoard': dialogGameBoard.toJson(),
        'privateInformationState': privateInformationState.toJson(),
      };
}

class Player {
  final String playerId;
  final String name;
  final TotalInformationState totalInformationState;

  Player({
    required this.playerId,
    required this.name,
    required this.totalInformationState,
  });

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        playerId: json['playerId'] as String,
        name: json['name'] as String,
        totalInformationState:
            TotalInformationState.fromJson(json['totalInformationState']),
      );

  Map<String, dynamic> toJson() => {
        'playerId': playerId,
        'name': name,
        'totalInformationState': totalInformationState.toJson(),
      };
}

class ModelConfig {
  final String modelName;

  ModelConfig({
    required this.modelName,
  });

  factory ModelConfig.fromJson(Map<String, dynamic> json) => ModelConfig(
        modelName: json['modelName'] as String,
      );

  Map<String, dynamic> toJson() => {
        'modelName': modelName,
      };
}
