/**
 * Telegram Web App JS stub for local development
 * This file is used when running outside of Telegram
 */

if (typeof window !== 'undefined' && !window.Telegram) {
  console.warn('Running in development mode without Telegram WebApp');
  
  // Create a mock Telegram object for development
  window.Telegram = {
    WebApp: {
      initData: 'mock_init_data',
      initDataUnsafe: {
        user: {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ru',
        },
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock_hash',
      },
      version: '6.0',
      platform: 'web',
      colorScheme: 'dark',
      themeParams: {
        bg_color: '#000000',
        text_color: '#ffffff',
        hint_color: 'rgba(255, 255, 255, 0.6)',
        link_color: '#F55128',
        button_color: '#F55128',
        button_text_color: '#ffffff',
        secondary_bg_color: '#1A1A1A',
      },
      isExpanded: false,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      headerColor: '#000000',
      backgroundColor: '#000000',
      isClosingConfirmationEnabled: false,
      
      ready: function() {
        console.log('[Mock] Telegram WebApp ready');
      },
      
      expand: function() {
        console.log('[Mock] Telegram WebApp expand');
        this.isExpanded = true;
      },
      
      close: function() {
        console.log('[Mock] Telegram WebApp close');
      },
      
      enableClosingConfirmation: function() {
        console.log('[Mock] Closing confirmation enabled');
        this.isClosingConfirmationEnabled = true;
      },
      
      disableClosingConfirmation: function() {
        console.log('[Mock] Closing confirmation disabled');
        this.isClosingConfirmationEnabled = false;
      },
      
      MainButton: {
        text: '',
        color: '#F55128',
        textColor: '#ffffff',
        isVisible: false,
        isActive: true,
        isProgressVisible: false,
        
        setText: function(text) {
          console.log('[Mock] MainButton.setText:', text);
          this.text = text;
        },
        
        onClick: function(callback) {
          console.log('[Mock] MainButton.onClick registered');
          this._callback = callback;
        },
        
        offClick: function(callback) {
          console.log('[Mock] MainButton.offClick');
          this._callback = null;
        },
        
        show: function() {
          console.log('[Mock] MainButton.show');
          this.isVisible = true;
        },
        
        hide: function() {
          console.log('[Mock] MainButton.hide');
          this.isVisible = false;
        },
        
        enable: function() {
          console.log('[Mock] MainButton.enable');
          this.isActive = true;
        },
        
        disable: function() {
          console.log('[Mock] MainButton.disable');
          this.isActive = false;
        },
        
        showProgress: function(leaveActive) {
          console.log('[Mock] MainButton.showProgress');
          this.isProgressVisible = true;
        },
        
        hideProgress: function() {
          console.log('[Mock] MainButton.hideProgress');
          this.isProgressVisible = false;
        },
        
        setParams: function(params) {
          console.log('[Mock] MainButton.setParams:', params);
          Object.assign(this, params);
        },
      },
      
      BackButton: {
        isVisible: false,
        
        onClick: function(callback) {
          console.log('[Mock] BackButton.onClick registered');
          this._callback = callback;
        },
        
        offClick: function(callback) {
          console.log('[Mock] BackButton.offClick');
          this._callback = null;
        },
        
        show: function() {
          console.log('[Mock] BackButton.show');
          this.isVisible = true;
        },
        
        hide: function() {
          console.log('[Mock] BackButton.hide');
          this.isVisible = false;
        },
      },
      
      HapticFeedback: {
        impactOccurred: function(style) {
          console.log('[Mock] HapticFeedback.impactOccurred:', style);
        },
        
        notificationOccurred: function(type) {
          console.log('[Mock] HapticFeedback.notificationOccurred:', type);
        },
        
        selectionChanged: function() {
          console.log('[Mock] HapticFeedback.selectionChanged');
        },
      },
      
      openLink: function(url, options) {
        console.log('[Mock] openLink:', url, options);
        window.open(url, '_blank');
      },
      
      openTelegramLink: function(url) {
        console.log('[Mock] openTelegramLink:', url);
        window.open(url, '_blank');
      },
      
      showPopup: function(params, callback) {
        console.log('[Mock] showPopup:', params);
        alert(params.message);
        if (callback) callback('ok');
      },
      
      showAlert: function(message, callback) {
        console.log('[Mock] showAlert:', message);
        alert(message);
        if (callback) callback();
      },
      
      showConfirm: function(message, callback) {
        console.log('[Mock] showConfirm:', message);
        const result = confirm(message);
        if (callback) callback(result);
      },
      
      sendData: function(data) {
        console.log('[Mock] sendData:', data);
      },
      
      switchInlineQuery: function(query, choose_chat_types) {
        console.log('[Mock] switchInlineQuery:', query, choose_chat_types);
      },
    },
  };
}

