export const MESSAGES = {
  // Data fetch / load
  ERR_FETCH_FAILED: "データの取得に失敗しました",
  ERR_LOAD_FAILED: "データの読み込みに失敗しました",
  ERR_DOWNLOAD_FAILED: "ダウンロードに失敗しました",

  // CRUD operations
  ERR_SAVE_FAILED: "保存に失敗しました。もう一度お試しください。",
  ERR_DELETE_FAILED: "削除に失敗しました",
  ERR_REGISTER_FAILED: "登録に失敗しました。入力内容を確認してください。",

  // Search
  ERR_SEARCH_FAILED: "検索に失敗しました",
  ERR_NAME_REQUIRED: "資産名を入力してください",
  ERR_NAME_REQUIRED_FOR_SEARCH: "先に資産名を入力してください",
  INFO_GAME_NOT_FOUND: "ゲーム情報が見つかりませんでした",

  // Admin
  ERR_ADMIN_INIT: "初期化エラー",
  ERR_ADMIN_WRONG_PASSWORD: "パスワードが正しくありません",
  ERR_SERVER_UNREACHABLE: "サーバーに接続できません (POST /api/admin/verify)",

  // Master data
  ERR_MASTERS_FETCH_FAILED:
    "マスタデータの取得に失敗しました。バックエンドの接続を確認してください。",
} as const;