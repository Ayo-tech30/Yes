// ============================================================
// ⚙️ BOT CONFIGURATION - Edit this file for your setup
// ============================================================

module.exports = {
  // Bot owner number (with country code, no + sign)
  OWNER_NUMBER: '2349049460676',

  // ============================================================
  // SUDO NUMBERS - Can use .join .exit .ban .unban
  // Owner can add more with .sudo <number>
  // ============================================================
  SUDO_NUMBERS: [
    '2349049460676',
    // More added dynamically via .sudo command (saved to Firebase)
  ],

  // Bot prefix
  PREFIX: '.',

  // Bot name
  BOT_NAME: 'Delta',

  // Bot creator
  CREATOR: 'ꨄ︎ 𝙆𝙔𝙉𝙓 ꨄ︎',

  // Community link
  COMMUNITY_LINK: 'https://chat.whatsapp.com/C58szhJGQ3EKlvFt1Hp57n',

  // Default sticker metadata
  STICKER_NAME: 'Shadow',
  STICKER_AUTHOR: 'Sʜᴀᴅᴏᴡ  Gᴀʀᴅᴇɴ',

  // ============================================================
  // MENU IMAGE PATH
  // Put your image at: assets/delta.jpg
  // ============================================================
  MENU_IMAGE: './assets/delta.jpg',

  // Session folder
  SESSION_FOLDER: './sessions',

  // ============================================================
  // API KEYS - Fill these in!
  // ============================================================

  // Google Gemini AI API Key (for .ai / .gpt commands)
  // Get it FREE at: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',

  // Remove.bg API Key (for background removal - optional)
  REMOVEBG_API_KEY: 'YOUR_REMOVEBG_KEY_HERE',

  // RapidAPI Key (for downloaders - YouTube, TikTok etc)
  RAPIDAPI_KEY: 'YOUR_RAPIDAPI_KEY_HERE',

  // Economy settings
  DAILY_AMOUNT: 500,
  DAILY_COOLDOWN_HOURS: 24,
  STARTING_BALANCE: 50000, // 50,000 coins starting balance

  // Max warnings before auto-kick
  MAX_WARNS: 3,

  // Antilink action (kick/warn/delete)
  DEFAULT_ANTILINK_ACTION: 'warn',

  // Game settings
  GAME_BET_MIN: 10,
  SLOTS_EMOJIS: ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'],

  // Card tiers
  CARD_TIERS: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'],

  // Shop items
  SHOP_ITEMS: [
    // ── Tools ───────────────────────────────────────────────────
    { id: 'fishingrod',    emoji: '🎣', name: '🎣 Fishing Rod',     price: 200,   type: 'tool',        description: 'Required to use .fish command' },
    { id: 'premium_rod',   emoji: '🎣', name: '🎣 Premium Rod',     price: 800,   type: 'tool',        description: 'Fish with +50% bonus coins' },
    { id: 'shovel',        emoji: '⛏️', name: '⛏️ Shovel',          price: 150,   type: 'tool',        description: 'Required to use .dig command' },
    { id: 'golden_shovel', emoji: '⛏️', name: '⛏️ Golden Shovel',   price: 1000,  type: 'tool',        description: 'Dig with +100% bonus coins' },
    { id: 'pickaxe',       emoji: '⛏️', name: '⛏️ Pickaxe',         price: 500,   type: 'tool',        description: 'Mine gems with .dig (rare finds)' },
    { id: 'metal_detector',emoji: '📡', name: '📡 Metal Detector',  price: 600,   type: 'tool',        description: 'Doubles chance of finding coins while digging' },
    { id: 'net',           emoji: '🕸️', name: '🕸️ Fishing Net',     price: 350,   type: 'tool',        description: 'Catch more fish per use' },

    // ── Consumables ─────────────────────────────────────────────
    { id: 'elixir',        emoji: '⚗️', name: '⚗️ Elixir',          price: 300,   type: 'consumable',  description: 'Doubles your next dig/fish reward' },
    { id: 'energy_drink',  emoji: '⚡', name: '⚡ Energy Drink',    price: 150,   type: 'consumable',  description: 'Halves all cooldowns for 10 minutes' },
    { id: 'antidote',      emoji: '💊', name: '💊 Antidote',        price: 200,   type: 'consumable',  description: 'Clears all negative status effects' },
    { id: 'bomb',          emoji: '💣', name: '💣 Bomb',            price: 400,   type: 'consumable',  description: 'Deal massive damage in RPG battles' },
    { id: 'health_potion', emoji: '🧪', name: '🧪 Health Potion',   price: 250,   type: 'consumable',  description: 'Restore 50 HP in RPG battles' },
    { id: 'mega_potion',   emoji: '🧪', name: '🧪 Mega Potion',     price: 600,   type: 'consumable',  description: 'Restore 100 HP in RPG battles' },
    { id: 'speed_boost',   emoji: '💨', name: '💨 Speed Boost',     price: 350,   type: 'consumable',  description: 'Attack twice in your next battle turn' },

    // ── Weapons ─────────────────────────────────────────────────
    { id: 'sword',         emoji: '⚔️', name: '⚔️ Sword',           price: 400,   type: 'weapon',      description: '+15 attack power in RPG battles' },
    { id: 'katana',        emoji: '🗡️', name: '🗡️ Katana',          price: 800,   type: 'weapon',      description: '+25 attack power, chance to critical hit' },
    { id: 'bow',           emoji: '🏹', name: '🏹 Bow',             price: 500,   type: 'weapon',      description: '+20 attack, can hit before enemy attacks' },
    { id: 'axe',           emoji: '🪓', name: '🪓 Battle Axe',      price: 700,   type: 'weapon',      description: '+30 attack, -10 defense' },
    { id: 'spear',         emoji: '🔱', name: '🔱 Spear',           price: 600,   type: 'weapon',      description: '+20 attack, pierces shields' },
    { id: 'knife',         emoji: '🔪', name: '🔪 Knife',           price: 250,   type: 'weapon',      description: '+10% rob success chance' },
    { id: 'wand',          emoji: '🪄', name: '🪄 Magic Wand',      price: 900,   type: 'weapon',      description: '+35 magic attack in RPG battles' },
    { id: 'dagger',        emoji: '🗡️', name: '🗡️ Dagger',          price: 350,   type: 'weapon',      description: '+12 attack, good for stealth builds' },

    // ── Defense ─────────────────────────────────────────────────
    { id: 'shield',        emoji: '🛡️', name: '🛡️ Shield',          price: 500,   type: 'defense',     description: '+20 defense in RPG battles' },
    { id: 'armor',         emoji: '🧥', name: '🧥 Iron Armor',      price: 750,   type: 'defense',     description: '+35 defense in RPG battles' },
    { id: 'helmet',        emoji: '⛑️', name: '⛑️ Helmet',          price: 400,   type: 'defense',     description: '+15 defense, reduces crit damage' },
    { id: 'boots',         emoji: '👢', name: '👢 Speed Boots',     price: 300,   type: 'defense',     description: '+10 dodge chance in RPG battles' },
    { id: 'dragon_armor',  emoji: '🐉', name: '🐉 Dragon Armor',   price: 3000,  type: 'defense',     description: '+80 defense, fire resistance' },
    { id: 'cloak',         emoji: '🧣', name: '🧣 Shadow Cloak',    price: 600,   type: 'defense',     description: '+20 dodge chance in battle' },

    // ── Stealth / Rob ────────────────────────────────────────────
    { id: 'mask',          emoji: '🎭', name: '🎭 Mask',            price: 350,   type: 'stealth',     description: '+15% rob success chance' },
    { id: 'smoke_bomb',    emoji: '💨', name: '💨 Smoke Bomb',      price: 200,   type: 'stealth',     description: 'Escape failed rob without paying fine' },
    { id: 'invisibility',  emoji: '👻', name: '👻 Invisibility',    price: 800,   type: 'stealth',     description: "Can't be robbed for 30 minutes" },
    { id: 'lockpick',      emoji: '🗝️', name: '🗝️ Lockpick',        price: 400,   type: 'stealth',     description: '+20% rob success, no fine if caught' },

    // ── Gambling ─────────────────────────────────────────────────
    { id: 'lottery_ticket',emoji: '🎟️', name: '🎟️ Lottery Ticket', price: 100,   type: 'gambling',    description: 'Try your luck — 5% chance at 10,000 coins!' },
    { id: 'lucky_charm',   emoji: '🍀', name: '🍀 Lucky Charm',    price: 500,   type: 'gambling',    description: 'Increases gamble win chance to 60%' },
    { id: 'casino_pass',   emoji: '🎰', name: '🎰 Casino Pass',    price: 1000,  type: 'gambling',    description: 'Play casino with double max bets' },
    { id: 'dice_loaded',   emoji: '🎲', name: '🎲 Loaded Dice',    price: 600,   type: 'gambling',    description: 'Increases dice win chance by 20%' },

    // ── Cards ────────────────────────────────────────────────────
    { id: 'card_pack',     emoji: '🎴', name: '🎴 Card Pack',       price: 800,   type: 'cards',       description: 'Opens 3 random cards for your collection' },
    { id: 'rare_pack',     emoji: '🔵', name: '🔵 Rare Card Pack',  price: 2000,  type: 'cards',       description: 'Guaranteed Rare or higher card' },
    { id: 'epic_pack',     emoji: '🟣', name: '🟣 Epic Card Pack',  price: 5000,  type: 'cards',       description: 'Guaranteed Epic or higher card' },

    // ── Boosts ───────────────────────────────────────────────────
    { id: 'xp_boost',      emoji: '✨', name: '✨ XP Boost',        price: 400,   type: 'boost',       description: 'Double XP gains for 1 hour' },
    { id: 'coin_boost',    emoji: '💰', name: '💰 Coin Boost',      price: 600,   type: 'boost',       description: 'Earn 25% more from all activities for 1 hour' },
    { id: 'stardust_bag',  emoji: '⭐', name: '⭐ Stardust Bag',   price: 1500,  type: 'boost',       description: '+500 stardust immediately' },

    // ── Collectibles ─────────────────────────────────────────────
    { id: 'gem',           emoji: '💎', name: '💎 Gem',             price: 1000,  type: 'collectible', description: 'Rare collectible, can be traded or sold' },
    { id: 'crown',         emoji: '👑', name: '👑 Crown',           price: 5000,  type: 'collectible', description: 'Shows you are royalty in the group' },
    { id: 'dragon_egg',    emoji: '🥚', name: '🥚 Dragon Egg',      price: 10000, type: 'collectible', description: 'Ultra rare — hatch it with .use dragon egg' },
    { id: 'shadow_crystal',emoji: '🔮', name: '🔮 Shadow Crystal',  price: 3000,  type: 'collectible', description: 'Used to evolve Mythic cards' },
  ],

  // Gambling settings
  LOTTERY_JACKPOT: 10000,
  ROULETTE_NUMBERS: 37,
};
