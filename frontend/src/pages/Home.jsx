import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:unity_mediation/unity_mediation.dart';

// লোকাল অ্যাসেট পাথ (Assets Folder)
class GameAssets {
  static const String mouse = 'assets/images/mouse.png';
  static const String cat = 'assets/images/cat.png';
  static const String human = 'assets/images/human.png';
  static const String field = 'assets/images/field.png';
  static const String hole = 'assets/images/hole.png';
  static const String hammer = 'assets/images/hammer.png';
}

class HoleItem {
  final String id;
  final String type; // 'mouse', 'cat', 'human'
  HoleItem({required this.id, required this.type});
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final User? user = FirebaseAuth.instance.currentUser;
  final TextEditingController _referController = TextEditingController();

  // Unity Credentials
  final String gameId = '800375240';
  final String adUnitId = 'BP_Rewarded_Android';

  // Game States: 'idle', 'playing', 'ended'
  String _gameState = 'idle';
  int _score = 0;
  int _timeLeft = 35;
  int _cooldownSeconds = 0;
  
  bool _isAdLoading = false;
  bool _isClaiming = false;
  bool _hasFreePlay = true;

  Timer? _gameTimer;
  Timer? _spawnTimer;
  Timer? _cooldownTimer;

  // 16 Holes Grid Data
  List<HoleItem?> _holes = List.filled(16, null);
  final Set<String> _clickedItemIds = {};
  int _spawnedMiceCount = 0;
  DateTime? _gameStartTime;
  int? _hitIndex;

  @override
  void initState() {
    super.initState();
    _checkDailyFreePlay();
    _checkAndShowReferralDialog();
    _initUnityLevelPlay();
  }

  @override
  void dispose() {
    _gameTimer?.cancel();
    _spawnTimer?.cancel();
    _cooldownTimer?.cancel();
    _referController.dispose();
    super.dispose();
  }

  void _initUnityLevelPlay() {
    UnityMediation.initialize(
      gameId: gameId,
      onComplete: () => print('Unity LevelPlay Initialized'),
      onFailed: (error, message) => print('Initialization Failed: $message'),
    );
  }

  // ডেইলি ফ্রি প্লে চেক
  Future<void> _checkDailyFreePlay() async {
    if (user == null) return;
    String today = DateTime.now().toIso8601String().split('T')[0];
    DocumentSnapshot doc = await FirebaseFirestore.instance.collection('users').doc(user!.uid).get();
    
    if (doc.exists && (doc.data() as Map<String, dynamic>).containsKey('lastFreePlayDate')) {
      String lastPlay = doc.get('lastFreePlayDate');
      setState(() => _hasFreePlay = (lastPlay != today));
    } else {
      setState(() => _hasFreePlay = true);
    }
  }

