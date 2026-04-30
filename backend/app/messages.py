# Admin auth
ERR_ADMIN_PASSWORD_NOT_SET = "管理者パスワードが設定されていません"
ERR_ADMIN_WRONG_PASSWORD = "パスワードが正しくありません"

# Image validation
ERR_UNSUPPORTED_FILE_FORMAT = "サポートされていないファイル形式です"
ERR_INVALID_IMAGE = "無効な画像ファイルです"

# Download
ERR_INVALID_DOWNLOAD_FORMAT = "format は 'csv' または 'json' を指定してください"

# Asset
ERR_ASSET_NOT_FOUND = "資産が見つかりません"
COPY_NAME_SUFFIX = " のコピー"
ERR_PHOTO_NOT_FOUND = "写真が見つかりません"
ERR_THUMBNAIL_NOT_FOUND = "サムネイルが見つかりません"
ERR_IMAGE_ROTATION_FAILED = "画像の回転に失敗しました"

# Master
ERR_INVALID_MASTER_TYPE = "不正なマスタータイプです"

# Search (RAWG API)
ERR_RAWG_API_KEY_MISSING = (
    "RAWG_API_KEY が未設定です。バックエンドの .env に RAWG_API_KEY を設定してください。"
)
ERR_RAWG_API_ACCESS_FAILED = "RAWG API へのアクセスに失敗しました"

# Search (Anthropic web search)
ERR_ANTHROPIC_API_KEY_MISSING = (
    "ANTHROPIC_API_KEY が未設定です。バックエンドの .env に ANTHROPIC_API_KEY を設定してください。"
)

# Stats
ERR_INVALID_PARAMETER = "不正なパラメータです"

X_AXIS_LABELS: dict[str, str] = {
    "hardware": "ハード",
    "genre": "ジャンル",
    "asset_category": "種類",
    "edition": "エディション",
    "release_year": "販売年",
}

Y_AXIS_LABELS: dict[str, str] = {
    "count": "資産数",
    "total_value": "合計評価額（円）",
    "avg_value": "平均評価額（円）",
}

# Server
ERR_SERVER_ERROR = "サーバーエラーが発生しました"

# App metadata
APP_TITLE = "ゲーム資産管理"
APP_VERSION = "2.0.0"