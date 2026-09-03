const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  login: (creds) => ipcRenderer.invoke('auth:login', creds),
  changePassword: (data) => ipcRenderer.invoke('auth:changePassword', data),

  getProducts: () => ipcRenderer.invoke('products:list'),
  getProduct: (id) => ipcRenderer.invoke('products:get', id),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (data) => ipcRenderer.invoke('products:update', data),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),

  getUsers: () => ipcRenderer.invoke('users:list'),
  createUser: (data) => ipcRenderer.invoke('users:create', data),
  updateUser: (data) => ipcRenderer.invoke('users:update', data),
  toggleUserActive: (data) => ipcRenderer.invoke('users:toggleActive', data),

  createSale: (data) => ipcRenderer.invoke('sales:create', data),
  getSales: (range) => ipcRenderer.invoke('sales:list', range),
  getSaleItems: (saleId) => ipcRenderer.invoke('sales:getItems', saleId),
  getSalesSummary: (range) => ipcRenderer.invoke('sales:summary', range),

  getDashboardStats: () => ipcRenderer.invoke('dashboard:stats'),

  printReceipt: (html) => ipcRenderer.invoke('print:receipt', html)
})