  // Referral Dialog
  Future<void> _checkAndShowReferralDialog() async {
    if (user == null) return;
    DocumentSnapshot userDoc = await FirebaseFirestore.instance.collection('users').doc(user!.uid).get();

    if (!userDoc.exists || !(userDoc.data() as Map<String, dynamic>).containsKey('referredBy')) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _showReferralDialog());
    }
  }

  void _showReferralDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text("Enter Referral Code"),
        content: TextField(
          controller: _referController,
          decoration: const InputDecoration(hintText: "Enter Code (Optional)", border: OutlineInputBorder()),
        ),
        actions: [
          ElevatedButton(
            onPressed: () async {
              String code = _referController.text.trim();
              await FirebaseFirestore.instance.collection('users').doc(user!.uid).set({
                'referredBy': code.isNotEmpty ? code : 'NONE',
              }, SetOptions(merge: true));
              if (mounted) Navigator.pop(context);
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  // CoolDown Timer (35 Seconds)
  void _startCooldown() {
    setState(() => _cooldownSeconds = 35);
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds > 0) {
        setState(() => _cooldownSeconds--);
      } else {
        _cooldownTimer?.cancel();
      }
    });
  }

  // Start Game Trigger Logic
  Future<void> _handleStartGame() async {
    if (_cooldownSeconds > 0 || _isAdLoading) return;

    if (_hasFreePlay) {
      String today = DateTime.now().toIso8601String().split('T')[0];
      await FirebaseFirestore.instance.collection('users').doc(user!.uid).set({'lastFreePlayDate': today}, SetOptions(merge: true));
      setState(() => _hasFreePlay = false);
      _startGameLogic();
    } else {
      _showRewardedAd(onRewardEarned: () => _startGameLogic());
    }
  }

  // Whack-A-Mouse গেম ইঞ্জিন
  void _startGameLogic() {
    setState(() {
      _score = 0;
      _timeLeft = 35;
      _gameState = 'playing';
      _holes = List.filled(16, null);
      _clickedItemIds.clear();
      _spawnedMiceCount = 0;
      _gameStartTime = DateTime.now();
    });

    _gameTimer?.cancel();
    _gameTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _stopGameLogic();
      }
    });

    _spawnTimer?.cancel();
    _spawnTimer = Timer.periodic(const Duration(milliseconds: 1000), (timer) {
      if (_gameState != 'playing') return;

      List<int> emptyIndexes = [];
      for (int i = 0; i < 16; i++) {
        if (_holes[i] == null) emptyIndexes.add(i);
      }

      if (emptyIndexes.isEmpty) return;

      Random random = Random();
      int batchSize = random.nextInt(2) + 1;
      bool mouseSpawnedInThisBatch = false;

      double elapsedTime = DateTime.now().difference(_gameStartTime!).inMilliseconds / 1000.0;
      int maxAllowedMice = min(14, (elapsedTime / 2.4).floor() + 1);

      List<HoleItem?> newHoles = List.from(_holes);

      for (int i = 0; i < batchSize; i++) {
        if (emptyIndexes.isEmpty) break;

        int randPos = random.nextInt(emptyIndexes.length);
        int targetHoleIndex = emptyIndexes.removeAt(randPos);
        String itemId = '${DateTime.now().millisecondsSinceEpoch}_${random.nextDouble()}';

        String itemType = 'cat';
        bool canSpawnMouse = _spawnedMiceCount < maxAllowedMice && _spawnedMiceCount < 14 && !mouseSpawnedInThisBatch;

        if (canSpawnMouse) {
          double randVal = random.nextDouble();
          if (randVal < 0.70) {
            itemType = 'mouse';
            _spawnedMiceCount++;
            mouseSpawnedInThisBatch = true;
          } else if (randVal < 0.88) {
            itemType = 'cat';
          } else {
            itemType = 'human';
          }
        } else {
          itemType = random.nextBool() ? 'cat' : 'human';
        }

        newHoles[targetHoleIndex] = HoleItem(id: itemId, type: itemType);

        Timer(const Duration(milliseconds: 700), () {
          if (mounted && _gameState == 'playing') {
            setState(() {
              if (_holes[targetHoleIndex]?.id == itemId) {
                _holes[targetHoleIndex] = null;
              }
            });
          }
        });
      }

      setState(() => _holes = newHoles);
    });
  }

  void _stopGameLogic() {
    _gameTimer?.cancel();
    _spawnTimer?.cancel();
    setState(() {
      _gameState = 'ended';
      _holes = List.filled(16, null);
    });
  }

  void _handleHitItem(int index) {
    if (_gameState != 'playing') return;
    HoleItem? item = _holes[index];
    if (item == null || _clickedItemIds.contains(item.id)) return;

    _clickedItemIds.add(item.id);
    setState(() => _hitIndex = index);

    if (item.type == 'mouse') {
      setState(() => _score = min(_score + 10, 140));
    } else {
      setState(() => _score = max(0, _score - 5));
    }

    Timer(const Duration(milliseconds: 200), () {
      if (mounted) {
        setState(() {
          _hitIndex = null;
          _holes[index] = null;
        });
      }
    });
  }

  Future<void> _claimReward(bool isDouble) async {
    if (_score == 0) {
      setState(() => _gameState = 'idle');
      return;
    }

    if (isDouble) {
      _showRewardedAd(onRewardEarned: () => _sendScoreToFirebase(_score * 2));
    } else {
      await _sendScoreToFirebase(_score);
    }
  }

  Future<void> _sendScoreToFirebase(int finalCoins) async {
    setState(() => _isClaiming = true);
    try {
      await FirebaseFirestore.instance.collection('users').doc(user!.uid).update({
        'coins': FieldValue.increment(finalCoins),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('🎉 Claimed $finalCoins Coins!')));
        setState(() {
          _gameState = 'idle';
          _score = 0;
          _isClaiming = false;
        });
        _startCooldown();
      }
    } catch (e) {
      setState(() => _isClaiming = false);
    }
  }

  void _handleWatchAdForCoins() {
    _showRewardedAd(onRewardEarned: () async {
      await FirebaseFirestore.instance.collection('users').doc(user!.uid).update({
        'coins': FieldValue.increment(80),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('+80 Coins added!')));
        _startCooldown();
      }
    });
  }

  void _showRewardedAd({required VoidCallback onRewardEarned}) {
    setState(() => _isAdLoading = true);
    UnityMediation.showRewardedAd(
      adUnitId: adUnitId,
      onComplete: (adUnitId) {
        setState(() => _isAdLoading = false);
        onRewardEarned();
      },
      onFailed: (adUnitId, error, message) {
        setState(() => _isAdLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ad failed to load: $message')));
      },
      onClosed: (adUnitId) => setState(() => _isAdLoading = false),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(70),
        child: SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFF1E293B),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: user?.photoURL != null ? NetworkImage(user!.photoURL!) : null,
                  child: user?.photoURL == null ? const Icon(Icons.person) : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(user?.displayName ?? "User", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      Text("ID: ${user?.uid.substring(0, min(8, user?.uid.length ?? 0))}", style: const TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                ),
                StreamBuilder<DocumentSnapshot>(
                  stream: FirebaseFirestore.instance.collection('users').doc(user?.uid).snapshots(),
                  builder: (context, snapshot) {
                    int coins = 0;
                    if (snapshot.hasData && snapshot.data!.exists) {
                      coins = (snapshot.data!.data() as Map<String, dynamic>)?['coins'] ?? 0;
                    }
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: Colors.amber.shade900.withOpacity(0.4), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.amber)),
                      child: Row(
                        children: [
                          const Icon(Icons.monetization_on, color: Colors.amber, size: 18),
                          const SizedBox(width: 4),
                          Text("$coins", style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    );
                  },
                )
              ],
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ১. IDLE STATE
                  if (_gameState == 'idle') ...[
                    Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(color: Colors.amber.withOpacity(0.1), shape: BoxShape.circle, border: Border.all(color: Colors.amber.withOpacity(0.3))),
                      child: const Center(child: Text("🐭", style: TextStyle(fontSize: 45))),
                    ),
                    const SizedBox(height: 12),
                    const Text("Whack A Mouse", style: TextStyle(color: Colors.amber, fontSize: 24, fontWeight: FontWeight.bold)),
                    const Text("Hit 14 mice in 35s! Avoid Cats & Humans!", style: TextStyle(color: Colors.grey, fontSize: 13)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        Chip(label: const Text("🐭 Mouse = +10"), backgroundColor: const Color(0xFF064E3B), labelStyle: const TextStyle(color: Color(0xFF6EE7B7), fontSize: 11)),
                        Chip(label: const Text("🐱/👨 = -5"), backgroundColor: const Color(0xFF881337), labelStyle: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: (_cooldownSeconds > 0 || _isAdLoading) ? null : _handleStartGame,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        _isAdLoading
                            ? "Loading Ad..."
                            : _cooldownSeconds > 0
                                ? "⏳ Wait ${_cooldownSeconds}s..."
                                : _hasFreePlay
                                    ? "🎁 PLAY (1 Daily Free Game)"
                                    : "📺 WATCH AD TO PLAY",
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: (_cooldownSeconds > 0 || _isAdLoading) ? null : _handleWatchAdForCoins,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        _cooldownSeconds > 0 ? "⏳ Wait ${_cooldownSeconds}s..." : "📺 Play Ads = 80 Coins",
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ],

                  // ২. PLAYING STATE - (4x4 Grid Board)
                  if (_gameState == 'playing') ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF334155))),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("⏱️ ${_timeLeft}s", style: const TextStyle(color: Colors.cyanAccent, fontSize: 18, fontWeight: FontWeight.bold)),
                          Text("🎯 $_score", style: const TextStyle(color: Colors.amber, fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 15),

                    // 16-Holes Field (FIXED HEIGHT with AssetImage)
                    Container(
                      width: double.infinity,
                      height: 380,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.lime.shade800, width: 4),
                        image: const DecorationImage(image: AssetImage(GameAssets.field), fit: BoxFit.cover),
                      ),
                      child: GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(8),
                        itemCount: 16,
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, crossAxisSpacing: 4, mainAxisSpacing: 4),
                        itemBuilder: (context, index) {
                          HoleItem? item = _holes[index];
                          return GestureDetector(
                            onTap: () => _handleHitItem(index),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Image.asset(GameAssets.hole, fit: BoxFit.contain),
                                if (item != null)
                                  Positioned(
                                    bottom: 10,
                                    child: Image.asset(
                                      item.type == 'mouse'
                                          ? GameAssets.mouse
                                          : item.type == 'cat'
                                              ? GameAssets.cat
                                              : GameAssets.human,
                                      width: 45,
                                      height: 45,
                                      fit: BoxFit.contain,
                                    ),
                                  ),
                                if (_hitIndex == index)
                                  Positioned(
                                    top: 0,
                                    right: 0,
                                    child: Image.asset(GameAssets.hammer, width: 35, height: 35),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  // ৩. GAME OVER STATE
                  if (_gameState == 'ended') ...[
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFF334155))),
                      child: Column(
                        children: [
                          const Text("🎉 Match Finished!", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          const Text("Total Coins Earned:", style: TextStyle(color: Colors.grey)),
                          Text("$_score Coins", style: const TextStyle(color: Colors.amber, fontSize: 32, fontWeight: FontWeight.black)),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: _isClaiming ? null : () => _claimReward(false),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF334155),
                              minimumSize: const Size(double.infinity, 48),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(_isClaiming ? "Processing..." : "Claim $_score Coins", style: const TextStyle(color: Colors.white)),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: _isClaiming ? null : () => _claimReward(true),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              minimumSize: const Size(double.infinity, 50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(_isClaiming ? "Loading Ad..." : "📺 Watch Ad to Double (2x) ➔ ${_score * 2} Coins", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
