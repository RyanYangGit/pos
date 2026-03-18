export const LOCALE = {
  appName: '展覽POS',
  appFullName: '展覽 POS 收銀系統',

  // Tabs
  tabPos: '收銀',
  tabOrders: '訂單',
  tabProducts: '商品',
  tabDashboard: '報表',
  tabSettings: '設定',

  // POS
  allCategories: '全部',
  cart: '購物車',
  cartEmpty: '購物車是空的',
  cartClear: '清空',
  checkout: '結帳',
  viewCart: '查看購物車',
  items: '件',
  total: '合計',
  orderNumber: '單號',

  // Checkout
  checkoutTitle: '確認結帳',
  paymentMethod: '付款方式',
  cash: '現金',
  linePay: 'LINE Pay',
  transfer: '轉帳',
  note: '備註',
  notePlaceholder: '選填備註...',
  cancel: '取消',
  confirm: '確認結帳',
  checkoutSuccess: '結帳成功！',

  // Products
  addProduct: '新增商品',
  editProduct: '編輯商品',
  productName: '商品名稱',
  productPrice: '價格',
  productStock: '庫存',
  productStockUnlimited: '不限',
  productCategory: '分類',
  productActive: '上架中',
  productInactive: '已下架',
  saveProduct: '儲存',
  deleteProduct: '刪除商品',
  deleteConfirm: '確定要刪除嗎？',
  categoryManage: '管理分類',
  addCategory: '新增分類',
  categoryName: '分類名稱',

  // Orders
  orderHistory: '訂單紀錄',
  filterByDate: '依日期篩選',
  filterByPayment: '依付款方式',
  orderDetail: '訂單明細',
  noOrders: '尚無訂單',
  synced: '已同步',
  notSynced: '未同步',
  cancelled: '已取消',
  cancelOrder: '取消訂單',
  cancelOrderConfirm: '確定要取消此訂單嗎？庫存將會回補。',
  cancelSuccess: '訂單已取消',

  // Dashboard
  dailyReport: '今日報表',
  totalRevenue: '營業額',
  totalTransactions: '交易筆數',
  avgTransaction: '平均客單價',
  paymentBreakdown: '付款方式佔比',
  topProducts: '熱銷商品',
  noData: '尚無資料',

  // Settings
  settings: '設定',
  shopName: '店舖名稱',
  deviceName: '裝置名稱',
  orderPrefix: '單號前綴',
  exportCsv: '匯出 CSV',
  exportJson: '匯出 JSON',
  importData: '匯入資料',
  cloudSync: '雲端同步',
  clearData: '清除所有資料',
  clearDataConfirm: '確定要清除所有資料嗎？此操作無法復原。',

  // Network
  online: '已連線',
  offline: '離線模式',

  // Currency
  currency: 'NT$',

  // Auth
  login: '登入',
  loginTitle: '帳號登入',
  username: '帳號',
  password: '密碼',
  loginButton: '登入',
  loginError: '帳號或密碼錯誤',
  loginNetworkError: '無法連線至伺服器',
  setPinTitle: '設定 PIN 碼',
  setPinDesc: '設定 4 位數 PIN 碼，用於快速解鎖',
  enterPin: '輸入 PIN 碼',
  confirmPin: '再次輸入 PIN 碼',
  pinMismatch: 'PIN 碼不一致，請重新輸入',
  unlockTitle: 'PIN 解鎖',
  pinError: 'PIN 碼錯誤',
  logout: '登出',
  lock: '鎖定',
  accountInfo: '帳號資訊',
  roleAdmin: '管理員',
  roleCashier: '收銀員',
  noPermission: '無權限存取此頁面',

  // Admin
  tabAdmin: '後台管理',
  adminProducts: '商品管理',
  adminCategories: '分類管理',

  // Barcode
  scanBarcode: '掃碼',
  barcode: '條碼',
  barcodePlaceholder: '掃描或輸入條碼...',
  barcodeNotFound: '查無此商品',
  barcodeAdded: '已加入購物車',
  openCamera: '鏡頭掃描',
  barcodeCheckout: '條碼結帳',
} as const
