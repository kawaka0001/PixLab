type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

interface LogContext {
  action?: string // ユーザーアクション
  imageInfo?: {
    // 画像メタデータ
    width: number
    height: number
    size: number
    format?: string
  }
  filterType?: string // 適用フィルター
  duration?: number // 処理時間
  params?: any // フィルターパラメータ
  error?: string // エラーメッセージ
  [key: string]: any // その他のコンテキスト
}

const logger = {
  log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    }

    // 色分けして見やすく
    const colors = {
      INFO: 'color: #3b82f6; font-weight: bold',
      WARN: 'color: #f59e0b; font-weight: bold',
      ERROR: 'color: #ef4444; font-weight: bold',
      DEBUG: 'color: #8b5cf6; font-weight: bold',
    }

    // コンソールに構造化されたログを出力
    console.log(
      `%c[${timestamp}] ${level}`,
      colors[level],
      message,
      context || ''
    )

    // 開発環境でのデバッグ用：JSON形式でも出力
    if (context && process.env.NODE_ENV === 'development') {
      console.log('📊 Context:', logData)
    }
  },

  info: (msg: string, ctx?: LogContext) => logger.log('INFO', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.log('WARN', msg, ctx),
  error: (msg: string, ctx?: LogContext) => logger.log('ERROR', msg, ctx),
  debug: (msg: string, ctx?: LogContext) => logger.log('DEBUG', msg, ctx),
}

export default logger
