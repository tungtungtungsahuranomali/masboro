import { registerRootComponent } from 'expo';

import App from './App';

// Polyfill Alert.alert for web — browser native dialog
if (typeof window !== 'undefined') {
  const RN = require('react-native');
  if (RN?.Alert?.alert) {
    const orig = RN.Alert.alert;
    RN.Alert.alert = (title, msg, buttons) => {
      if (buttons && buttons.length >= 2) {
        // Multi-button: OK = button[0], Cancel = button[1]
        if (window.confirm(title + '\n' + (msg || ''))) {
          buttons[0]?.onPress?.();
        } else {
          buttons[1]?.onPress?.();
        }
      } else if (buttons && buttons.length === 1) {
        if (window.confirm(title + '\n' + (msg || ''))) {
          buttons[0]?.onPress?.();
        }
      } else {
        window.alert(title + '\n' + (msg || ''));
      }
    };
  }
}

registerRootComponent(App);
