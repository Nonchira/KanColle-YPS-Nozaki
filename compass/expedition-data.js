// Numeric requirements reviewed against Kancolle Wiki, 2026-10-04. See docs source audit.
export const EXPEDITION_RULES={
  "1": {
    "name": "練習航海",
    "min": 2,
    "flagshipLevel": 1,
    "totalLevel": null,
    "groups": [],
    "fleet": "艦種自由",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "2": {
    "name": "長距離練習航海",
    "min": 4,
    "flagshipLevel": 2,
    "totalLevel": null,
    "groups": [],
    "fleet": "艦種自由",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "3": {
    "name": "警備任務",
    "min": 3,
    "flagshipLevel": 3,
    "totalLevel": null,
    "groups": [],
    "fleet": "艦種自由",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "4": {
    "name": "対潜警戒任務",
    "min": 3,
    "flagshipLevel": 3,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "軽巡1・駆逐/海防2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "5": {
    "name": "海上護衛任務",
    "min": 4,
    "flagshipLevel": 3,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "軽巡1・駆逐/海防2・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "6": {
    "name": "防空射撃演習",
    "min": 4,
    "flagshipLevel": 4,
    "totalLevel": null,
    "groups": [],
    "fleet": "艦種自由",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "7": {
    "name": "観艦式予行",
    "min": 6,
    "flagshipLevel": 5,
    "totalLevel": null,
    "groups": [],
    "fleet": "艦種自由",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "8": {
    "name": "観艦式",
    "min": 6,
    "flagshipLevel": 6,
    "totalLevel": null,
    "groups": [],
    "fleet": "艦種自由",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "A1": {
    "name": "兵站強化任務",
    "min": 4,
    "flagshipLevel": 5,
    "totalLevel": 10,
    "groups": [
      [
        "駆逐/海防",
        3
      ]
    ],
    "fleet": "駆逐/海防3・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "A2": {
    "name": "海峡警備行動",
    "min": 4,
    "flagshipLevel": 20,
    "totalLevel": null,
    "groups": [
      [
        "駆逐/海防",
        4
      ]
    ],
    "fleet": "駆逐/海防4",
    "flagshipType": null,
    "stats": {
      "火力": 50,
      "対空": 70,
      "対潜": 180
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "A3": {
    "name": "長時間対潜警戒",
    "min": 5,
    "flagshipLevel": 35,
    "totalLevel": 185,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        3
      ]
    ],
    "fleet": "軽巡1・駆逐/海防3・他1",
    "flagshipType": null,
    "stats": {
      "対潜": 280,
      "索敵": 60
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "A4": {
    "name": "南西方面連絡線哨戒",
    "min": 5,
    "flagshipLevel": 40,
    "totalLevel": 200,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "軽巡1・駆逐2・他2",
    "flagshipType": null,
    "stats": {
      "火力": 300,
      "対空": 200,
      "対潜": 200,
      "索敵": 120
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "A5": {
    "name": "小笠原沖哨戒線",
    "min": 5,
    "flagshipLevel": 45,
    "totalLevel": 230,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "軽巡1・駆逐3・他1",
    "flagshipType": null,
    "stats": {
      "火力": 280,
      "対空": 220,
      "対潜": 240,
      "索敵": 150
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "A6": {
    "name": "小笠原沖戦闘哨戒",
    "min": 6,
    "flagshipLevel": 55,
    "totalLevel": 290,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "軽巡1・駆逐3・他2",
    "flagshipType": null,
    "stats": {
      "火力": 330,
      "対空": 300,
      "対潜": 270,
      "索敵": 180
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "9": {
    "name": "タンカー護衛任務",
    "min": 4,
    "flagshipLevel": 3,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "軽巡1・駆逐/海防2・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "10": {
    "name": "強行偵察任務",
    "min": 3,
    "flagshipLevel": 3,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        2
      ]
    ],
    "fleet": "軽巡2・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "11": {
    "name": "ボーキサイト輸送任務",
    "min": 4,
    "flagshipLevel": 6,
    "totalLevel": null,
    "groups": [
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "駆逐/海防2・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "12": {
    "name": "資源輸送任務",
    "min": 4,
    "flagshipLevel": 4,
    "totalLevel": null,
    "groups": [
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "駆逐/海防2・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "13": {
    "name": "鼠輸送作戦",
    "min": 6,
    "flagshipLevel": 5,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        4
      ]
    ],
    "fleet": "軽巡1・駆逐4・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "14": {
    "name": "包囲陸戦隊撤収作戦",
    "min": 6,
    "flagshipLevel": 6,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "軽巡1・駆逐3・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "15": {
    "name": "囮機動部隊支援作戦",
    "min": 6,
    "flagshipLevel": 8,
    "totalLevel": null,
    "groups": [
      [
        "空母系/水母",
        2
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "空母系/水母2・駆逐2・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "16": {
    "name": "艦隊決戦援護作戦",
    "min": 6,
    "flagshipLevel": 10,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "軽巡1・駆逐2・他3",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "B1": {
    "name": "南西方面航空偵察作戦",
    "min": 6,
    "flagshipLevel": 40,
    "totalLevel": 150,
    "groups": [
      [
        "水母",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "水母1・軽巡1・駆逐/海防2・他2",
    "flagshipType": null,
    "stats": {
      "対空": 200,
      "対潜": 200,
      "索敵": 140
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "B2": {
    "name": "敵泊地強襲反撃作戦",
    "min": 6,
    "flagshipLevel": 45,
    "totalLevel": 220,
    "groups": [
      [
        "重巡",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "重巡1・軽巡1・駆逐3・他1",
    "flagshipType": null,
    "stats": {
      "火力": 360,
      "対空": 160,
      "対潜": 160,
      "索敵": 140
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "B3": {
    "name": "南西諸島離島哨戒作戦",
    "min": 6,
    "flagshipLevel": 50,
    "totalLevel": 250,
    "groups": [
      [
        "水母",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        4
      ]
    ],
    "fleet": "水母1・軽巡1・駆逐/海防4",
    "flagshipType": null,
    "stats": {
      "火力": 400,
      "対空": 220,
      "対潜": 220,
      "索敵": 190
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "B4": {
    "name": "南西諸島離島防衛作戦",
    "min": 6,
    "flagshipLevel": 55,
    "totalLevel": 300,
    "groups": [
      [
        "重巡",
        2
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ],
      [
        "潜水",
        1
      ]
    ],
    "fleet": "重巡2・軽巡1・駆逐2・潜水1",
    "flagshipType": null,
    "stats": {
      "火力": 500,
      "対空": 280,
      "対潜": 280,
      "索敵": 170
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "B5": {
    "name": "南西諸島捜索撃滅戦",
    "min": 6,
    "flagshipLevel": 60,
    "totalLevel": 330,
    "groups": [
      [
        "水母",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "水母1・軽巡1・駆逐2・他2",
    "flagshipType": null,
    "stats": {
      "火力": 510,
      "対空": 400,
      "対潜": 285,
      "索敵": 385
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "B6": {
    "name": "精鋭水雷戦隊夜襲",
    "min": 6,
    "flagshipLevel": 75,
    "totalLevel": 400,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        5
      ]
    ],
    "fleet": "軽巡1・駆逐5",
    "flagshipType": "軽巡",
    "stats": {
      "火力": 410,
      "対空": 390,
      "対潜": 410,
      "索敵": 340
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": true
    }
  },
  "17": {
    "name": "敵地偵察作戦",
    "min": 6,
    "flagshipLevel": 20,
    "totalLevel": null,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "軽巡1・駆逐3・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "18": {
    "name": "航空機輸送作戦",
    "min": 6,
    "flagshipLevel": 15,
    "totalLevel": null,
    "groups": [
      [
        "空母系/水母",
        3
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "空母系/水母3・駆逐2・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "19": {
    "name": "北号作戦",
    "min": 6,
    "flagshipLevel": 20,
    "totalLevel": null,
    "groups": [
      [
        "航戦",
        2
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "航戦2・駆逐2・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "20": {
    "name": "潜水艦哨戒任務",
    "min": 2,
    "flagshipLevel": 1,
    "totalLevel": null,
    "groups": [
      [
        "潜水",
        1
      ],
      [
        "軽巡",
        1
      ]
    ],
    "fleet": "潜水1・軽巡1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "21": {
    "name": "北方鼠輸送作戦",
    "min": 5,
    "flagshipLevel": 15,
    "totalLevel": 30,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        4
      ]
    ],
    "fleet": "軽巡1・駆逐4",
    "flagshipType": null,
    "stats": {},
    "drums": 3,
    "drumShips": 3,
    "great": {
      "kind": "drums",
      "drums": 4,
      "ships": 3,
      "kira": 4
    }
  },
  "22": {
    "name": "艦隊演習",
    "min": 6,
    "flagshipLevel": 30,
    "totalLevel": 45,
    "groups": [
      [
        "重巡",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "重巡1・軽巡1・駆逐2・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "23": {
    "name": "航空戦艦運用演習",
    "min": 6,
    "flagshipLevel": 50,
    "totalLevel": 200,
    "groups": [
      [
        "航戦",
        2
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "航戦2・駆逐2・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "24": {
    "name": "北方航路海上護衛",
    "min": 6,
    "flagshipLevel": 50,
    "totalLevel": 200,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        4
      ]
    ],
    "fleet": "軽巡1・駆逐/海防4・他1",
    "flagshipType": "軽巡",
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "drums",
      "drums": 2,
      "ships": 1,
      "kira": 4
    }
  },
  "41": {
    "name": "ブルネイ泊地沖哨戒",
    "min": 3,
    "flagshipLevel": 30,
    "totalLevel": 100,
    "groups": [
      [
        "駆逐/海防",
        3
      ]
    ],
    "fleet": "駆逐/海防3",
    "flagshipType": null,
    "stats": {
      "火力": 60,
      "対空": 80,
      "対潜": 210
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "42": {
    "name": "ミ船団護衛(一号船団)",
    "min": 4,
    "flagshipLevel": 45,
    "totalLevel": 200,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "軽巡1・駆逐2・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "43": {
    "name": "ミ船団護衛(二号船団)",
    "min": 6,
    "flagshipLevel": 55,
    "totalLevel": 300,
    "groups": [
      [
        "軽空母",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        4
      ]
    ],
    "fleet": "軽空母1・軽巡1・駆逐4",
    "flagshipType": "軽空母",
    "stats": {
      "火力": 500,
      "対空": 280,
      "対潜": 280,
      "索敵": 170
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    },
    "alternativeNote": "護衛空母旗艦＋駆逐2（または海防2）＋自由3の別案あり。駆逐1＋海防1は不可。下の艦種照合は軽空母＋軽巡＋駆逐4の基本例。"
  },
  "44": {
    "name": "航空装備輸送任務",
    "min": 6,
    "flagshipLevel": 35,
    "totalLevel": 210,
    "groups": [
      [
        "水母",
        1
      ],
      [
        "空母系/水母",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐/海防",
        2
      ]
    ],
    "fleet": "水母1・空母系/水母1・軽巡1・駆逐/海防2・他1",
    "flagshipType": null,
    "stats": {
      "対空": 200,
      "対潜": 200,
      "索敵": 150
    },
    "drums": 6,
    "drumShips": 3,
    "great": {
      "kind": "drums",
      "drums": 8,
      "ships": 3,
      "kira": 4
    },
    "alternativeNote": "編成条件は出典でも要検証。空母系枠と水母枠は別の艦が必要。"
  },
  "45": {
    "name": "ボーキサイト船団護衛",
    "min": 5,
    "flagshipLevel": 50,
    "totalLevel": 240,
    "groups": [
      [
        "軽空母",
        1
      ],
      [
        "駆逐/海防",
        4
      ]
    ],
    "fleet": "軽空母1・駆逐/海防4",
    "flagshipType": "軽空母",
    "stats": {
      "対空": 240,
      "対潜": 300,
      "索敵": 180
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "46": {
    "name": "南西海域戦闘哨戒",
    "min": 5,
    "flagshipLevel": 60,
    "totalLevel": 300,
    "groups": [
      [
        "重巡",
        2
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "重巡2・軽巡1・駆逐2",
    "flagshipType": null,
    "stats": {
      "火力": 350,
      "対空": 250,
      "対潜": 220,
      "索敵": 190
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "25": {
    "name": "通商破壊作戦",
    "min": 4,
    "flagshipLevel": 25,
    "totalLevel": null,
    "groups": [
      [
        "重巡",
        2
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "重巡2・駆逐2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "26": {
    "name": "敵母港空襲作戦",
    "min": 4,
    "flagshipLevel": 30,
    "totalLevel": null,
    "groups": [
      [
        "空母系/水母",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "空母系/水母1・軽巡1・駆逐2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "27": {
    "name": "潜水艦通商破壊作戦",
    "min": 2,
    "flagshipLevel": 1,
    "totalLevel": null,
    "groups": [
      [
        "潜水",
        2
      ]
    ],
    "fleet": "潜水2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "28": {
    "name": "西方海域封鎖作戦",
    "min": 3,
    "flagshipLevel": 30,
    "totalLevel": null,
    "groups": [
      [
        "潜水",
        3
      ]
    ],
    "fleet": "潜水3",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "29": {
    "name": "潜水艦派遣演習",
    "min": 3,
    "flagshipLevel": 50,
    "totalLevel": null,
    "groups": [
      [
        "潜水",
        3
      ]
    ],
    "fleet": "潜水3",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "30": {
    "name": "潜水艦派遣作戦",
    "min": 4,
    "flagshipLevel": 55,
    "totalLevel": null,
    "groups": [
      [
        "潜水",
        4
      ]
    ],
    "fleet": "潜水4",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "31": {
    "name": "海外艦との接触",
    "min": 4,
    "flagshipLevel": 60,
    "totalLevel": 200,
    "groups": [
      [
        "潜水",
        4
      ]
    ],
    "fleet": "潜水4",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "32": {
    "name": "遠洋練習航海",
    "min": 3,
    "flagshipLevel": 5,
    "totalLevel": null,
    "groups": [
      [
        "練巡",
        1
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "練巡1・駆逐2",
    "flagshipType": "練巡",
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": true
    },
    "alternativeNote": "練巡枠には未改装の朝日も含みます。"
  },
  "D1": {
    "name": "西方海域偵察作戦",
    "min": 5,
    "flagshipLevel": 50,
    "totalLevel": 200,
    "groups": [
      [
        "水母",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "水母1・駆逐3・他1",
    "flagshipType": "水母",
    "stats": {
      "対空": 240,
      "対潜": 240,
      "索敵": 300
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    },
    "alternativeNote": "代替編成・検証中の条件あり。基本例と異なる場合は出典を確認。"
  },
  "D2": {
    "name": "西方潜水艦作戦",
    "min": 5,
    "flagshipLevel": 55,
    "totalLevel": 270,
    "groups": [
      [
        "潜水母艦",
        1
      ],
      [
        "潜水",
        3
      ]
    ],
    "fleet": "潜水母艦1・潜水3・他1",
    "flagshipType": "潜水母艦",
    "stats": {
      "火力": 60,
      "対空": 80,
      "対潜": 50,
      "索敵": 70
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "D3": {
    "name": "欧州方面友軍との接触",
    "min": 5,
    "flagshipLevel": 65,
    "totalLevel": 350,
    "groups": [
      [
        "潜水母艦",
        1
      ],
      [
        "潜水",
        3
      ]
    ],
    "fleet": "潜水母艦1・潜水3・他1",
    "flagshipType": "潜水母艦",
    "stats": {
      "火力": 115,
      "対空": 90,
      "対潜": 70,
      "索敵": 95
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": true
    }
  },
  "33": {
    "name": "前衛支援任務",
    "min": 2,
    "flagshipLevel": null,
    "totalLevel": null,
    "groups": [
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "駆逐2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "support"
    }
  },
  "34": {
    "name": "艦隊決戦支援任務",
    "min": 2,
    "flagshipLevel": null,
    "totalLevel": null,
    "groups": [
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "駆逐2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "support"
    }
  },
  "35": {
    "name": "MO作戦",
    "min": 6,
    "flagshipLevel": 40,
    "totalLevel": null,
    "groups": [
      [
        "空母系/水母",
        2
      ],
      [
        "重巡",
        1
      ],
      [
        "駆逐",
        1
      ]
    ],
    "fleet": "空母系/水母2・重巡1・駆逐1・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "36": {
    "name": "水上機基地建設",
    "min": 6,
    "flagshipLevel": 30,
    "totalLevel": null,
    "groups": [
      [
        "水母",
        2
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        1
      ]
    ],
    "fleet": "水母2・軽巡1・駆逐1・他2",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "37": {
    "name": "東京急行",
    "min": 6,
    "flagshipLevel": 50,
    "totalLevel": 200,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        5
      ]
    ],
    "fleet": "軽巡1・駆逐5",
    "flagshipType": null,
    "stats": {},
    "drums": 4,
    "drumShips": 3,
    "great": {
      "kind": "drums",
      "drums": 5,
      "ships": 3,
      "kira": 4
    }
  },
  "38": {
    "name": "東京急行(弐)",
    "min": 6,
    "flagshipLevel": 65,
    "totalLevel": 240,
    "groups": [
      [
        "駆逐",
        5
      ]
    ],
    "fleet": "駆逐5・他1",
    "flagshipType": null,
    "stats": {},
    "drums": 8,
    "drumShips": 4,
    "great": {
      "kind": "drums",
      "drums": 10,
      "ships": 4,
      "kira": 4
    }
  },
  "39": {
    "name": "遠洋潜水艦作戦",
    "min": 5,
    "flagshipLevel": 3,
    "totalLevel": 180,
    "groups": [
      [
        "潜水母艦",
        1
      ],
      [
        "潜水",
        4
      ]
    ],
    "fleet": "潜水母艦1・潜水4",
    "flagshipType": null,
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "normal"
    }
  },
  "40": {
    "name": "水上機前線輸送",
    "min": 6,
    "flagshipLevel": 25,
    "totalLevel": 150,
    "groups": [
      [
        "軽巡",
        1
      ],
      [
        "水母",
        2
      ],
      [
        "駆逐",
        2
      ]
    ],
    "fleet": "軽巡1・水母2・駆逐2・他1",
    "flagshipType": "軽巡",
    "stats": {},
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "drums",
      "drums": 4,
      "ships": 1,
      "kira": 4
    }
  },
  "E1": {
    "name": "ラバウル方面艦隊進出",
    "min": 6,
    "flagshipLevel": 55,
    "totalLevel": 290,
    "groups": [
      [
        "重巡",
        1
      ],
      [
        "軽巡",
        1
      ],
      [
        "駆逐",
        3
      ]
    ],
    "fleet": "重巡1・軽巡1・駆逐3・他1",
    "flagshipType": "重巡",
    "stats": {
      "火力": 450,
      "対空": 350,
      "対潜": 330,
      "索敵": 250
    },
    "drums": 0,
    "drumShips": 0,
    "great": {
      "kind": "level",
      "uncertain": false
    }
  },
  "E2": {
    "name": "強行鼠輸送作戦",
    "min": 5,
    "flagshipLevel": 70,
    "totalLevel": 320,
    "groups": [
      [
        "駆逐",
        5
      ]
    ],
    "fleet": "駆逐5",
    "flagshipType": null,
    "stats": {
      "火力": 280,
      "対空": 240,
      "対潜": 200,
      "索敵": 160
    },
    "drums": 4,
    "drumShips": 3,
    "great": {
      "kind": "drums",
      "drums": 6,
      "ships": 3,
      "kira": 4
    }
  }
};
