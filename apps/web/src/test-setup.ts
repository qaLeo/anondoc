import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import './i18n'   // initialise i18n singleton so useTranslation resolves EN strings in tests

// jsdom does not implement Blob/File .text() — polyfill via FileReader
if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}
